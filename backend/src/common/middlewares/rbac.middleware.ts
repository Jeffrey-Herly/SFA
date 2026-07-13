import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access to endpoints based on user roles.
 * Must be used AFTER authMiddleware.
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied: insufficient permissions' });
      return;
    }

    next();
  };
}
