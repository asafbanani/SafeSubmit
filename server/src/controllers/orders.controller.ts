import type { Request, Response } from 'express';

export function getOrders(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/orders — not yet implemented' });
}

export function getOrderById(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/orders/:id — not yet implemented' });
}

export function createOrder(_req: Request, res: Response): void {
  res.status(501).json({ message: 'POST /api/orders — not yet implemented' });
}

export function updateOrder(_req: Request, res: Response): void {
  res.status(501).json({ message: 'PUT /api/orders/:id — not yet implemented' });
}

export function deleteOrder(_req: Request, res: Response): void {
  res.status(501).json({ message: 'DELETE /api/orders/:id — not yet implemented' });
}
