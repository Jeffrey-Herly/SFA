import { Request, Response } from 'express';
import { ContactsService } from './contacts.service';
import { z } from 'zod';

const contactsService = new ContactsService();

// Validation Schemas
const createContactSchema = z.object({
  account_id: z.string().uuid('Invalid account ID format'),
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email format').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
});

const updateContactSchema = createContactSchema.omit({ account_id: true }).partial();

export class ContactsController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const accountId = req.query.accountId as string || undefined;

      const contacts = await contactsService.getAll(user.userId, user.role, accountId);
      res.status(200).json(contacts);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      const contact = await contactsService.getById(id, user.userId, user.role);

      if (!contact) {
        res.status(404).json({ error: 'Not Found', message: 'Contact not found or access denied' });
        return;
      }

      res.status(200).json(contact);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;

      // Validate schema
      const parseResult = createContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const contact = await contactsService.create(parseResult.data, user.userId, user.role);

      if (!contact) {
        res.status(403).json({ error: 'Forbidden', message: 'Access denied to parent account' });
        return;
      }

      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Validate schema
      const parseResult = updateContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Bad Request', message: parseResult.error.issues[0].message });
        return;
      }

      const updatedContact = await contactsService.update(id, parseResult.data, user.userId, user.role);

      if (!updatedContact) {
        res.status(404).json({ error: 'Not Found', message: 'Contact not found or access denied' });
        return;
      }

      res.status(200).json(updatedContact);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = req.user!;

      // Check if exists/accessible
      const existingContact = await contactsService.getById(id, user.userId, user.role);
      if (!existingContact) {
        res.status(404).json({ error: 'Not Found', message: 'Contact not found or access denied' });
        return;
      }

      await contactsService.delete(id);
      res.status(200).json({ message: 'Contact successfully deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
