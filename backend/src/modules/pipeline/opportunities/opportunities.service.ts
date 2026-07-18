import prisma from '../../../config/db';
import { Opportunity, OpportunityStage, Prisma } from '@prisma/client';

export interface OpportunityFilters {
  stage?: OpportunityStage;
  leadId?: string;
  accountId?: string;
}

export class OpportunitiesService {
  /**
   * Retrieves all opportunities (no pagination required for Kanban board, but let's make it fetch all by default or filtered).
   * sales_rep users can only retrieve opportunities associated with Leads assigned to them.
   */
  async getAll(
    userId: string,
    role: string,
    filters: OpportunityFilters
  ): Promise<Opportunity[]> {
    const where: any = {};
    const andFilters: any[] = [];

    // Role derived check
    if (role === 'sales_rep') {
      andFilters.push({
        lead: {
          assigned_to: userId,
        },
      });
    }

    if (filters.stage) {
      andFilters.push({ stage: filters.stage });
    }

    if (filters.leadId) {
      andFilters.push({ lead_id: filters.leadId });
    }

    if (filters.accountId) {
      andFilters.push({ account_id: filters.accountId });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    return prisma.opportunity.findMany({
      where,
      orderBy: { expected_close: 'asc' },
      include: {
        lead: {
          select: { name: true, assigned_to: true },
        },
        account: {
          select: { company_name: true },
        },
      },
    });
  }

  /**
   * Retrieves a single opportunity.
   */
  async getById(id: string, userId: string, role: string): Promise<Opportunity | null> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        lead: { select: { name: true, assigned_to: true } },
        account: { select: { company_name: true } },
      },
    });

    if (!opportunity) return null;

    if (role === 'sales_rep' && opportunity.lead.assigned_to !== userId) {
      return null;
    }

    return opportunity;
  }

  /**
   * Creates a new opportunity.
   */
  async create(data: {
    title: string;
    lead_id: string;
    account_id: string;
    stage?: OpportunityStage;
    amount: number;
    probability?: number;
    expected_close: Date;
    loss_reason?: string | null;
  }): Promise<Opportunity> {
    return prisma.opportunity.create({
      data: {
        title: data.title,
        lead_id: data.lead_id,
        account_id: data.account_id,
        stage: data.stage || OpportunityStage.prospecting,
        amount: new Prisma.Decimal(data.amount),
        probability: data.probability !== undefined ? data.probability : 0,
        expected_close: data.expected_close,
        loss_reason: data.loss_reason || null,
      },
      include: {
        lead: { select: { name: true, assigned_to: true } },
        account: { select: { company_name: true } },
      },
    });
  }

  /**
   * Updates an existing opportunity.
   */
  async update(
    id: string,
    userId: string,
    role: string,
    data: {
      title?: string;
      lead_id?: string;
      account_id?: string;
      stage?: OpportunityStage;
      amount?: number;
      probability?: number;
      expected_close?: Date;
      loss_reason?: string | null;
    }
  ): Promise<Opportunity | null> {
    const existing = await this.getById(id, userId, role);
    if (!existing) return null;

    const updateData: any = { ...data };
    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }

    // Auto-clear loss reason if status changes back to something else
    if (data.stage && data.stage !== OpportunityStage.closed_lost) {
      updateData.loss_reason = null;
    }

    return prisma.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        lead: { select: { name: true, assigned_to: true } },
        account: { select: { company_name: true } },
      },
    });
  }

  /**
   * Deletes an opportunity.
   */
  async delete(id: string): Promise<Opportunity> {
    return prisma.opportunity.delete({
      where: { id },
    });
  }
}
