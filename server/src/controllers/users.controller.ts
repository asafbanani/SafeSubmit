import type { Request, Response } from 'express';

export function getUsers(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/users — not yet implemented' });
}

export function getUserById(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/users/:id — not yet implemented' });
}

export function createUser(_req: Request, res: Response): void {
  res.status(501).json({ message: 'POST /api/users — not yet implemented' });
}

export function updateUser(_req: Request, res: Response): void {
  res.status(501).json({ message: 'PUT /api/users/:id — not yet implemented' });
}

export function deleteUser(_req: Request, res: Response): void {
  res.status(501).json({ message: 'DELETE /api/users/:id — not yet implemented' });
}
