import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

// These checks are deferred and use a mocked database when run.
Object.assign(process.env, {
  NODE_ENV: 'test', DB_HOST: 'localhost', DB_USER: 'test', DB_PASSWORD: '', DB_NAME: 'test',
});
const { validateLogin, validateRegistration } = await import('../src/modules/auth/auth.validation.js');
const { createUser } = await import('../src/modules/auth/user.repository.js');
const { registerUser, loginUser } = await import('../src/modules/auth/auth.service.js');
const { pool } = await import('../src/db/pool.js');
after(() => pool.end());

// Registration now uses one transaction connection for both SQL inserts.
function registrationConnection(t, execute) {
  t.mock.method(pool, 'getConnection', async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute,
  }));
}

test('registration validation normalizes email and preserves password', () => {
  assert.deepEqual(validateRegistration({ username: ' alice ', email: ' Alice@Example.COM ', password: ' password ' }), {
    username: 'alice', email: 'alice@example.com', password: ' password ',
  });
});

test('validation rejects invalid input and oversized passwords', () => {
  for (const body of [undefined, [], {}, { email: 'bad', password: 'password' }, { email: 'a@b.com', password: 'short' }, { email: 'a@b.com', password: '\u{1F600}'.repeat(19) }]) {
    assert.throws(() => validateLogin(body), { status: 400 });
  }
  assert.throws(() => validateRegistration({ username: '<script>', email: 'a@b.com', password: 'password' }), { status: 400 });
});

test('repository keeps SQL separate from values', async (t) => {
  let query;
  let values;
  t.mock.method(pool, 'execute', async (sql, params) => {
    query = sql;
    values = params;
    return [{ insertId: 7 }];
  });
  const user = await createUser("a' OR 1=1", 'a@b.com', 'hash');
  assert.equal(query, 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
  assert.deepEqual(values, ["a' OR 1=1", 'a@b.com', 'hash']);
  assert.deepEqual(user, { id: '7', username: "a' OR 1=1", email: 'a@b.com' });
});

test('registration hashes passwords and returns only public fields', async (t) => {
  let storedHash;
  registrationConnection(t, async (sql, values) => {
    if (sql.startsWith('INSERT INTO users')) storedHash = values[2];
    return [{ insertId: 1 }];
  });
  const { user, token } = await registerUser({ username: 'alice', email: 'a@b.com', password: 'password' });
  assert.equal(await bcrypt.compare('password', storedHash), true);
  assert.deepEqual(user, { id: '1', username: 'alice', email: 'a@b.com' });
  assert.match(token, /^[a-f0-9]{64}$/);
});

test('registration translates duplicate constraint errors', async (t) => {
  registrationConnection(t, async () => {
    throw Object.assign(new Error(), { code: 'ER_DUP_ENTRY' });
  });
  await assert.rejects(registerUser({ username: 'alice', email: 'a@b.com', password: 'password' }), { status: 409 });
});

test('login checks passwords and returns public fields only', async (t) => {
  const password = await bcrypt.hash('password', 12);
  t.mock.method(pool, 'execute', async () => [[{ id: 1, username: 'alice', email: 'a@b.com', password }]]);
  assert.deepEqual(await loginUser({ email: 'a@b.com', password: 'password' }), { id: '1', username: 'alice', email: 'a@b.com' });
  await assert.rejects(loginUser({ email: 'a@b.com', password: 'wrong-password' }), { status: 401, message: 'Invalid email or password' });
});

test('login rejects unknown accounts', async (t) => {
  t.mock.method(pool, 'execute', async () => [[]]);
  await assert.rejects(loginUser({ email: 'unknown@b.com', password: 'password' }), { status: 401, message: 'Invalid email or password' });
});
