import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Bad Request', message: 'Email and password are required' });
        return;
      }

      const result = await authService.login(email, password);

      if (!result) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }

      const { user, accessToken, refreshToken } = result;

      // Set Refresh Token in HttpOnly Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.APP_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(200).json({
        message: 'Login successful',
        user,
        accessToken,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear Refresh Token HttpOnly Cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.APP_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookies
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ error: 'Unauthorized', message: 'Refresh token missing' });
        return;
      }

      const accessToken = await authService.refresh(refreshToken);

      if (!accessToken) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
        return;
      }

      res.status(200).json({
        accessToken,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: 'Unauthorized', message: 'User context not found' });
        return;
      }

      const profile = await authService.getProfile(user.userId);

      if (!profile) {
        res.status(404).json({ error: 'Not Found', message: 'User not found' });
        return;
      }

      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', message: (error as Error).message });
    }
  }
}
