import { Router } from 'express';
import { ActivitiesController } from './activities.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../common/middlewares/rbac.middleware';

const router = Router();
const activitiesController = new ActivitiesController();

// All routes require authentication
router.use(authMiddleware);

router.get('/', activitiesController.getAll);
router.get('/:id', activitiesController.getById);
router.post('/', activitiesController.create);
router.put('/:id', activitiesController.update);

// Deleting logs is restricted to managers and admin
router.delete('/:id', rbacMiddleware(['admin', 'sales_manager']), activitiesController.delete);

export default router;
