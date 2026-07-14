import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../common/middlewares/rbac.middleware';

const router = Router();
const ordersController = new OrdersController();

router.use(authMiddleware);

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', ordersController.create);
router.put('/:id', ordersController.update);

// Approval & Cancellation is restricted to Manager & Admin
router.put('/:id/approve', rbacMiddleware(['admin', 'sales_manager']), ordersController.approve);
router.put('/:id/cancel', rbacMiddleware(['admin', 'sales_manager']), ordersController.cancel);

router.delete('/:id', ordersController.delete);

export default router;
