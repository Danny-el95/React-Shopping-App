import { pool } from '../../db/pool.js';

export async function createUser(username, email, passwordHash, db = pool) {
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  const [result] = await db.execute(sql, [username, email, passwordHash]);

  return { id: String(result.insertId), username, email };
}

export async function findUserByEmail(email) {
  const sql = 'SELECT id, username, email, password FROM users WHERE email = ? LIMIT 1';
  const [rows] = await pool.execute(sql, [email]);

  return rows[0];
}

export async function userExists(username, email) {
  const sql = 'SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1';
  const [rows] = await pool.execute(sql, [username, email]);

  return rows.length > 0;
}
