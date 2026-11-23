import { HttpError } from '../../errors/http-error.js';
import { userExists } from './user.repository.js';

export function validateLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'A request body is required');
  }

  const { email, password } = body;

  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new HttpError(400, 'A valid email is required');
  }

  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new HttpError(400, 'Password must have at least 8 characters and at most 72 UTF-8 bytes');
  }

  return { email: email.trim().toLowerCase(), password };
}

export function validateRegistration(body) {
  const { email, password } = validateLogin(body);
  const { username } = body;

  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,100}$/.test(username.trim())) {
    throw new HttpError(400, 'Username must contain 3-100 letters, numbers, or underscores');
  }

  return { username: username.trim(), email, password };
}

export async function validateExistingUser(body) {
  const { username, email } = body;
  // A matching username or email means the account already exists.
  return await userExists(username.trim(), email.trim().toLowerCase());
}
