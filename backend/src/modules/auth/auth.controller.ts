import { Request, Response } from 'express';
import { authService } from './auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const host = req.get('host') || 'localhost';
    const protocol = req.protocol;
    
    // Controller delegates business logic to Service
    const result = await authService.register(req.body, host, protocol);
    
    // Controller handles response
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: result.userId,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error.message === 'Email is already registered') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    // Delegate to Service
    await authService.verifyEmail(token as string);
    
    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error: any) {
    console.error('Verification Error:', error);
    if (error.message === 'Invalid or expired verification token') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Delegate to Service
    const { user, token } = await authService.login(email, password);

    // Controller handles HTTP specifics like Cookies and JSON structure
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: 'Logged in successfully',
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: error.message });
      return;
    }
    if (error.message === 'Please verify your email before logging in') {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
