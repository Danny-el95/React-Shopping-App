import { test, after } from 'node:test';
import assert from 'node:assert/strict';

// All database calls in this file are mocked; no real cart data is changed.
Object.assign(process.env, { NODE_ENV: 'test', DB_HOST: 'localhost', DB_USER: 'test', DB_PASSWORD: '', DB_NAME: 'test' });
const { pool } = await import('../src/db/pool.js');
const { calculateCartTotals, setCartQuantity, addItemToCart, emptyCart } = await import('../src/modules/cart/cart.service.js');
after(() => pool.end());

// Model committed rows separately from the transaction's proposed rows.
function databaseFixture(rows) {
  let committed = structuredClone(rows);
  let proposed = structuredClone(rows);
  const events = [];
  const connection = {
    async beginTransaction() { proposed = structuredClone(committed); events.push('begin'); },
    async commit() { committed = structuredClone(proposed); events.push('commit'); },
    async rollback() { proposed = structuredClone(committed); events.push('rollback'); },
    release() { events.push('release'); },
    async execute(sql, values) {
      if (sql.includes('FOR UPDATE')) { events.push('lock'); return [[{ id: values[0] }]]; }
      if (sql.includes('FROM cart_items c')) { events.push('read'); return [structuredClone(proposed)]; }
      if (sql.trim().startsWith('UPDATE cart_items')) {
        events.push('write');
        proposed.find((row) => row.product_id === values[2]).quantity = values[0];
        return [{ affectedRows: 1 }];
      }
      if (sql.trim().startsWith('INSERT INTO cart_items')) {
        events.push('write');
        proposed.find((row) => row.product_id === values[1]).quantity++;
        return [{ affectedRows: 2 }];
      }
      if (sql.startsWith('DELETE FROM cart_items')) { events.push('write'); proposed = []; return [{ affectedRows: committed.length }]; }
      throw new Error('Unexpected fixture SQL');
    },
  };
  return { connection, events, rows: () => committed };
}

function row(id, price, quantity = 1, active = 1) {
  return { product_id: id, name: 'Cart test fixture', price, quantity, image: '', description: '', is_active: active };
}

function useDatabase(t, fixture) {
  t.mock.method(pool, 'getConnection', async () => fixture.connection);
  // A pool query would escape the transaction and must fail this test.
  t.mock.method(pool, 'execute', async () => { throw new Error('Query escaped the transaction connection'); });
}

test('safe quantity update commits the matching summary and releases the connection', async (t) => {
  const db = databaseFixture([row(1, '9.99')]);
  useDatabase(t, db);
  const cart = await setCartQuantity('1', 1, 3);
  assert.equal(cart.subtotalCents, 2997);
  assert.equal(cart.items[0].lineTotalCents, 2997);
  assert.equal(db.rows()[0].quantity, 3);
  assert.ok(db.events.indexOf('lock') < db.events.indexOf('write'));
  assert.deepEqual(db.events.slice(-3), ['read', 'commit', 'release']);
});

test('unsafe line total rolls back the quantity instead of poisoning the saved cart', async (t) => {
  const db = databaseFixture([row(1, '25000.00')]);
  useDatabase(t, db);
  await assert.rejects(setCartQuantity('1', 1, 4294967295), { status: 400 });
  assert.equal(db.rows()[0].quantity, 1);
  assert.equal(db.events.includes('commit'), false);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('unsafe subtotal rolls back even when each individual line total is safe', async (t) => {
  const db = databaseFixture([row(1, '99999999.99', 450000), row(2, '99999999.99')]);
  useDatabase(t, db);
  await assert.rejects(setCartQuantity('1', 2, 500000), { status: 400 });
  assert.equal(db.rows()[1].quantity, 1);
  assert.equal(db.events.includes('commit'), false);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('adding another unit also rolls back if it makes the total unsafe', async (t) => {
  const quantity = Math.floor(Number.MAX_SAFE_INTEGER / 2500000);
  const db = databaseFixture([row(1, '25000.00', quantity)]);
  useDatabase(t, db);
  await assert.rejects(addItemToCart('1', 1), { status: 400 });
  assert.equal(db.rows()[0].quantity, quantity);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('unavailable products are rejected before a quantity write', async (t) => {
  const db = databaseFixture([row(1, '9.99', 1, 0)]);
  useDatabase(t, db);
  await assert.rejects(setCartQuantity('1', 1, 3), { status: 409 });
  assert.equal(db.events.includes('write'), false);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('clearing a cart commits an empty summary', async (t) => {
  const db = databaseFixture([row(1, '9.99')]);
  useDatabase(t, db);
  const cart = await emptyCart('1');
  assert.deepEqual(cart.items, []);
  assert.equal(cart.subtotalCents, 0);
  assert.match(cart.cartVersion, /^[a-f0-9]{64}$/);
  assert.deepEqual(db.rows(), []);
  assert.deepEqual(db.events.slice(-2), ['commit', 'release']);
});

test('cent calculations handle decimal prices and exclude unavailable items', () => {
  const result = calculateCartTotals([
    { quantity: 3, product: { price: 0.10, isActive: true } },
    { quantity: 2, product: { price: 9.99, isActive: false } },
  ]);
  assert.equal(result.subtotalCents, 30);
  assert.deepEqual(result.items.map((item) => item.lineTotalCents), [30, 0]);
});
