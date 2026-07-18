import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../../common/middlewares/rbac.middleware';

const router = Router();
const leadsController = new LeadsController();

router.use(authMiddleware);

router.get('/', leadsController.getAll);
router.get('/:id', leadsController.getById);
router.post('/', leadsController.create);
router.put('/:id', leadsController.update);

// Deleting leads is restricted to Admin & Manager
router.delete('/:id', rbacMiddleware(['admin', 'sales_manager']), leadsController.delete);

export default router;
