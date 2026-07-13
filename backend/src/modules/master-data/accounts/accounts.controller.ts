import { Request, Response } from 'express';
import { AccountsService } from './accounts.service';
import { z } from 'zod';

const accountsService = new AccountsService();

// Validation Schemas
const createAccountSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  industry: z.string().nullable().optional(),
  website: z.string().url('Invalid website URL').nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

export class AccountsController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || undefined;

      const result = await accountsService.getAll(user.userId, user.role, page, limit, search);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const account = await accountsService.getById(id, user.userId, user.role);

      if (!account) {
        res.status(404).json({ error: 'Not Found', message: 'Account not found or access denied' });
        return;
      }

      res.status(200).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate schema
      const parseResult = createAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const account = await accountsService.create(parseResult.data);
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Validate schema
      const parseResult = updateAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const updatedAccount = await accountsService.update(id, parseResult.data, user.userId, user.role);

      if (!updatedAccount) {
        res.status(404).json({ error: 'Not Found', message: 'Account not found or access denied' });
        return;
      }

      res.status(200).json(updatedAccount);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Check if exists/accessible
      const existingAccount = await accountsService.getById(id, user.userId, user.role);
      if (!existingAccount) {
        res.status(404).json({ error: 'Not Found', message: 'Account not found or access denied' });
        return;
      }

      await accountsService.delete(id);
      res.status(200).json({ message: 'Account successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
