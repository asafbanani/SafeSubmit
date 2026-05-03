import type { Request, Response } from 'express';

export function getSecurityLogs(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/security-logs — not yet implemented' });
}

export function getSecurityLogById(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/security-logs/:id — not yet implemented' });
}
