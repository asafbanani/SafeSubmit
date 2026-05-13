import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/AppError';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  lecturer_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  max_score: number | null;
  allow_late_submission: number;
  created_at: string;
  updated_at: string;
}

const VALID_STATUSES = ['draft', 'published', 'closed', 'archived'];

// ── GET /api/assignments ───────────────────────────────────────────────────────
// All authenticated users may view assignments.
// Students and TAs see only 'published' assignments.
// Lecturers see their own assignments in any status + all published ones.
// Admins see everything.

export function getAssignments(req: Request, res: Response, next: NextFunction): void {
  try {
    const db                = getDb();
    const { role, id: uid } = req.user!;

    let rows: Assignment[];

    if (role === 'admin') {
      rows = db
        .prepare('SELECT * FROM assignments ORDER BY due_date ASC')
        .all() as Assignment[];
    } else if (role === 'lecturer') {
      // Own assignments (any status) + published assignments from others
      rows = db
        .prepare(`
          SELECT * FROM assignments
          WHERE  lecturer_id = ? OR status = 'published'
          ORDER  BY due_date ASC
        `)
        .all(uid) as Assignment[];
    } else {
      // Students and TAs see only published assignments
      rows = db
        .prepare("SELECT * FROM assignments WHERE status = 'published' ORDER BY due_date ASC")
        .all() as Assignment[];
    }

    res.json({ assignments: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/assignments/:id ───────────────────────────────────────────────────
// All authenticated users may view a single assignment.
// Non-admins / non-owner-lecturers cannot see draft/archived assignments.

export function getAssignmentById(req: Request, res: Response, next: NextFunction): void {
  try {
    const db                = getDb();
    const { role, id: uid } = req.user!;

    const assignment = db
      .prepare('SELECT * FROM assignments WHERE id = ?')
      .get(req.params['id']) as Assignment | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    // Hide drafts and archived from students/TAs and lecturers who don't own it
    const isPublicStatus = assignment.status === 'published' || assignment.status === 'closed';
    const isOwnerLecturer = role === 'lecturer' && assignment.lecturer_id === uid;
    const isAdmin = role === 'admin';

    if (!isPublicStatus && !isOwnerLecturer && !isAdmin) {
      next(new NotFoundError('Assignment not found')); // 404 not 403 — avoids info leak
      return;
    }

    res.json({ assignment });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/assignments ──────────────────────────────────────────────────────
// Lecturers only. lecturer_id is taken from req.user.id, never from the body.

export function createAssignment(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description, due_date, max_score, allow_late_submission } = req.body as {
      title?: string;
      description?: string;
      due_date?: string;
      max_score?: number;
      allow_late_submission?: boolean;
    };

    if (!title || typeof title !== 'string' || title.trim() === '') {
      next(new ValidationError('title is required'));
      return;
    }
    if (!due_date || typeof due_date !== 'string') {
      next(new ValidationError('due_date is required'));
      return;
    }

    const db         = getDb();
    const id         = randomUUID();
    const lecturerId = req.user!.id; // Never trust body for ownership

    db.prepare(`
      INSERT INTO assignments (id, lecturer_id, title, description, due_date, max_score, allow_late_submission, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(
      id, lecturerId, title.trim(),
      description ?? null,
      due_date,
      max_score ?? null,
      allow_late_submission ? 1 : 0,
    );

    const created = db
      .prepare('SELECT * FROM assignments WHERE id = ?')
      .get(id) as Assignment;

    res.status(201).json({ assignment: created });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/assignments/:id ───────────────────────────────────────────────────
// Lecturer who owns the assignment, or admin.
// This satisfies requirement 4: all users can READ, but only the owning lecturer
// (or admin) can EDIT — enforced here in the backend, not just in the frontend.

export function updateAssignment(req: Request, res: Response, next: NextFunction): void {
  try {
    const db                = getDb();
    const { role, id: uid } = req.user!;

    const assignment = db
      .prepare('SELECT * FROM assignments WHERE id = ?')
      .get(req.params['id']) as Assignment | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    // Only the lecturer who created it, or an admin, may edit
    if (role === 'lecturer' && assignment.lecturer_id !== uid) {
      next(new ForbiddenError('You can only edit your own assignments'));
      return;
    }

    const { title, description, due_date, status, max_score, allow_late_submission } = req.body as {
      title?: string;
      description?: string;
      due_date?: string;
      status?: string;
      max_score?: number;
      allow_late_submission?: boolean;
    };

    if (status && !VALID_STATUSES.includes(status)) {
      next(new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`));
      return;
    }

    db.prepare(`
      UPDATE assignments
      SET    title                 = COALESCE(?, title),
             description          = COALESCE(?, description),
             due_date             = COALESCE(?, due_date),
             status               = COALESCE(?, status),
             max_score            = COALESCE(?, max_score),
             allow_late_submission = COALESCE(?, allow_late_submission),
             updated_at           = CURRENT_TIMESTAMP
      WHERE  id = ?
    `).run(
      title ?? null, description ?? null, due_date ?? null,
      status ?? null, max_score ?? null,
      allow_late_submission !== undefined ? (allow_late_submission ? 1 : 0) : null,
      assignment.id,
    );

    const updated = db
      .prepare('SELECT * FROM assignments WHERE id = ?')
      .get(assignment.id) as Assignment;

    res.json({ assignment: updated });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/assignments/:id ────────────────────────────────────────────────
// Lecturer who owns it, or admin. Cannot delete if submissions exist.

export function deleteAssignment(req: Request, res: Response, next: NextFunction): void {
  try {
    const db                = getDb();
    const { role, id: uid } = req.user!;

    const assignment = db
      .prepare('SELECT * FROM assignments WHERE id = ?')
      .get(req.params['id']) as Assignment | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }

    if (role === 'lecturer' && assignment.lecturer_id !== uid) {
      next(new ForbiddenError('You can only delete your own assignments'));
      return;
    }

    const subCount = (db
      .prepare('SELECT COUNT(*) as n FROM submissions WHERE assignment_id = ?')
      .get(assignment.id) as { n: number }).n;

    if (subCount > 0) {
      next(new ValidationError('Cannot delete an assignment that has submissions. Archive it instead.'));
      return;
    }

    db.prepare('DELETE FROM assignments WHERE id = ?').run(assignment.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
