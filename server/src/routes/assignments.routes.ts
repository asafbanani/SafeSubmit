import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/authorize';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignments.controller';

export const assignmentsRouter = Router();

// ── All authenticated users may READ assignments ───────────────────────────────
// This satisfies requirement 4: shared read access across all roles.
assignmentsRouter.get('/',    authenticate, getAssignments);
assignmentsRouter.get('/:id', authenticate, getAssignmentById);

// ── Only lecturers (and admins) may CREATE / EDIT / DELETE ────────────────────
// Backend enforcement — the frontend hides these buttons, but these middleware
// guards are the real security boundary.
assignmentsRouter.post('/',    authenticate, requireRole('lecturer', 'admin'), createAssignment);
assignmentsRouter.put('/:id',  authenticate, requireRole('lecturer', 'admin'), updateAssignment);
assignmentsRouter.delete('/:id', authenticate, requireRole('lecturer', 'admin'), deleteAssignment);
