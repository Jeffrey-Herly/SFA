import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for login (A04 OWASP Mitigation: max 5 requests per minute per IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again after 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authMiddleware, authController.me);

export default router;
