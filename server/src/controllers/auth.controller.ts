import type { Request, Response } from 'express';

export function register(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Register — not yet implemented' });
}

export function login(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Login — not yet implemented' });
}

export function logout(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Logout — not yet implemented' });
}

export function changePassword(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Change password — not yet implemented' });
}
