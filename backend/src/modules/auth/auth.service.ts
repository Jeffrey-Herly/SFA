import prisma from '../../config/db';
import * as bcrypt from 'bcrypt';
import { TokenPayload, signAccessToken, signRefreshToken, verifyToken } from '../../common/utils/jwt';
import { User } from '@prisma/client';

export class AuthService {
  /**
   * Validates user credentials.
   * Returns user details (excluding password) and signed access/refresh tokens if successful.
   */
  async login(email: string, passwordPlain: string): Promise<{ user: Omit<User, 'password'>; accessToken: string; refreshToken: string } | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Verify password via bcrypt
    const isPasswordValid = bcrypt.compareSync(passwordPlain, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Prepare payload
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    // Generate tokens
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Remove password from returned user object
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generates a new access token from a valid refresh token.
   */
  async refresh(token: string): Promise<string | null> {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return null;
    }

    // Prepare new payload and generate new access token
    const newPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    return signAccessToken(newPayload);
  }

  /**
   * Retrieves profile data of the logged-in user.
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
