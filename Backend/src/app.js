import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productRouter } from './modules/products/product.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { orderRouter } from './modules/orders/order.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { trustedOrigin } from './middleware/trusted-origin.js';
import { fileURLToPath } from 'node:url';
export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(trustedOrigin);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
// Preserve the original registration URL while clients migrate.
app.use('/', authRouter);
const imagesFolder = fileURLToPath(
    new URL('../public/images/', import.meta.url),
);
app.use('/images', express.static(imagesFolder));
app.use(notFound);
app.use(errorHandler);
