import { Router } from 'express';
import {
  getSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from '../controllers/submissions.controller';

export const submissionsRouter = Router();

submissionsRouter.get('/', getSubmissions);
submissionsRouter.get('/:id', getSubmissionById);
submissionsRouter.post('/', createSubmission);
submissionsRouter.put('/:id', updateSubmission);
submissionsRouter.delete('/:id', deleteSubmission);
