import { pool } from '../../db/pool.js';
import { formatOrderId } from './order.validation.js';
import { HttpError } from '../../errors/http-error.js';

function money(value) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new HttpError(500, 'Stored order amount is invalid');
  return amount;
}

function formatOrder(row, items) {
  return {
    id: formatOrderId(row.id),
    reference: formatOrderId(row.id),
    customerEmail: row.customer_email,
    status: row.status,
    currency: row.currency,
    subtotalCents: money(row.subtotal_cents),
    totalCents: money(row.total_cents),
    createdAt: new Date(row.created_at).toISOString(),
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
    items: items.filter((item) => String(item.order_id) === String(row.id)).map((item) => ({
      id: String(item.id),
      productId: item.product_id === null ? null : Number(item.product_id),
      name: item.product_name,
      quantity: Number(item.quantity),
      unitPriceCents: money(item.unit_price_cents),
      lineTotalCents: money(item.line_total_cents),
    })),
  };
}

// Fetch snapshots, never current product prices, and always scope by session user.
async function readItems(userId, ids, db) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await db.execute(`
    SELECT i.* FROM order_items i JOIN orders o ON o.id = i.order_id
    WHERE o.user_id = ? AND o.id IN (${placeholders}) ORDER BY i.id
  `, [userId, ...ids]);
  return rows;
}

export async function findOrders(userId, { page, limit, orderId }, db = pool) {
  const filter = orderId ? ' AND id = ?' : '';
  const params = orderId ? [userId, orderId] : [userId];
  const [counts] = await db.execute(`SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND archived_at IS NULL${filter}`, params);
  const [rows] = await db.execute(`
    SELECT * FROM orders WHERE user_id = ? AND archived_at IS NULL${filter}
    ORDER BY id DESC LIMIT ? OFFSET ?
  `, [...params, limit, (page - 1) * limit]);
  const items = await readItems(userId, rows.map((row) => row.id), db);
  const total = Number(counts[0].total);
  let historyTotal = total;
  if (orderId) {
    const [allCounts] = await db.execute('SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND archived_at IS NULL', [userId]);
    historyTotal = Number(allCounts[0].total);
  }
  return { orders: rows.map((row) => formatOrder(row, items)), page, limit, total, historyTotal, totalPages: Math.ceil(total / limit) };
}

export async function findOrder(userId, orderId, db = pool) {
  const [rows] = await db.execute('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
  if (!rows[0]) return null;
  return formatOrder(rows[0], await readItems(userId, [orderId], db));
}

export async function findOrderRequest(userId, requestKey, db) {
  const [rows] = await db.execute('SELECT id, cart_version FROM orders WHERE user_id = ? AND request_key = ?', [userId, requestKey]);
  return rows[0];
}

export async function insertOrder(user, details, cart, db) {
  const [result] = await db.execute(`
    INSERT INTO orders (user_id, request_key, cart_version, customer_email, subtotal_cents, total_cents, created_at)
    VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))
  `, [user.id, details.requestKey, details.expectedCartVersion, user.email, cart.subtotalCents, cart.subtotalCents]);
  const id = String(result.insertId);
  for (const item of cart.items) {
    await db.execute(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_cents, line_total_cents)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, item.id, item.product.name, item.quantity, item.unitPriceCents, item.lineTotalCents]);
  }
  return id;
}

export async function archiveOrderRecord(userId, orderId, db = pool) {
  await db.execute('UPDATE orders SET archived_at = COALESCE(archived_at, UTC_TIMESTAMP(3)) WHERE id = ? AND user_id = ?', [orderId, userId]);
  return findOrder(userId, orderId, db);
}
