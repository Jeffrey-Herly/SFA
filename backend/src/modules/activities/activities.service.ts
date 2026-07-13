import prisma from '../../config/db';
import { Activity, ActivityType } from '@prisma/client';

export interface ActivityFilters {
  type?: ActivityType;
  accountId?: string;
  leadId?: string;
  is_task?: boolean;
  is_completed?: boolean;
}

export class ActivitiesService {
  /**
   * Retrieves a paginated and filtered list of activities.
   * sales_rep users can only retrieve their own logged activities.
   */
  async getAll(
    userId: string,
    role: string,
    page: number,
    limit: number,
    filters: ActivityFilters
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};
    const andFilters: any[] = [];

    // 1. Role separation
    if (role === 'sales_rep') {
      andFilters.push({ user_id: userId });
    }

    // 2. Exact fields filters
    if (filters.type) {
      andFilters.push({ type: filters.type });
    }

    if (filters.accountId) {
      andFilters.push({ account_id: filters.accountId });
    }

    if (filters.leadId) {
      andFilters.push({ lead_id: filters.leadId });
    }

    // 3. JSON metadata path queries
    if (filters.is_task) {
      andFilters.push({
        meta: {
          path: ['is_task'],
          equals: true,
        },
      });
    }

    if (filters.is_completed !== undefined) {
      andFilters.push({
        meta: {
          path: ['is_completed'],
          equals: filters.is_completed,
        },
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { activity_date: 'desc' },
        include: {
          user: {
            select: { name: true, role: true },
          },
          account: {
            select: { company_name: true },
          },
          lead: {
            select: { name: true },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves a single activity log.
   */
  async getById(id: string, userId: string, role: string): Promise<Activity | null> {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, role: true } },
        account: { select: { company_name: true } },
        lead: { select: { name: true } },
      },
    });

    if (!activity) return null;

    // Role-based visibility gate
    if (role === 'sales_rep' && activity.user_id !== userId) {
      return null;
    }

    return activity;
  }

  /**
   * Logs a new activity.
   */
  async create(
    userId: string,
    data: {
      lead_id?: string | null;
      opportunity_id?: string | null;
      contact_id?: string | null;
      account_id?: string | null;
      type: ActivityType;
      notes?: string;
      meta?: any;
    }
  ): Promise<Activity> {
    return prisma.activity.create({
      data: {
        user_id: userId,
        lead_id: data.lead_id || null,
        opportunity_id: data.opportunity_id || null,
        contact_id: data.contact_id || null,
        account_id: data.account_id || null,
        type: data.type,
        notes: data.notes || '',
        meta: data.meta || {},
      },
      include: {
        user: { select: { name: true, role: true } },
        account: { select: { company_name: true } },
        lead: { select: { name: true } },
      },
    });
  }

  /**
   * Updates an existing activity log (such as complete status or adding checkout info).
   */
  async update(
    id: string,
    userId: string,
    role: string,
    data: {
      notes?: string;
      meta?: any;
    }
  ): Promise<Activity | null> {
    const existing = await this.getById(id, userId, role);
    if (!existing) {
      return null;
    }

    // Merge meta fields instead of complete replacement
    const existingMeta = (existing.meta as Record<string, any>) || {};
    const mergedMeta = {
      ...existingMeta,
      ...(data.meta || {}),
    };

    return prisma.activity.update({
      where: { id },
      data: {
        notes: data.notes !== undefined ? data.notes : existing.notes,
        meta: mergedMeta,
      },
      include: {
        user: { select: { name: true, role: true } },
        account: { select: { company_name: true } },
        lead: { select: { name: true } },
      },
    });
  }

  /**
   * Deletes an activity log (Manager/Admin only).
   */
  async delete(id: string): Promise<Activity> {
    return prisma.activity.delete({
      where: { id },
    });
  }
}
