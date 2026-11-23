import { Router } from 'express';
import { requireAuth } from '../auth/auth.session.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from './cart.controller.js';

export const cartRouter = Router();

// Cart data is private and should not be cached by the browser.
cartRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// All handlers get the user ID from the verified session, never the request body.
cartRouter.use(requireAuth);

cartRouter.get('/', getCart);
cartRouter.post('/items', addItem);
cartRouter.patch('/items/:productId', updateItem);
cartRouter.delete('/items/:productId', removeItem);
cartRouter.delete('/', clearCart);
