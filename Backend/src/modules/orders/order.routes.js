import { Router } from 'express';
import { requireAuth } from '../auth/auth.session.js';
import { createOrder, getOrders, getOrder, archiveOrder } from './order.controller.js';

export const orderRouter = Router();
orderRouter.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
orderRouter.use(requireAuth);
orderRouter.post('/', createOrder);
orderRouter.get('/', getOrders);
orderRouter.get('/:id', getOrder);
orderRouter.patch('/:id/archive', archiveOrder);
