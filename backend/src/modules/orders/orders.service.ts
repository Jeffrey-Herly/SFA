import prisma from '../../config/db';
import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';

export interface OrderFilters {
  status?: OrderStatus;
  accountId?: string;
  search?: string;
}

export class OrdersService {
  /**
   * Retrieves a paginated list of orders.
   * sales_rep users can only view their own orders.
   */
  async getAll(
    userId: string,
    role: string,
    page: number,
    limit: number,
    filters: OrderFilters
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};
    const andFilters: any[] = [];

    // Role division
    if (role === 'sales_rep') {
      andFilters.push({ salesperson_id: userId });
    }

    if (filters.status) {
      andFilters.push({ status: filters.status });
    }

    if (filters.accountId) {
      andFilters.push({ account_id: filters.accountId });
    }

    if (filters.search) {
      andFilters.push({
        order_number: { contains: filters.search, mode: 'insensitive' },
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          account: {
            select: { company_name: true },
          },
          salesperson: {
            select: { name: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves an order by its ID, including all items.
   */
  async getById(id: string, userId: string, role: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        account: { select: { company_name: true } },
        salesperson: { select: { name: true } },
      },
    });

    if (!order) return null;

    if (role === 'sales_rep' && order.salesperson_id !== userId) {
      return null;
    }

    return order;
  }

  /**
   * Helper to generate a unique order number: ORD-YYYYMMDD-XXXX
   */
  private async generateOrderNumber(): Promise<string> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await prisma.order.count({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqStr = String(countToday + 1).padStart(4, '0');
    return `ORD-${dateStr}-${seqStr}`;
  }

  /**
   * Creates an order with items in an atomic transaction.
   */
  async create(
    userId: string,
    data: {
      account_id: string;
      opportunity_id?: string | null;
      order_date: Date;
      delivery_date?: Date | null;
      notes?: string | null;
      items: {
        product_name: string;
        quantity: number;
        unit_price: number;
        discount?: number;
      }[];
    }
  ): Promise<Order | null> {
    if (data.items.length === 0) {
      throw new Error('An order must contain at least one product item.');
    }

    // Calculate total amount
    let totalAmount = 0;
    const itemsData = data.items.map((item) => {
      const disc = item.discount || 0;
      const sub = item.quantity * item.unit_price - disc;
      if (sub < 0) {
        throw new Error('Discount cannot be larger than the item price.');
      }
      totalAmount += sub;
      return {
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: new Prisma.Decimal(item.unit_price),
        discount: new Prisma.Decimal(disc),
        subtotal: new Prisma.Decimal(sub),
      };
    });

    const orderNumber = await this.generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          account_id: data.account_id,
          opportunity_id: data.opportunity_id || null,
          salesperson_id: userId,
          status: OrderStatus.draft,
          order_date: data.order_date,
          delivery_date: data.delivery_date || null,
          total_amount: new Prisma.Decimal(totalAmount),
          notes: data.notes || null,
        },
      });

      // Create items
      const orderItems = itemsData.map((it) => ({
        ...it,
        order_id: order.id,
      }));

      await tx.orderItem.createMany({
        data: orderItems,
      });

      // Return complete order
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          account: { select: { company_name: true } },
          salesperson: { select: { name: true } },
        },
      });
    });
  }

  /**
   * Updates an order.
   * If status is not draft, sales reps cannot edit.
   */
  async update(
    id: string,
    userId: string,
    role: string,
    data: {
      order_date?: Date;
      delivery_date?: Date | null;
      notes?: string | null;
      status?: OrderStatus;
      items?: {
        product_name: string;
        quantity: number;
        unit_price: number;
        discount?: number;
      }[];
    }
  ): Promise<Order | null> {
    const existing = await this.getById(id, userId, role);
    if (!existing) return null;

    // Safety checks: sales rep can only edit in draft status
    if (role === 'sales_rep' && existing.status !== OrderStatus.draft) {
      throw new Error('Only orders in draft status can be modified.');
    }

    // Prepare update parameters
    const updateData: any = {};
    if (data.order_date) updateData.order_date = data.order_date;
    if (data.delivery_date !== undefined) updateData.delivery_date = data.delivery_date;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    return prisma.$transaction(async (tx) => {
      // If items are modified, recalculate amount and replace order items
      if (data.items) {
        if (data.items.length === 0) {
          throw new Error('An order must contain at least one product item.');
        }

        let totalAmount = 0;
        const itemsData = data.items.map((item) => {
          const disc = item.discount || 0;
          const sub = item.quantity * item.unit_price - disc;
          if (sub < 0) {
            throw new Error('Discount cannot be larger than the item price.');
          }
          totalAmount += sub;
          return {
            order_id: id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: new Prisma.Decimal(item.unit_price),
            discount: new Prisma.Decimal(disc),
            subtotal: new Prisma.Decimal(sub),
          };
        });

        // 1. Delete existing items
        await tx.orderItem.deleteMany({
          where: { order_id: id },
        });

        // 2. Create new items
        await tx.orderItem.createMany({
          data: itemsData,
        });

        // 3. Update total amount
        updateData.total_amount = new Prisma.Decimal(totalAmount);
      }

      await tx.order.update({
        where: { id },
        data: updateData,
      });

      return tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          account: { select: { company_name: true } },
          salesperson: { select: { name: true } },
        },
      });
    });
  }

  /**
   * Manager actions: approve or cancel an order
   */
  async approve(id: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { status: OrderStatus.approved },
      include: {
        items: true,
        account: { select: { company_name: true } },
        salesperson: { select: { name: true } },
      },
    });
  }

  async cancel(id: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { status: OrderStatus.cancelled },
      include: {
        items: true,
        account: { select: { company_name: true } },
        salesperson: { select: { name: true } },
      },
    });
  }

  /**
   * Deletes a draft order.
   */
  async delete(id: string, userId: string, role: string): Promise<Order | null> {
    const existing = await this.getById(id, userId, role);
    if (!existing) return null;

    if (role === 'sales_rep' && existing.status !== OrderStatus.draft) {
      throw new Error('Only draft orders can be deleted.');
    }

    return prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { order_id: id } });
      return tx.order.delete({ where: { id } });
    });
  }
}
