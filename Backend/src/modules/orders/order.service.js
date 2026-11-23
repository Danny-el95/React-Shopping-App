import { pool } from '../../db/pool.js';
import { HttpError } from '../../errors/http-error.js';
import { lockCartOwner, findCartItems, deleteCartItems } from '../cart/cart.repository.js';
import { calculateCartTotals, getCartSummary, getCartVersion } from '../cart/cart.service.js';
import { findOrderRequest, findOrder, insertOrder } from './order.repository.js';

// Save the complete order and clear its cart as one database operation.
export async function placeOrder(user, details) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!await lockCartOwner(user.id, connection)) throw new HttpError(401, 'Please log in to continue');

    // Check retries before checking for an empty cart: it may already be purchased.
    const existing = await findOrderRequest(user.id, details.requestKey, connection);
    if (existing) {
      if (existing.cart_version !== details.expectedCartVersion) throw new HttpError(409, 'This checkout key was already used for another cart');
      const order = await findOrder(user.id, existing.id, connection);
      const cart = await getCartSummary(user.id, connection);
      await connection.commit();
      return { order, cart, replayed: true };
    }

    // Lock current product prices until the order transaction commits.
    const items = await findCartItems(user.id, connection, true);
    if (!items.length) throw new HttpError(400, 'Your cart is empty');
    if (items.some((item) => !item.product.isActive)) throw new HttpError(409, 'Remove unavailable products before placing an order');
    if (getCartVersion(user.id, items) !== details.expectedCartVersion) {
      throw new HttpError(409, 'Your cart or its prices changed. Please reload and review your cart');
    }

    const summary = calculateCartTotals(items);
    const id = await insertOrder(user, details, summary, connection);
    await deleteCartItems(user.id, connection);
    const order = await findOrder(user.id, id, connection);
    const cart = await getCartSummary(user.id, connection);
    await connection.commit();
    return { order, cart, replayed: false };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
