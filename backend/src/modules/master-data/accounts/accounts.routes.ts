import { Router } from 'express';
import { AccountsController } from './accounts.controller';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../../common/middlewares/rbac.middleware';

const router = Router();
const accountsController = new AccountsController();

// All Account routes require authentication
router.use(authMiddleware);

// Endpoint definitions
router.get('/', accountsController.getAll);
router.get('/:id', accountsController.getById);

// sales_rep, sales_manager, and admin can create/update accounts
router.post('/', rbacMiddleware(['admin', 'sales_manager', 'sales_rep']), accountsController.create);
router.put('/:id', rbacMiddleware(['admin', 'sales_manager', 'sales_rep']), accountsController.update);

// Only admin and sales_manager can delete accounts
router.delete('/:id', rbacMiddleware(['admin', 'sales_manager']), accountsController.delete);

export default router;
