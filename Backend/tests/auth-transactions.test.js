import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Fault-injection tests use an in-memory transaction, never a live database.
Object.assign(process.env, { NODE_ENV: 'test', DB_HOST: 'localhost', DB_USER: 'test', DB_PASSWORD: '', DB_NAME: 'test' });
const { pool } = await import('../src/db/pool.js');
const { registerUser } = await import('../src/modules/auth/auth.service.js');
const { register } = await import('../src/modules/auth/auth.controller.js');
const { startSession } = await import('../src/modules/auth/auth.session.js');
after(() => pool.end());

const previousToken = 'a'.repeat(64);
const previousHash = createHash('sha256').update(previousToken).digest('hex');
const details = { username: 'new_user', email: 'new@example.com', password: 'password123' };

function fixture(failure) {
  let saved = { users: [{ id: '1', username: 'existing_user' }], sessions: [{ hash: previousHash, userId: '1' }] };
  let proposed;
  const events = [];
  const response = { cookies: [],
    cookie(name, token, options) { events.push('cookie'); this.cookies.push({ name, token, options }); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; events.push('response'); },
  };
  const connection = {
    async beginTransaction() { proposed = structuredClone(saved); events.push('begin'); },
    async commit() {
      events.push('commit');
      if (failure === 'commit') throw Object.assign(new Error(), { code: 'COMMIT_FAILED' });
      saved = structuredClone(proposed);
    },
    async rollback() { events.push('rollback'); proposed = structuredClone(saved); },
    release() { events.push('release'); },
    async execute(sql, values) {
      if (sql.startsWith('INSERT INTO users')) {
        events.push('insert-user');
        if (failure === 'duplicate') throw Object.assign(new Error(), { code: 'ER_DUP_ENTRY' });
        proposed.users.push({ id: '2', username: values[0] });
        return [{ insertId: 2 }];
      }
      if (sql.startsWith('INSERT INTO sessions')) {
        events.push('insert-session');
        if (failure === 'session') throw Object.assign(new Error(), { code: 'SESSION_INSERT_FAILED' });
        proposed.sessions.push({ hash: values[0], userId: values[1] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('DELETE FROM sessions')) {
        events.push('delete-session');
        if (failure === 'delete') throw Object.assign(new Error(), { code: 'SESSION_DELETE_FAILED' });
        proposed.sessions = proposed.sessions.filter((session) => session.hash !== values[0]);
        return [{ affectedRows: 1 }];
      }
      throw new Error('Unexpected SQL in auth fixture');
    },
  };
  return { connection, response, events, saved: () => saved };
}

function useFixture(t, db) {
  t.mock.method(pool, 'getConnection', async () => db.connection);
  t.mock.method(pool, 'execute', async (sql) => {
    // Only the controller's optional existing-user lookup may use the pool.
    if (sql.startsWith('SELECT 1 FROM users')) return [[]];
    throw new Error('Auth write escaped the transaction');
  });
}

test('registration commits user and session before setting the cookie', async (t) => {
  const db = fixture();
  useFixture(t, db);
  await register({ body: details, headers: { cookie: `session=${previousToken}` } }, db.response);
  assert.equal(db.saved().users.length, 2);
  assert.equal(db.saved().sessions.length, 1);
  assert.equal(db.saved().sessions[0].userId, '2');
  assert.equal(db.saved().sessions.some((session) => session.hash === previousHash), false);
  assert.ok(db.events.indexOf('insert-session') < db.events.indexOf('delete-session'));
  assert.ok(db.events.indexOf('commit') < db.events.indexOf('cookie'));
  assert.equal(db.response.statusCode, 201);
  assert.deepEqual(db.response.body.user, { id: '2', username: details.username, email: details.email });
  assert.equal(db.response.body.token, undefined);
  assert.equal(db.response.cookies[0].options.httpOnly, true);
});

test('failed signup session insert removes the proposed account and preserves the old login', async (t) => {
  const db = fixture('session');
  useFixture(t, db);
  await assert.rejects(register({ body: details, headers: { cookie: `session=${previousToken}` } }, db.response), { code: 'SESSION_INSERT_FAILED' });
  assert.equal(db.saved().users.length, 1);
  assert.deepEqual(db.saved().sessions, [{ hash: previousHash, userId: '1' }]);
  assert.equal(db.events.includes('delete-session'), false);
  assert.equal(db.response.cookies.length, 0);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('failed old-session deletion rolls back the new account and replacement session', async (t) => {
  const db = fixture('delete');
  useFixture(t, db);
  await assert.rejects(registerUser(details, previousToken), { code: 'SESSION_DELETE_FAILED' });
  assert.equal(db.saved().users.length, 1);
  assert.deepEqual(db.saved().sessions, [{ hash: previousHash, userId: '1' }]);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('failed registration commit sends no cookie and retains the original state', async (t) => {
  const db = fixture('commit');
  useFixture(t, db);
  await assert.rejects(register({ body: details, headers: {} }, db.response), { code: 'COMMIT_FAILED' });
  assert.equal(db.saved().users.length, 1);
  assert.equal(db.response.cookies.length, 0);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('duplicate registration rolls back without touching the old session', async (t) => {
  const db = fixture('duplicate');
  useFixture(t, db);
  await assert.rejects(registerUser(details, previousToken), { status: 409 });
  assert.equal(db.events.includes('insert-session'), false);
  assert.deepEqual(db.saved().sessions, [{ hash: previousHash, userId: '1' }]);
  assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
});

test('login rotation creates the replacement before deleting the old session', async (t) => {
  const db = fixture();
  useFixture(t, db);
  await startSession({ headers: { cookie: `session=${previousToken}` } }, db.response, '1');
  assert.equal(db.saved().sessions.length, 1);
  assert.notEqual(db.saved().sessions[0].hash, previousHash);
  assert.deepEqual(db.events, ['begin', 'insert-session', 'delete-session', 'commit', 'release', 'cookie']);
});

test('login replacement failure leaves the original session and cookie intact', async (t) => {
  for (const failure of ['session', 'delete', 'commit']) {
    const db = fixture(failure);
    useFixture(t, db);
    await assert.rejects(startSession({ headers: { cookie: `session=${previousToken}` } }, db.response, '1'));
    assert.deepEqual(db.saved().sessions, [{ hash: previousHash, userId: '1' }]);
    assert.equal(db.response.cookies.length, 0);
    assert.deepEqual(db.events.slice(-2), ['rollback', 'release']);
  }
});
