import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import { fetchResourcePreview } from '../controllers/resourcePreview.controller';

export const resourcePreviewRouter = Router();

// Only lecturers, teaching assistants, and admins may trigger server-side fetches.
// Students are explicitly excluded — they have no legitimate use case for this endpoint.
resourcePreviewRouter.post(
  '/resource-preview',
  authenticate,
  requireRole('lecturer', 'teaching_assistant', 'admin'),
  fetchResourcePreview,
);
