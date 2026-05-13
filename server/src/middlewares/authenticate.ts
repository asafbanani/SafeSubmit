import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';
import type { UserRole } from '../models/user.model';

/**
 * authenticate
 *
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 *
 * Routes that require authentication must use this middleware first.
 * All authorization checks (role, ownership) happen AFTER this middleware.
 *
 * On failure returns 401 — never 403, because the user is not yet identified.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new UnauthorizedError('Authorization header missing or malformed'));
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = verifyToken(token);

    req.user = {
      id:        payload.id,
      email:     payload.email,
      role:      payload.role as UserRole,
      full_name: payload.full_name,
    };

    next();
  } catch {
    // verifyToken throws on expired or invalid tokens
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
