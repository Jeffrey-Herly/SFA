import { Router } from 'express';
import { ContactsController } from './contacts.controller';
import { authMiddleware } from '../../../common/middlewares/auth.middleware';
import { rbacMiddleware } from '../../../common/middlewares/rbac.middleware';

const router = Router();
const contactsController = new ContactsController();

// All Contact routes require authentication
router.use(authMiddleware);

// Endpoint definitions
router.get('/', contactsController.getAll);
router.get('/:id', contactsController.getById);

// sales_rep, sales_manager, and admin can create/update contacts
router.post('/', rbacMiddleware(['admin', 'sales_manager', 'sales_rep']), contactsController.create);
router.put('/:id', rbacMiddleware(['admin', 'sales_manager', 'sales_rep']), contactsController.update);

// Only admin and sales_manager can delete contacts
router.delete('/:id', rbacMiddleware(['admin', 'sales_manager']), contactsController.delete);

export default router;
