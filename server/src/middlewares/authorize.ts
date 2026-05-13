import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/AppError';
import type { UserRole } from '../models/user.model';

/**
 * requireRole(...roles)
 *
 * Returns middleware that allows only users whose role is in the given list.
 * Returns 403 Forbidden for any other authenticated user.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('admin'), handler)
 *   router.get('/staff', authenticate, requireRole('lecturer', 'teaching_assistant'), handler)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Access restricted to: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * requireOwnerOrRole(paramName, ...roles)
 *
 * Returns middleware that allows access when EITHER:
 *   - The authenticated user's id matches the route parameter (ownership), OR
 *   - The authenticated user's role is in the given list.
 *
 * This prevents IDOR by ensuring a student can only access their own record
 * unless an admin or other privileged role is requesting.
 *
 * Usage:
 *   router.get('/:id', authenticate, requireOwnerOrRole('id', 'admin'), handler)
 */
export function requireOwnerOrRole(paramName: string, ...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }

    const paramValue = req.params[paramName];
    const isOwner    = paramValue === req.user.id;
    const hasRole    = roles.includes(req.user.role);

    if (isOwner || hasRole) {
      next();
    } else {
      next(new ForbiddenError('You do not have access to this resource'));
    }
  };
}
