import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/db';
import { NotFoundError } from '../utils/AppError';

// Both handlers are already guarded by authenticate + requireRole('admin') in the router.
// These controllers focus purely on data retrieval.

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  severity: string;
  description: string | null;
  created_at: string;
}

// ── GET /api/security-logs ─────────────────────────────────────────────────────
// Returns paginated audit log entries, newest first.
// Optional query params: severity (info|warning|error|critical), limit, offset.

export function getSecurityLogs(req: Request, res: Response, next: NextFunction): void {
  try {
    const db       = getDb();
    const severity = req.query['severity'] as string | undefined;
    const limit    = Math.min(parseInt(req.query['limit']  as string) || 50, 200);
    const offset   = parseInt(req.query['offset'] as string) || 0;

    const ALLOWED_SEVERITY = ['info', 'warning', 'error', 'critical'];

    let rows: AuditLog[];
    let total: number;

    if (severity && ALLOWED_SEVERITY.includes(severity)) {
      rows  = db.prepare('SELECT * FROM audit_logs WHERE severity = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(severity, limit, offset) as AuditLog[];
      total = (db.prepare('SELECT COUNT(*) as n FROM audit_logs WHERE severity = ?').get(severity) as { n: number }).n;
    } else {
      rows  = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as AuditLog[];
      total = (db.prepare('SELECT COUNT(*) as n FROM audit_logs').get() as { n: number }).n;
    }

    res.json({ logs: rows, total, limit, offset });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/security-logs/:id ─────────────────────────────────────────────────

export function getSecurityLogById(req: Request, res: Response, next: NextFunction): void {
  try {
    const log = getDb()
      .prepare('SELECT * FROM audit_logs WHERE id = ?')
      .get(req.params['id']) as AuditLog | undefined;

    if (!log) {
      next(new NotFoundError('Log entry not found'));
      return;
    }

    res.json({ log });
  } catch (err) {
    next(err);
  }
}
