import { Router } from 'express';
import { OpportunitiesController } from './opportunities.controller';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../../common/middlewares/rbac.middleware';

const router = Router();
const opportunitiesController = new OpportunitiesController();

router.use(authMiddleware);

router.get('/', opportunitiesController.getAll);
router.get('/:id', opportunitiesController.getById);
router.post('/', opportunitiesController.create);
router.put('/:id', opportunitiesController.update);

// Deleting deals is locked to Admin & Manager
router.delete('/:id', rbacMiddleware(['admin', 'sales_manager']), opportunitiesController.delete);

export default router;
