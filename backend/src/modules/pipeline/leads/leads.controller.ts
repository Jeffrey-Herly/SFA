import { Request, Response } from 'express';
import { LeadsService, LeadFilters } from './leads.service';
import { z } from 'zod';
import { LeadStatus, LeadSource } from '@prisma/client';

const leadsService = new LeadsService();

const createLeadSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email' }).nullable().optional(),
  phone: z.string().nullable().optional(),
  interest: z.string().nullable().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assigned_to: z.string().uuid({ message: 'Invalid assignee User ID' }),
  notes: z.string().nullable().optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  interest: z.string().nullable().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assigned_to: z.string().uuid().optional(),
  notes: z.string().nullable().optional(),
});

export class LeadsController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      const statusQuery = req.query.status as string;
      const status = Object.values(LeadStatus).includes(statusQuery as LeadStatus)
        ? (statusQuery as LeadStatus)
        : undefined;

      const sourceQuery = req.query.source as string;
      const source = Object.values(LeadSource).includes(sourceQuery as LeadSource)
        ? (sourceQuery as LeadSource)
        : undefined;

      const search = (req.query.search as string) || undefined;

      const filters: LeadFilters = { status, source, search };

      const result = await leadsService.getAll(user.userId, user.role, page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const lead = await leadsService.getById(id, user.userId, user.role);
      if (!lead) {
        res.status(404).json({ error: 'Not Found', message: 'Lead not found or access denied' });
        return;
      }

      res.status(200).json(lead);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const parseResult = createLeadSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;

      // Security: Sales rep must assign lead to themselves
      if (user.role === 'sales_rep') {
        data.assigned_to = user.userId;
      }

      const lead = await leadsService.create(user.userId, data);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const parseResult = updateLeadSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;

      // Security: Sales rep cannot reassign their leads
      if (user.role === 'sales_rep' && data.assigned_to && data.assigned_to !== user.userId) {
        res.status(403).json({ error: 'Forbidden', message: 'Sales Representative cannot reassign leads' });
        return;
      }

      const updated = await leadsService.update(id, user.userId, user.role, data);
      if (!updated) {
        res.status(404).json({ error: 'Not Found', message: 'Lead not found or access denied' });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Verify existence & ownership
      const existing = await leadsService.getById(id, user.userId, user.role);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Lead not found or access denied' });
        return;
      }

      await leadsService.delete(id);
      res.status(200).json({ message: 'Lead successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
