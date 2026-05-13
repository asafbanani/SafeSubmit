import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from '../controllers/submissions.controller';

export const submissionsRouter = Router();

// All submission routes require a valid JWT first
submissionsRouter.use(authenticate);

// GET — each role sees only what they are permitted to see (scoped inside controller)
submissionsRouter.get('/',    getSubmissions);
submissionsRouter.get('/:id', getSubmissionById);

// POST — students create their own submissions (student_id is injected server-side)
submissionsRouter.post('/', requireRole('student'), createSubmission);

// PUT — students edit their own drafts; lecturers/TAs update status for grading
submissionsRouter.put('/:id', requireRole('student', 'lecturer', 'teaching_assistant', 'admin'), updateSubmission);

// DELETE — students delete their own drafts; admins delete anything
submissionsRouter.delete('/:id', requireRole('student', 'admin'), deleteSubmission);
