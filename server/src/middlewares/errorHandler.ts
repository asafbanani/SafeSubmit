import type { Request, Response, NextFunction } from 'express';

interface HttpError extends Error {
  status?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? 500;
  const isDev = process.env['NODE_ENV'] !== 'production';

  // Never expose stack traces in production responses
  console.error(err.stack);

  res.status(status).json({
    status: 'error',
    message: isDev ? err.message : 'Internal server error',
  });
}
