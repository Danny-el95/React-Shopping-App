import { createHash, randomBytes } from 'node:crypto';
import { pool } from './pool.js';

// Keep the same lifetime for the database session and browser cookie.
export const sessionDuration = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId, db = pool) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionDuration);
  const sql = 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)';

  // Store a hash, not the cookie's original token.
  await db.execute(sql, [hashToken(token), userId, expiresAt]);
  return token;
}

export async function findSessionUser(token) {
  const sql = `
    SELECT users.id, users.username, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > UTC_TIMESTAMP()
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [hashToken(token)]);
  return rows[0];
}

export async function deleteSession(token, db = pool) {
  await db.execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
}

// Use the caller's transaction: create the replacement before deleting the old one.
export async function replaceSession(userId, previousToken, db) {
  const token = await createSession(userId, db);
  if (previousToken) await deleteSession(previousToken, db);
  return token;
}
