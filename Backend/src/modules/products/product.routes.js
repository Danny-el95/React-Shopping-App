import { Router } from 'express';
import { getProducts, getProduct } from './product.controller.js';

export const productRouter = Router();

// Fetch current database values instead of reusing cached API responses.
productRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Product browsing is public and does not require login.
productRouter.get('/', getProducts);
productRouter.get('/:id', getProduct);
