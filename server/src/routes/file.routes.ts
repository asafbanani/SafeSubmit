import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import { upload } from '../middlewares/upload.middleware';
import {
  uploadAssignmentFile,
  listAssignmentFiles,
  uploadSubmissionFile,
  listSubmissionFiles,
  downloadFile,
  deleteFile,
} from '../controllers/file.controller';

export const fileRouter = Router();

// ── Assignment instruction files ──────────────────────────────────────────────
// Lecturers (owner) and admins can upload; all authenticated users can list.
fileRouter.post(
  '/assignments/:assignmentId/files',
  authenticate,
  requireRole('lecturer', 'admin'),
  upload.single('file'),
  uploadAssignmentFile,
);

fileRouter.get(
  '/assignments/:assignmentId/files',
  authenticate,
  listAssignmentFiles,
);

// ── Student submission files ──────────────────────────────────────────────────
// Only students may upload. Access control for listing is in the controller.
fileRouter.post(
  '/assignments/:assignmentId/submissions/upload',
  authenticate,
  requireRole('student'),
  upload.single('file'),
  uploadSubmissionFile,
);

fileRouter.get(
  '/submissions/:submissionId/files',
  authenticate,
  listSubmissionFiles,
);

// ── Shared download and delete ────────────────────────────────────────────────
// Fine-grained access control lives inside the controller, not in middleware,
// because the rules depend on the file type, owner, and related resource state.
fileRouter.get(
  '/files/:fileId/download',
  authenticate,
  downloadFile,
);

fileRouter.delete(
  '/files/:fileId',
  authenticate,
  deleteFile,
);
