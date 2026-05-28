import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env['NODE_ENV'] !== 'production';

  // Known operational errors — return their exact status and message
  if (err instanceof AppError) {
    res.status(err.status).json({ status: 'error', message: err.message });
    return;
  }

  // Multer size-limit exceeded
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ status: 'error', message: 'File too large. Maximum allowed size is 5 MB.' });
    } else {
      res.status(400).json({ status: 'error', message: 'File upload error. Please try again.' });
    }
    return;
  }

  // Extension rejected in fileFilter (message starts with 'REJECTED_EXTENSION:')
  if (err.message.startsWith('REJECTED_EXTENSION:')) {
    res.status(400).json({
      status:  'error',
      message: err.message.replace('REJECTED_EXTENSION: ', ''),
    });
    return;
  }

  // Unknown / unexpected error — log full stack, hide details in production
  console.error(err.stack);
  res.status(500).json({
    status:  'error',
    message: isDev ? err.message : 'Internal server error',
  });
}
