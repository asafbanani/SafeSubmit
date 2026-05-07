import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env['NODE_ENV'] !== 'production';

  if (err instanceof AppError) {
    // Known operational error — use its status and message as-is
    res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Unknown / unexpected error — log the full stack, hide details in production
  console.error(err.stack);

  res.status(500).json({
    status: 'error',
    message: isDev ? err.message : 'Internal server error',
  });
}
