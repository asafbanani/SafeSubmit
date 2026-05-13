import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/AppError';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string | null;
  submission_text: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the submission if it exists, otherwise calls next(404) and returns null.
 * Does NOT check ownership — callers must do that after this check.
 */
function findSubmission(id: string, next: NextFunction): Submission | null {
  const row = getDb()
    .prepare('SELECT * FROM submissions WHERE id = ?')
    .get(id) as Submission | undefined;
  if (!row) {
    next(new NotFoundError('Submission not found'));
    return null;
  }
  return row;
}

/**
 * Returns true if the authenticated user may READ the given submission.
 *
 * Access rules:
 *   student            → only their own submission
 *   teaching_assistant → any submission (assists with grading)
 *   lecturer           → submissions for assignments they created
 *   admin              → any submission
 */
function canRead(req: Request, sub: Submission): boolean {
  const { role, id: uid } = req.user!;
  if (role === 'admin' || role === 'teaching_assistant') return true;
  if (role === 'student') return sub.student_id === uid;
  if (role === 'lecturer') {
    const a = getDb()
      .prepare('SELECT lecturer_id FROM assignments WHERE id = ?')
      .get(sub.assignment_id) as { lecturer_id: string } | undefined;
    return a?.lecturer_id === uid;
  }
  return false;
}

// ── GET /api/submissions ──────────────────────────────────────────────────────
// Returns the set of submissions the caller is allowed to see.

export function getSubmissions(req: Request, res: Response, next: NextFunction): void {
  try {
    const db = getDb();
    const { role, id: uid } = req.user!;

    let rows: unknown[];

    if (role === 'student') {
      // Student sees only their own submissions
      rows = db
        .prepare('SELECT * FROM submissions WHERE student_id = ? ORDER BY created_at DESC')
        .all(uid);
    } else if (role === 'lecturer') {
      // Lecturer sees submissions for all assignments they own
      rows = db
        .prepare(`
          SELECT s.*
          FROM   submissions s
          JOIN   assignments a ON s.assignment_id = a.id
          WHERE  a.lecturer_id = ?
          ORDER  BY s.created_at DESC
        `)
        .all(uid);
    } else {
      // TA and admin see all submissions
      rows = db
        .prepare('SELECT * FROM submissions ORDER BY created_at DESC')
        .all();
    }

    res.json({ submissions: rows });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/submissions/:id ──────────────────────────────────────────────────
// Returns a single submission.
// IDOR prevention: ownership / role checked before returning data.

export function getSubmissionById(req: Request, res: Response, next: NextFunction): void {
  try {
    const sub = findSubmission(req.params['id'] as string, next);
    if (!sub) return;

    if (!canRead(req, sub)) {
      next(new ForbiddenError('You do not have access to this submission'));
      return;
    }

    res.json({ submission: sub });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/submissions ─────────────────────────────────────────────────────
// Only students may create submissions.
// student_id is ALWAYS taken from req.user.id — never from the request body.
// This prevents a student from submitting on behalf of another student.

export function createSubmission(req: Request, res: Response, next: NextFunction): void {
  try {
    const { assignment_id, submission_text } = req.body as {
      assignment_id?: string;
      submission_text?: string;
    };

    if (!assignment_id || typeof assignment_id !== 'string') {
      next(new ValidationError('assignment_id is required'));
      return;
    }

    const db = getDb();

    // Verify the assignment exists and is published (accepting submissions)
    const assignment = db
      .prepare("SELECT id, status FROM assignments WHERE id = ?")
      .get(assignment_id) as { id: string; status: string } | undefined;

    if (!assignment) {
      next(new NotFoundError('Assignment not found'));
      return;
    }
    if (assignment.status !== 'published') {
      next(new ValidationError('This assignment is not currently accepting submissions'));
      return;
    }

    // student_id comes from the JWT, never from the body (IDOR prevention)
    const studentId = req.user!.id;
    const id        = randomUUID();

    db.prepare(`
      INSERT INTO submissions (id, assignment_id, student_id, submission_text, status)
      VALUES (?, ?, ?, ?, 'draft')
    `).run(id, assignment_id, studentId, submission_text ?? null);

    const created = db
      .prepare('SELECT * FROM submissions WHERE id = ?')
      .get(id) as Submission;

    res.status(201).json({ submission: created });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/submissions/:id ──────────────────────────────────────────────────
// Students: may update text on their own draft submissions.
// Lecturers / TAs: may update status (for review/grading workflow).
// Admins: may update anything.

export function updateSubmission(req: Request, res: Response, next: NextFunction): void {
  try {
    const sub = findSubmission(req.params['id'] as string, next);
    if (!sub) return;

    const db                = getDb();
    const { role, id: uid } = req.user!;

    if (role === 'student') {
      // Students may only edit their own draft submissions
      if (sub.student_id !== uid) {
        next(new ForbiddenError('You can only edit your own submissions'));
        return;
      }
      if (sub.status !== 'draft') {
        next(new ForbiddenError('Only draft submissions can be edited'));
        return;
      }

      const { submission_text } = req.body as { submission_text?: string };
      db.prepare(`
        UPDATE submissions
        SET    submission_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE  id = ?
      `).run(submission_text ?? null, sub.id);
    } else if (role === 'lecturer' || role === 'teaching_assistant') {
      // Lecturers / TAs may update status (grade / return / mark under_review)
      if (!canRead(req, sub)) {
        next(new ForbiddenError('You do not have access to this submission'));
        return;
      }

      const allowedStatuses = ['under_review', 'graded', 'returned'];
      const { status } = req.body as { status?: string };
      if (!status || !allowedStatuses.includes(status)) {
        next(new ValidationError(`status must be one of: ${allowedStatuses.join(', ')}`));
        return;
      }

      db.prepare(`
        UPDATE submissions
        SET    status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE  id = ?
      `).run(status, sub.id);
    } else if (role === 'admin') {
      // Admin may update any field
      const { submission_text, status } = req.body as {
        submission_text?: string;
        status?: string;
      };
      db.prepare(`
        UPDATE submissions
        SET    submission_text = COALESCE(?, submission_text),
               status         = COALESCE(?, status),
               updated_at     = CURRENT_TIMESTAMP
        WHERE  id = ?
      `).run(submission_text ?? null, status ?? null, sub.id);
    }

    const updated = db
      .prepare('SELECT * FROM submissions WHERE id = ?')
      .get(sub.id) as Submission;

    res.json({ submission: updated });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/submissions/:id ───────────────────────────────────────────────
// Students: may delete only their own draft submissions.
// Admins: may delete any submission.

export function deleteSubmission(req: Request, res: Response, next: NextFunction): void {
  try {
    const sub = findSubmission(req.params['id'] as string, next);
    if (!sub) return;

    const { role, id: uid } = req.user!;

    if (role === 'student') {
      if (sub.student_id !== uid) {
        next(new ForbiddenError('You can only delete your own submissions'));
        return;
      }
      if (sub.status !== 'draft') {
        next(new ForbiddenError('Only draft submissions can be deleted'));
        return;
      }
    }
    // Admin may delete anything (already checked by requireRole in route)

    getDb().prepare('DELETE FROM submissions WHERE id = ?').run(sub.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
