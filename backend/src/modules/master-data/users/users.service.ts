import prisma from '../../../config/db';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class UsersService {
  /**
   * Retrieves a paginated list of users, with optional search and role filters.
   * Passwords are excluded from the returned payload for security.
   */
  async getAll(
    page: number,
    limit: number,
    search?: string,
    role?: Role
  ): Promise<{ data: Omit<User, 'password'>[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_verified: true,
          verification_token: true,
          created_at: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieves a single user profile by ID.
   */
  async getById(id: string): Promise<Omit<User, 'password'> | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
        verification_token: true,
        created_at: true,
      },
    });
  }

  /**
   * Creates a new user with an encrypted password.
   */
  async create(data: {
    name: string;
    email: string;
    passwordPlain: string;
    role: Role;
  }): Promise<Omit<User, 'password'>> {
    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email address already registered');
    }

    // Encrypt password
    const hashedPassword = bcrypt.hashSync(data.passwordPlain, 12);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
        verification_token: true,
        created_at: true,
      },
    });
  }

  /**
   * Updates an existing user.
   */
  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordPlain?: string;
      role?: Role;
    }
  ): Promise<Omit<User, 'password'> | null> {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }

    // If updating email, check for conflicts
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new Error('Email address already registered');
      }
    }

    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.email) updatePayload.email = data.email;
    if (data.role) updatePayload.role = data.role;
    
    // Hash password if updated
    if (data.passwordPlain) {
      updatePayload.password = bcrypt.hashSync(data.passwordPlain, 12);
    }

    return prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
        verification_token: true,
        created_at: true,
      },
    });
  }

  /**
   * Deletes a user account.
   */
  async delete(id: string): Promise<Omit<User, 'password'>> {
    return prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_verified: true,
        verification_token: true,
        created_at: true,
      },
    });
  }
}
