import { Request, Response } from 'express';
import { OpportunitiesService, OpportunityFilters } from './opportunities.service';
import { z } from 'zod';
import { OpportunityStage } from '@prisma/client';
import prisma from '../../../config/db';

const opportunitiesService = new OpportunitiesService();

const createOpportunitySchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  lead_id: z.string().uuid({ message: 'Invalid Lead ID' }),
  account_id: z.string().uuid({ message: 'Invalid Account ID' }),
  stage: z.nativeEnum(OpportunityStage).optional(),
  amount: z.number().nonnegative({ message: 'Amount must be positive' }),
  probability: z.number().int().min(0).max(100).optional(),
  expected_close: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid closing date format',
  }),
  loss_reason: z.string().nullable().optional(),
});

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  lead_id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional(),
  stage: z.nativeEnum(OpportunityStage).optional(),
  amount: z.number().nonnegative().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expected_close: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  loss_reason: z.string().nullable().optional(),
});

export class OpportunitiesController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const stageQuery = req.query.stage as string;
      const stage = Object.values(OpportunityStage).includes(stageQuery as OpportunityStage)
        ? (stageQuery as OpportunityStage)
        : undefined;

      const leadId = req.query.leadId as string || undefined;
      const accountId = req.query.accountId as string || undefined;

      const filters: OpportunityFilters = { stage, leadId, accountId };

      const result = await opportunitiesService.getAll(user.userId, user.role, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const opportunity = await opportunitiesService.getById(id, user.userId, user.role);
      if (!opportunity) {
        res.status(404).json({ error: 'Not Found', message: 'Opportunity not found or access denied' });
        return;
      }

      res.status(200).json(opportunity);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const parseResult = createOpportunitySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;

      // Security: verify the lead belongs to the sales rep
      if (user.role === 'sales_rep') {
        const lead = await prisma.lead.findUnique({ where: { id: data.lead_id } });
        if (!lead || lead.assigned_to !== user.userId) {
          res.status(403).json({ error: 'Forbidden', message: 'You can only create opportunities for leads assigned to you' });
          return;
        }
      }

      const opportunity = await opportunitiesService.create({
        ...data,
        expected_close: new Date(data.expected_close),
      });

      res.status(201).json(opportunity);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const parseResult = updateOpportunitySchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;

      // If re-linking to a new lead, verify access to the target lead
      if (user.role === 'sales_rep' && data.lead_id) {
        const lead = await prisma.lead.findUnique({ where: { id: data.lead_id } });
        if (!lead || lead.assigned_to !== user.userId) {
          res.status(403).json({ error: 'Forbidden', message: 'You can only associate opportunities with leads assigned to you' });
          return;
        }
      }

      const formattedData: any = { ...data };
      if (data.expected_close) {
        formattedData.expected_close = new Date(data.expected_close);
      }

      const updated = await opportunitiesService.update(id, user.userId, user.role, formattedData);
      if (!updated) {
        res.status(404).json({ error: 'Not Found', message: 'Opportunity not found or access denied' });
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

      const existing = await opportunitiesService.getById(id, user.userId, user.role);
      if (!existing) {
        res.status(404).json({ error: 'Not Found', message: 'Opportunity not found or access denied' });
        return;
      }

      await opportunitiesService.delete(id);
      res.status(200).json({ message: 'Opportunity successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
