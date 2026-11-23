import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/db/pool.js';
import { placeOrder } from '../src/modules/orders/order.service.js';
import { getCartVersion } from '../src/modules/cart/cart.service.js';
import { formatOrderId, readOrderId, validateCheckout, validateHistoryQuery } from '../src/modules/orders/order.validation.js';

test('readable references round-trip BIGINT values without losing precision', () => {
  assert.equal(formatOrderId('12'), 'NS-000012');
  assert.equal(readOrderId(' #ns-000012 '), '12');
  assert.equal(readOrderId(formatOrderId('18446744073709551615')), '18446744073709551615');
  for (const value of ['NS-0', 'NS-18446744073709551616', 'bad', 'NS-1 OR 1=1']) {
    assert.throws(() => readOrderId(value), { status: 400 });
  }
});

test('checkout accepts only a retry key and cart fingerprint; ignores client totals', () => {
  const requestKey = randomUUID();
  assert.deepEqual(validateCheckout({ requestKey, expectedCartVersion: 'a'.repeat(64), totalCents: 1 }), {
    requestKey, expectedCartVersion: 'a'.repeat(64),
  });
  assert.throws(() => validateCheckout({ requestKey: 'bad' }), { status: 400 });
  assert.throws(() => validateHistoryQuery({ limit: 51 }), { status: 400 });
  assert.equal(validateHistoryQuery({ search: 'ns-000012' }).orderId, '12');
});

test('cart fingerprint detects equal-price substitutions and account changes', () => {
  const items = [{ id: 1, quantity: 1, product: { price: 1, isActive: true } }];
  assert.notEqual(getCartVersion('1', items), getCartVersion('2', items));
  assert.notEqual(getCartVersion('1', items), getCartVersion('1', [{ ...items[0], id: 2 }]));
});

// Simulate a database failure after the header was inserted. No real SQL runs.
test('failed snapshot insert rolls back checkout and never clears the cart', async (t) => {
  const events = [];
  const items = [{ id: 1, quantity: 2, product: { price: 9.99, isActive: true } }];
  const connection = {
    async beginTransaction() { events.push('begin'); },
    async commit() { events.push('commit'); },
    async rollback() { events.push('rollback'); },
    release() { events.push('release'); },
    async execute(sql) {
      if (sql.includes('FROM users')) return [[{ id: '1' }]];
      if (sql.includes('request_key =')) return [[]];
      if (sql.includes('FROM cart_items c')) return [[{ product_id: 1, quantity: 2, name: 'Nuts', price: '9.99', is_active: 1 }]];
      if (sql.includes('INSERT INTO orders ')) { events.push('header'); return [{ insertId: 1 }]; }
      if (sql.includes('INSERT INTO order_items')) throw new Error('Simulated snapshot insert failure');
      if (sql.includes('DELETE FROM cart_items')) events.push('clear');
      throw new Error('Unexpected query');
    },
  };
  t.mock.method(pool, 'getConnection', async () => connection);
  await assert.rejects(placeOrder({ id: '1', email: 'test@example.invalid' }, {
    requestKey: randomUUID(), expectedCartVersion: getCartVersion('1', items),
  }), /Simulated snapshot/);
  assert.deepEqual(events, ['begin', 'header', 'rollback', 'release']);
});
