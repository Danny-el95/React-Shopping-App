import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, pendingMigrations, readMigrations } from '../src/db/migration-runner.js';
const files = [{ name: '0001_first.sql', checksum: 'a', sql: 'CREATE TABLE first (id INT)' }, { name: '0002_second.sql', checksum: 'b', sql: 'CREATE TABLE second (id INT)' }];
test('migration history rejects changed, missing or out-of-order files', () => {
  assert.deepEqual(pendingMigrations(files, [{ filename: files[0].name, checksum: 'a' }]), [files[1]]);
  for (const history of [[{ filename: files[0].name, checksum: 'changed' }], [{ filename: 'missing.sql', checksum: 'a' }], [{ filename: files[1].name, checksum: 'b' }]]) {
    assert.throws(() => pendingMigrations(files, history), /mismatch/);
  }
});
test('repository SQL migrations load in numbered order', async () => {
  const migrations = await readMigrations(new URL('../src/db/migrations/', import.meta.url));
  assert.deepEqual(migrations.map((file) => file.name), ['0001_create_users.sql', '0002_create_sessions.sql', '0003_create_products.sql', '0004_create_cart_items.sql', '0005_create_orders.sql', '0006_create_order_items.sql']);
  assert.equal(migrations[0].checksum.length, 64);
});
function connection(fail = false) {
  const calls = [];
  return { calls,
    async execute(sql, params) {
      calls.push([sql, params]);
      return [[{ acquired: 1 }]];
    },
    async query(sql) {
      calls.push([sql]);
      if (fail && sql === files[0].sql) throw Object.assign(new Error(), { code: 'FAIL' });
      return [[]];
    },
  };
}
test('migration failure stops execution, leaves no success record, and releases lock', async () => {
  const db = connection(true);
  await assert.rejects(migrate(db, files, { database: 'test', log: () => {} }), /DDL may have committed/);
  assert.equal(db.calls.some(([sql]) => sql.startsWith('INSERT INTO schema_migrations')), false);
  assert.equal(db.calls.some(([sql]) => sql === files[1].sql), false);
  assert.equal(db.calls.at(-1)[0], 'SELECT RELEASE_LOCK(?)');
});
test('status reports pending files without executing migration SQL', async () => {
  const db = connection();
  const output = [];
  await migrate(db, files, { database: 'test', statusOnly: true, log: (line) => output.push(line) });
  assert.equal(output.length, 2);
  assert.equal(db.calls.some(([sql]) => sql === files[0].sql), false);
});
