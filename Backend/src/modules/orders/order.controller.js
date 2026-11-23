import { placeOrder } from './order.service.js';
import { findOrders, findOrder, archiveOrderRecord } from './order.repository.js';
import { validateCheckout, validateHistoryQuery, readOrderId } from './order.validation.js';
import { HttpError } from '../../errors/http-error.js';

export async function createOrder(req, res) {
  const result = await placeOrder(req.user, validateCheckout(req.body));
  res.status(result.replayed ? 200 : 201).json(result);
}

export async function getOrders(req, res) {
  res.json(await findOrders(req.user.id, validateHistoryQuery(req.query)));
}

export async function getOrder(req, res) {
  const order = await findOrder(req.user.id, readOrderId(req.params.id));
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order });
}

export async function archiveOrder(req, res) {
  const order = await archiveOrderRecord(req.user.id, readOrderId(req.params.id));
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order });
}
