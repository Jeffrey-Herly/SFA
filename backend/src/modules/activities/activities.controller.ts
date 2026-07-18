import { Request, Response } from 'express';
import { ActivitiesService, ActivityFilters } from './activities.service';
import { z } from 'zod';
import { ActivityType } from '@prisma/client';

const activitiesService = new ActivitiesService();

// Validation Schemas
const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  lead_id: z.string().uuid().nullable().optional(),
  opportunity_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

const updateActivitySchema = z.object({
  notes: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export class ActivitiesController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      
      const queryType = req.query.type as string;
      const type = Object.values(ActivityType).includes(queryType as ActivityType) 
        ? (queryType as ActivityType) 
        : undefined;

      const accountId = req.query.accountId as string || undefined;
      const leadId = req.query.leadId as string || undefined;

      const is_task = req.query.is_task === 'true' ? true : undefined;
      const is_completed = req.query.is_completed === 'true' 
        ? true 
        : req.query.is_completed === 'false' 
          ? false 
          : undefined;

      const filters: ActivityFilters = {
        type,
        accountId,
        leadId,
        is_task,
        is_completed,
      };

      const result = await activitiesService.getAll(user.userId, user.role, page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const activity = await activitiesService.getById(id, user.userId, user.role);
      if (!activity) {
        res.status(404).json({ error: 'Not Found', message: 'Activity log not found or access denied' });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      const parseResult = createActivitySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const activity = await activitiesService.create(user.userId, parseResult.data);
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const parseResult = updateActivitySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const updated = await activitiesService.update(id, user.userId, user.role, parseResult.data);
      if (!updated) {
        res.status(404).json({ error: 'Not Found', message: 'Activity log not found or access denied' });
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

      // Check if exists/accessible
      const existing = await activitiesService.getById(id, user.userId, user.role);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Activity log not found or access denied' });
        return;
      }

      await activitiesService.delete(id);
      res.status(200).json({ message: 'Activity log successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
