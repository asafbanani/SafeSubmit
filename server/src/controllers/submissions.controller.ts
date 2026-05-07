import type { Request, Response } from 'express';

export function getSubmissions(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/submissions — not yet implemented' });
}

export function getSubmissionById(_req: Request, res: Response): void {
  res.status(501).json({ message: 'GET /api/submissions/:id — not yet implemented' });
}

export function createSubmission(_req: Request, res: Response): void {
  res.status(501).json({ message: 'POST /api/submissions — not yet implemented' });
}

export function updateSubmission(_req: Request, res: Response): void {
  res.status(501).json({ message: 'PUT /api/submissions/:id — not yet implemented' });
}

export function deleteSubmission(_req: Request, res: Response): void {
  res.status(501).json({ message: 'DELETE /api/submissions/:id — not yet implemented' });
}
