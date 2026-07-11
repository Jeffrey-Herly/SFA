import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

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
