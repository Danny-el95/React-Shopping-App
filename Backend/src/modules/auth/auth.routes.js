import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, currentUser, logout } from './auth.controller.js';
import { requireAuth } from './auth.session.js';

export const authRouter = Router();

// Limit repeated registration and login attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});

// Prevent browsers from caching account responses.
authRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Registration and login create a session; /me restores the logged-in user.
authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.get('/me', requireAuth, currentUser);
authRouter.post('/logout', logout);
