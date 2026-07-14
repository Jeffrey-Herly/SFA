import { Request, Response } from 'express';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export class ReportsController {
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const metrics = await reportsService.getDashboardMetrics(user.userId, user.role);
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
