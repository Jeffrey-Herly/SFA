import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
const reportsController = new ReportsController();

router.use(authMiddleware);

router.get('/dashboard', reportsController.getDashboardMetrics);

export default router;
