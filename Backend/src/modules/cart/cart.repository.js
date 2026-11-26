import { pool } from '../../db/pool.js';
import { getProductImageUrl } from '../../utils/getProductImageUrl.js';

// Read only this user's cart and attach current product details.
export async function findCartItems(userId, db = pool, lockRows = false) {
  const sql = `
    SELECT c.product_id, c.quantity,
           p.name, p.price, p.image, p.description, p.is_active, p.package_weight_grams
    FROM cart_items c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
    ORDER BY c.product_id
    ${lockRows ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await db.execute(sql, [userId]);

  // Keep unavailable products visible so the frontend can explain them.
  return rows.map((row) => ({
    id: Number(row.product_id),
    quantity: Number(row.quantity),
    product: {
      id: Number(row.product_id),
      name: row.name,
      price: Number(row.price),
      packageWeightGrams: Number(row.package_weight_grams),
      image: getProductImageUrl(row.image),
      description: row.description,
      isActive: Boolean(row.is_active),
    },
  }));
}

// Add one item, or increment its existing quantity in one atomic SQL statement.
export async function addCartItem(userId, productId, db = pool) {
  const sql = `
    INSERT INTO cart_items (user_id, product_id, quantity)
    SELECT ?, id, 1 FROM products WHERE id = ? AND is_active = TRUE
    ON DUPLICATE KEY UPDATE quantity = cart_items.quantity + 1
  `;
  const [result] = await db.execute(sql, [userId, productId]);
  return result.affectedRows > 0;
}

// Set the quantity of an active product already in this user's cart.
export async function updateCartQuantity(userId, productId, quantity, db = pool) {
  const sql = `
    UPDATE cart_items c
    JOIN products p ON p.id = c.product_id
    SET c.quantity = ?
    WHERE c.user_id = ? AND c.product_id = ? AND p.is_active = TRUE
  `;
  await db.execute(sql, [quantity, userId, productId]);
}

// Remove a product without affecting anyone else's cart.
export async function deleteCartItem(userId, productId, db = pool) {
  await db.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
}

// Empty only the authenticated user's cart.
export async function deleteCartItems(userId, db = pool) {
  await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
}

// Serialize this user's cart changes, even when the cart is initially empty.
// Call this only on a connection with an active transaction.
export async function lockCartOwner(userId, db) {
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
  return rows.length > 0;
}
