import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
const notificationsController = new NotificationsController();

router.use(authMiddleware);

router.get('/', notificationsController.getNotifications);
router.put('/read-all', notificationsController.markAllAsRead);
router.put('/:id/read', notificationsController.markAsRead);

export default router;
