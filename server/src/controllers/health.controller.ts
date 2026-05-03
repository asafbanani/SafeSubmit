import type { Request, Response } from 'express';

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    message: 'Server is running',
  });
}
