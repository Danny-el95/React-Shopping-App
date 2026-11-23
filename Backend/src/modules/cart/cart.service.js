import {
  findCartItems,
  addCartItem,
  updateCartQuantity,
  deleteCartItem,
  deleteCartItems,
  lockCartOwner,
} from './cart.repository.js';
import { pool } from '../../db/pool.js';
import { HttpError } from '../../errors/http-error.js';
import { createHash } from 'node:crypto';

// Calculate money in integer cents instead of adding decimal prices.
export function calculateCartTotals(cartItems) {
  let subtotalCents = 0;

  const items = cartItems.map((item) => {
    const unitPriceCents = Math.round(item.product.price * 100);

    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new HttpError(400, 'The product price is invalid or too large');
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new HttpError(400, 'The cart quantity must be a positive whole number');
    }

    // Keep unavailable products visible, but exclude them from checkout totals.
    const lineTotalCents = item.product.isActive
      ? unitPriceCents * item.quantity
      : 0;

    if (!Number.isSafeInteger(lineTotalCents)) {
      throw new HttpError(400, 'The cart amount is too large');
    }

    subtotalCents += lineTotalCents;

    // Reject amounts JavaScript cannot represent exactly as integer cents.
    if (!Number.isSafeInteger(subtotalCents)) {
      throw new HttpError(400, 'The cart amount is too large');
    }

    return { ...item, unitPriceCents, lineTotalCents };
  });

  return { items, subtotalCents };
}

// Read current database prices and return the complete calculated cart.
export async function getCartSummary(userId, db = pool) {
  const items = await findCartItems(userId, db);
  return { ...calculateCartTotals(items), cartVersion: getCartVersion(userId, items) };
}

// A fingerprint detects changed products, quantities, availability, or prices.
export function getCartVersion(userId, items) {
  const snapshot = items.map((item) => [item.id, item.quantity, Math.round(item.product.price * 100), item.product.isActive]);
  return createHash('sha256').update(JSON.stringify([String(userId), snapshot])).digest('hex');
}

// Commit only after the resulting cart passes total validation.
async function changeCart(userId, updateCart) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Prevent simultaneous requests from validating different changes in one cart.
    const ownerExists = await lockCartOwner(userId, connection);
    if (!ownerExists) throw new HttpError(401, 'Please log in to continue');

    // Writes remain temporary until commit. Read them through the same connection.
    await updateCart(connection);
    const cart = await getCartSummary(userId, connection);

    // Unsafe line totals or subtotal throw above, so this is never reached for them.
    await connection.commit();
    return cart;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Add or increment a product, then validate the entire proposed cart.
export async function addItemToCart(userId, productId) {
  return changeCart(userId, async (connection) => {
    try {
      const added = await addCartItem(userId, productId, connection);
      if (!added) throw new HttpError(404, 'Product not found or unavailable');
    } catch (error) {
      if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
        throw new HttpError(409, 'The maximum quantity for this item has been reached');
      }
      throw error;
    }
  });
}

// Check item availability before changing its quantity inside the transaction.
export async function setCartQuantity(userId, productId, quantity) {
  return changeCart(userId, async (connection) => {
    const items = await findCartItems(userId, connection);
    const item = items.find((item) => item.id === productId);

    if (!item) throw new HttpError(404, 'Item not found in your cart');
    if (!item.product.isActive) throw new HttpError(409, 'Product is currently unavailable');

    await updateCartQuantity(userId, productId, quantity, connection);
  });
}

// Deletion also returns a validated cart and rolls back on an invalid result.
export async function removeItemFromCart(userId, productId) {
  return changeCart(userId, (connection) => deleteCartItem(userId, productId, connection));
}

// An empty cart passes validation with a zero subtotal.
export async function emptyCart(userId) {
  return changeCart(userId, (connection) => deleteCartItems(userId, connection));
}
