import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from './user.repository.js';
import { HttpError } from '../../errors/http-error.js';
import { pool } from '../../db/pool.js';
import { replaceSession } from '../../db/session.repository.js';

export async function registerUser({ username, email, password }, previousToken = null) {
  // Hash before opening the transaction so hashing doesn't hold a DB connection.
  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const user = await createUser(username, email, passwordHash, connection);
    const token = await replaceSession(user.id, previousToken, connection);

    // The account, new session, and old-session removal succeed together.
    await connection.commit();
    return { user, token };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Email or username already exists');
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password');
  }

  // Only return fields that are safe to share with the client.
  return { id: String(user.id), username: user.username, email: user.email };
}
