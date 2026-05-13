import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/AppError';
import type { SafeUser, UserRole } from '../models/user.model';

const SAFE_COLUMNS = `
  id, full_name, email, role, status, is_active,
  last_login_at, failed_login_attempts, locked_until,
  approved_by, approved_at, created_at, updated_at
`.trim();

const ALLOWED_ROLES: UserRole[] = ['student', 'lecturer', 'teaching_assistant', 'admin'];

// ── GET /api/users ─────────────────────────────────────────────────────────────
// Admin only — list all users.

export function getUsers(_req: Request, res: Response, next: NextFunction): void {
  try {
    const users = getDb()
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users ORDER BY created_at DESC`)
      .all() as SafeUser[];

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
// Self or admin — a user can always view their own profile.
// The route uses requireOwnerOrRole('id', 'admin') so only self or admin reaches here.

export function getUserById(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = getDb()
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`)
      .get(req.params['id']) as SafeUser | undefined;

    if (!user) {
      next(new NotFoundError('User not found'));
      return;
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/users ────────────────────────────────────────────────────────────
// Admin only — direct user creation (bypasses registration flow).
// For normal registration use POST /api/auth/register.

export function createUser(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Direct user creation — use POST /api/auth/register instead' });
}

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────
// Self: may update full_name only.
// Admin: may additionally change role and status.
// Neither may change email or password through this endpoint.

export function updateUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const db            = getDb();
    const targetId      = req.params['id'] as string;
    const { role: callerRole, id: callerId } = req.user!;

    const target = db
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`)
      .get(targetId) as SafeUser | undefined;

    if (!target) {
      next(new NotFoundError('User not found'));
      return;
    }

    const { full_name, role, status } = req.body as {
      full_name?: string;
      role?: string;
      status?: string;
    };

    if (callerRole === 'admin') {
      // Admin may update name, role, and status
      if (role && !ALLOWED_ROLES.includes(role as UserRole)) {
        next(new ValidationError(`role must be one of: ${ALLOWED_ROLES.join(', ')}`));
        return;
      }

      db.prepare(`
        UPDATE users
        SET    full_name  = COALESCE(?, full_name),
               role       = COALESCE(?, role),
               status     = COALESCE(?, status),
               updated_at = CURRENT_TIMESTAMP
        WHERE  id = ?
      `).run(full_name ?? null, role ?? null, status ?? null, targetId);
    } else {
      // Non-admin: may only update their own full_name
      if (callerId !== targetId) {
        next(new ForbiddenError('You can only update your own profile'));
        return;
      }
      if (role || status) {
        next(new ForbiddenError('Only an admin can change roles or account status'));
        return;
      }

      db.prepare(`
        UPDATE users
        SET    full_name  = COALESCE(?, full_name),
               updated_at = CURRENT_TIMESTAMP
        WHERE  id = ?
      `).run(full_name ?? null, targetId);
    }

    const updated = db
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`)
      .get(targetId) as SafeUser;

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────
// Admin only — soft-deactivate (set is_active = 0, status = 'deactivated').
// Hard delete is intentionally avoided to preserve audit trail integrity.

export function deleteUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const db       = getDb();
    const targetId = req.params['id'] as string;

    const target = db
      .prepare('SELECT id FROM users WHERE id = ?')
      .get(targetId) as { id: string } | undefined;

    if (!target) {
      next(new NotFoundError('User not found'));
      return;
    }

    // Prevent admin from deactivating their own account
    if (targetId === req.user!.id) {
      next(new ForbiddenError('You cannot deactivate your own account'));
      return;
    }

    db.prepare(`
      UPDATE users
      SET    is_active  = 0,
             status     = 'deactivated',
             updated_at = CURRENT_TIMESTAMP
      WHERE  id = ?
    `).run(targetId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
