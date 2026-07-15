import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';

const notificationsService = new NotificationsService();

export class NotificationsController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const list = await notificationsService.getNotifications(user.userId);
      res.status(200).json(list);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      await notificationsService.markAsRead(id as string, user.userId);
      res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      await notificationsService.markAllAsRead(user.userId);
      res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
