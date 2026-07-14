import prisma from '../../../config/db';
import { Lead, LeadStatus, LeadSource } from '@prisma/client';

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
}

export class LeadsService {
  /**
   * Retrieves a paginated list of leads.
   * sales_rep users can only retrieve leads assigned to them.
   */
  async getAll(
    userId: string,
    role: string,
    page: number,
    limit: number,
    filters: LeadFilters
  ): Promise<{ data: Lead[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};
    const andFilters: any[] = [];

    // Role row-level check
    if (role === 'sales_rep') {
      andFilters.push({ assigned_to: userId });
    }

    if (filters.status) {
      andFilters.push({ status: filters.status });
    }

    if (filters.source) {
      andFilters.push({ source: filters.source });
    }

    if (filters.search) {
      andFilters.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { interest: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    // Let's verify if Lead model has company_name:
    // Lead has: name, email, phone, interest, status, source, notes, created_by, assigned_to
    // Ah! Lead has no company_name column! Let's check the schema.prisma model Lead to be absolutely sure.
    // Yes: id, name, email, phone, interest, status, source, created_by, assigned_to, notes, created_at, updated_at
    // Okay, so search should only query name, email, phone, and interest!
    
    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          creator: {
            select: { name: true, role: true },
          },
          assignee: {
            select: { name: true, role: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves a single lead.
   */
  async getById(id: string, userId: string, role: string): Promise<Lead | null> {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, role: true } },
        assignee: { select: { name: true, role: true } },
      },
    });

    if (!lead) return null;

    if (role === 'sales_rep' && lead.assigned_to !== userId) {
      return null;
    }

    return lead;
  }

  /**
   * Creates a new lead.
   */
  async create(
    creatorId: string,
    data: {
      name: string;
      email?: string | null;
      phone?: string | null;
      interest?: string | null;
      status?: LeadStatus;
      source?: LeadSource;
      assigned_to: string;
      notes?: string | null;
    }
  ): Promise<Lead> {
    return prisma.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        interest: data.interest || null,
        status: data.status || LeadStatus.new,
        source: data.source || LeadSource.manual,
        created_by: creatorId,
        assigned_to: data.assigned_to,
        notes: data.notes || null,
      },
      include: {
        creator: { select: { name: true, role: true } },
        assignee: { select: { name: true, role: true } },
      },
    });
  }

  /**
   * Updates an existing lead.
   */
  async update(
    id: string,
    userId: string,
    role: string,
    data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      interest?: string | null;
      status?: LeadStatus;
      source?: LeadSource;
      assigned_to?: string;
      notes?: string | null;
    }
  ): Promise<Lead | null> {
    const existing = await this.getById(id, userId, role);
    if (!existing) return null;

    return prisma.lead.update({
      where: { id },
      data,
      include: {
        creator: { select: { name: true, role: true } },
        assignee: { select: { name: true, role: true } },
      },
    });
  }

  /**
   * Deletes a lead.
   */
  async delete(id: string): Promise<Lead> {
    return prisma.lead.delete({
      where: { id },
    });
  }
}
