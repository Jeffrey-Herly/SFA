import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import accountRoutes from './modules/master-data/accounts/accounts.routes';
import contactRoutes from './modules/master-data/contacts/contacts.routes';
import userRoutes from './modules/master-data/users/users.routes';
import activityRoutes from './modules/activities/activities.routes';
import leadRoutes from './modules/pipeline/leads/leads.routes';
import opportunityRoutes from './modules/pipeline/opportunities/opportunities.routes';
import orderRoutes from './modules/orders/orders.routes';
import reportRoutes from './modules/reports/reports.routes';

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'SFA API',
    message: 'Sales Force Automation API',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.listen(port, () => {
  console.log(`[Server] SFA API running on port ${port}`);
});
