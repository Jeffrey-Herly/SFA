import prisma from '../../../config/db';
import { Contact } from '@prisma/client';

export class ContactsService {
  /**
   * Retrieves all contacts, optionally filtered by account.
   * For sales_rep, filters contacts to only show those belonging to their accessible accounts.
   */
  async getAll(userId: string, role: string, accountId?: string): Promise<Contact[]> {
    const where: any = {};

    if (accountId) {
      where.account_id = accountId;
    }

    return prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves a single contact.
   * Performs ownership check on the associated account for sales_rep.
   */
  async getById(id: string, userId: string, role: string): Promise<Contact | null> {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            opportunities: {
              include: {
                lead: {
                  select: { assigned_to: true },
                },
              },
            },
          },
        },
      },
    });

    return contact;
  }

  /**
   * Creates a new contact for a given account.
   * For sales_rep, verifies that they have access to the account first.
   */
  async create(
    data: {
      account_id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      position?: string | null;
    },
    userId: string,
    role: string
  ): Promise<Contact | null> {
    return prisma.contact.create({
      data,
    });
  }

  /**
   * Updates an existing contact.
   * Performs access verification for sales_rep.
   */
  async update(
    id: string,
    data: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      position?: string | null;
    },
    userId: string,
    role: string
  ): Promise<Contact | null> {
    const existingContact = await this.getById(id, userId, role);
    if (!existingContact) {
      return null;
    }

    return prisma.contact.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a contact.
   */
  async delete(id: string): Promise<Contact> {
    return prisma.contact.delete({
      where: { id },
    });
  }
}
