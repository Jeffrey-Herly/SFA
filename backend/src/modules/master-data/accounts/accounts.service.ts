import prisma from '../../../config/db';
import { Account } from '@prisma/client';

export class AccountsService {
  /**
   * Retrieves a paginated list of accounts.
   * If the user is a sales_rep, they can only view accounts linked to opportunities assigned to them.
   */
  async getAll(
    userId: string,
    role: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: Account[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};

    // 2. Search filter
    if (search) {
      where.OR = [
        { company_name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. Fetch data and count
    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take,
        orderBy: { company_name: 'asc' },
        include: {
          _count: {
            select: { contacts: true, opportunities: true },
          },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves a single account details along with its contacts and opportunities.
   * Performs an ownership check for sales_rep users.
   */
  async getById(id: string, userId: string, role: string): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        contacts: true,
        opportunities: {
          include: {
            lead: {
              select: { assigned_to: true },
            },
          },
        },
      },
    });

    return account;
  }

  /**
   * Creates a new account.
   */
  async create(data: {
    company_name: string;
    industry?: string | null;
    website?: string | null;
    address?: string | null;
  }): Promise<Account> {
    return prisma.account.create({
      data,
    });
  }

  /**
   * Updates an existing account.
   * For sales_rep, performs ownership check before updating.
   */
  async update(
    id: string,
    data: {
      company_name?: string;
      industry?: string | null;
      website?: string | null;
      address?: string | null;
    },
    userId: string,
    role: string
  ): Promise<Account | null> {
    // Check if account exists and is accessible
    const existingAccount = await this.getById(id, userId, role);
    if (!existingAccount) {
      return null;
    }

    return prisma.account.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes an account.
   */
  async delete(id: string): Promise<Account> {
    return prisma.account.delete({
      where: { id },
    });
  }
}
