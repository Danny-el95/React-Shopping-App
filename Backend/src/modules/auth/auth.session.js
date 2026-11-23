import { env } from '../../config/env.js';
import { HttpError } from '../../errors/http-error.js';
import { findSessionUser, deleteSession, replaceSession, sessionDuration } from '../../db/session.repository.js';
import { pool } from '../../db/pool.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function readSessionToken(req) {
  const cookies = (req.headers.cookie || '').split(';');
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith('session='));
  if (!sessionCookie) return null;

  const token = sessionCookie.trim().slice('session='.length);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

// Set the browser cookie only after the database transaction has committed.
export function setSessionCookie(res, token) {
  res.cookie('session', token, { ...cookieOptions, maxAge: sessionDuration });
}

export async function startSession(req, res, userId) {
  const connection = await pool.getConnection();
  let token;

  try {
    await connection.beginTransaction();
    token = await replaceSession(userId, readSessionToken(req), connection);
    await connection.commit();
  } catch (error) {
    // A failed insert or deletion leaves the original session intact.
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  setSessionCookie(res, token);
}

// Add this middleware to any backend route that requires a logged-in user.
export async function requireAuth(req, res, next) {
  const token = readSessionToken(req);
  const user = token ? await findSessionUser(token) : null;

  if (!user) {
    // Only logout clears the cookie. A delayed 401 must not erase a newer login.
    throw new HttpError(401, 'Please log in to continue');
  }

  req.user = { id: String(user.id), username: user.username, email: user.email };
  next();
}

export async function endSession(req, res) {
  const token = readSessionToken(req);
  if (token) await deleteSession(token);

  res.clearCookie('session', cookieOptions);
}
