import { validateRegistration, validateLogin, validateExistingUser } from './auth.validation.js';
import { registerUser, loginUser } from './auth.service.js';
import { startSession, endSession, readSessionToken, setSessionCookie } from './auth.session.js';

// Read the request, call the service, and send a response.
export async function register(req, res) {
  const details = validateRegistration(req.body);
  const ifUserExist = await validateExistingUser(details);
  if (!ifUserExist) {
    const { user, token } = await registerUser(details, readSessionToken(req));
    setSessionCookie(res, token);
    res.status(201).json({ message: 'Account created successfully', user });
  } else {
    res.status(409).json({ message: 'User exists, sign in instead' });
  }
}

export async function login(req, res) {
  const details = validateLogin(req.body);
  const user = await loginUser(details);
  await startSession(req, res, user.id);

  res.json({ message: 'Email and password are correct', user });
}

export function currentUser(req, res) {
  res.json({ user: req.user });
}

export async function logout(req, res) {
  await endSession(req, res);
  res.status(204).end();
}
