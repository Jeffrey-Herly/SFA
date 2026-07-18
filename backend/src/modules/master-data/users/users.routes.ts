import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../../common/middlewares/rbac.middleware';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authMiddleware);

// Retrieve all and Create: limited to admin and sales_manager
router.get('/', rbacMiddleware(['admin', 'sales_manager']), usersController.getAll);
router.post('/', rbacMiddleware(['admin', 'sales_manager']), usersController.create);

// Individual profiles: authorized within the controller (owner, manager, or admin)
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);

// Account deletion: strictly restricted to admin
router.delete('/:id', rbacMiddleware(['admin']), usersController.delete);

export default router;
