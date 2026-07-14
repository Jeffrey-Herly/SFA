import { Request, Response } from 'express';
import { OrdersService, OrderFilters } from './orders.service';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

const ordersService = new OrdersService();

const orderItemSchema = z.object({
  product_name: z.string().min(1, { message: 'Product name is required' }),
  quantity: z.number().int().positive({ message: 'Quantity must be positive' }),
  unit_price: z.number().nonnegative({ message: 'Unit price must be positive' }),
  discount: z.number().nonnegative().optional(),
});

const createOrderSchema = z.object({
  account_id: z.string().uuid({ message: 'Invalid Account ID' }),
  opportunity_id: z.string().uuid().nullable().optional(),
  order_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid order date format',
  }),
  delivery_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid delivery date format',
  }).nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1, { message: 'Order must contain at least 1 item' }),
});

const updateOrderSchema = z.object({
  order_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid order date format',
  }).optional(),
  delivery_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid delivery date format',
  }).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  items: z.array(orderItemSchema).optional(),
});

export class OrdersController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;

      const statusQuery = req.query.status as string;
      const status = Object.values(OrderStatus).includes(statusQuery as OrderStatus)
        ? (statusQuery as OrderStatus)
        : undefined;

      const accountId = req.query.accountId as string || undefined;
      const search = req.query.search as string || undefined;

      const filters: OrderFilters = { status, accountId, search };

      const result = await ordersService.getAll(user.userId, user.role, page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const order = await ordersService.getById(id, user.userId, user.role);
      if (!order) {
        res.status(404).json({ error: 'Not Found', message: 'Order not found or access denied' });
        return;
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const parseResult = createOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;
      const formattedData: any = {
        ...data,
        order_date: new Date(data.order_date),
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : null,
      };

      const order = await ordersService.create(user.userId, formattedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const parseResult = updateOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const data = parseResult.data;
      const formattedData: any = { ...data };
      if (data.order_date) {
        formattedData.order_date = new Date(data.order_date);
      }
      if (data.delivery_date) {
        formattedData.delivery_date = new Date(data.delivery_date);
      }

      // Security: Sales reps cannot approve or cancel orders via update endpoint directly
      if (user.role === 'sales_rep' && data.status && data.status !== 'submitted') {
        res.status(403).json({ error: 'Forbidden', message: 'Sales reps can only transition draft orders to submitted' });
        return;
      }

      const updated = await ordersService.update(id, user.userId, user.role, formattedData);
      if (!updated) {
        res.status(404).json({ error: 'Not Found', message: 'Order not found or access denied' });
        return;
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Double-check role limit (just in case, though middleware guards it)
      if (user.role === 'sales_rep') {
        res.status(403).json({ error: 'Forbidden', message: 'Sales Representative cannot approve orders' });
        return;
      }

      const approved = await ordersService.approve(id);
      res.status(200).json(approved);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      if (user.role === 'sales_rep') {
        res.status(403).json({ error: 'Forbidden', message: 'Sales Representative cannot cancel orders' });
        return;
      }

      const cancelled = await ordersService.cancel(id);
      res.status(200).json(cancelled);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const deleted = await ordersService.delete(id, user.userId, user.role);
      if (!deleted) {
        res.status(404).json({ error: 'Not Found', message: 'Order not found or access denied' });
        return;
      }

      res.status(200).json({ message: 'Order successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
