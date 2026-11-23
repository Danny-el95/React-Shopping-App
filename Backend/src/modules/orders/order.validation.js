import { HttpError } from '../../errors/http-error.js';

export function formatOrderId(id) {
  return `NS-${String(id).padStart(6, '0')}`;
}

// Read the public reference without converting BIGINT database IDs to Number.
export function readOrderId(value) {
  const match = /^NS-(\d{1,20})$/i.exec(String(value).trim().replace(/^#/, ''));
  if (!match || BigInt(match[1]) < 1n || BigInt(match[1]) > 18446744073709551615n) {
    throw new HttpError(400, 'Use an order ID such as NS-000001');
  }
  return BigInt(match[1]).toString();
}

export function validateCheckout(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Checkout details are required');
  const { requestKey, expectedCartVersion } = body;
  if (typeof requestKey !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestKey)) {
    throw new HttpError(400, 'A valid checkout request key is required');
  }
  if (typeof expectedCartVersion !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedCartVersion)) {
    throw new HttpError(400, 'Please reload your cart before placing the order');
  }
  return { requestKey: requestKey.toLowerCase(), expectedCartVersion: expectedCartVersion.toLowerCase() };
}

export function validateHistoryQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || page > 1000000 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new HttpError(400, 'Invalid order history page or limit');
  }
  const search = query.search ?? '';
  if (typeof search !== 'string') throw new HttpError(400, 'Order search must be text');
  return { page, limit, orderId: search.trim() ? readOrderId(search) : null };
}
