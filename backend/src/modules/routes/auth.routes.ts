import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, verifyEmail } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Zod Schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['sales_rep', 'sales_manager', 'admin', 'executive']),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Routes
router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', logout);

export default router;
