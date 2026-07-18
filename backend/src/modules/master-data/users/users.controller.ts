import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { z } from 'zod';
import { Role } from '@prisma/client';

const usersService = new UsersService();

// Validation Schemas
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address format'),
  passwordPlain: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address format').optional(),
  passwordPlain: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  role: z.nativeEnum(Role).optional(),
});

export class UsersController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;
      
      const queryRole = req.query.role as string;
      const role = Object.values(Role).includes(queryRole as Role) ? (queryRole as Role) : undefined;

      const result = await usersService.getAll(page, limit, search, role);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Managers and Admins can view anyone. Ordinary users can only view themselves.
      if (user.role !== Role.admin && user.role !== Role.sales_manager && user.userId !== id) {
        res.status(403).json({ error: 'Forbidden', message: 'Access denied to this profile' });
        return;
      }

      const foundUser = await usersService.getById(id);
      if (!foundUser) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      res.status(200).json(foundUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = createUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const newUser = await usersService.create(parseResult.data);
      res.status(201).json(newUser);
    } catch (error: any) {
      if (error.message === 'Email address already registered') {
        res.status(409).json({ error: 'Conflict', message: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Only Admin, Manager or the user themselves can update
      if (user.role !== Role.admin && user.role !== Role.sales_manager && user.userId !== id) {
        res.status(403).json({ error: 'Forbidden', message: 'Access denied to update this profile' });
        return;
      }

      // Normal users cannot elevate their own roles
      if (user.role !== Role.admin && user.role !== Role.sales_manager && req.body.role) {
        res.status(403).json({ error: 'Forbidden', message: 'You are not allowed to modify roles' });
        return;
      }

      const parseResult = updateUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const updatedUser = await usersService.update(id, parseResult.data);
      if (!updatedUser) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error: any) {
      if (error.message === 'Email address already registered') {
        res.status(409).json({ error: 'Conflict', message: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
      }
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Prevent users from deleting themselves
      if (user.userId === id) {
        res.status(400).json({ error: 'Bad Request', message: 'You cannot delete your own account' });
        return;
      }

      const deletedUser = await usersService.delete(id);
      res.status(200).json({ message: 'User successfully deleted', user: deletedUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
