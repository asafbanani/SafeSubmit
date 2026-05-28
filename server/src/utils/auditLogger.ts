import { randomUUID } from 'crypto';
import { getDb } from '../config/db';

interface AuditParams {
  userId:       string | null;
  action:       string;
  resourceType?: string;
  resourceId?:  string;
  ipAddress?:   string | null;
  status:       'success' | 'failure' | 'error';
  severity:     'info' | 'warning' | 'error' | 'critical';
  description?: string;
}

/**
 * Fire-and-forget audit log write.
 * A logging failure must NEVER crash or reject the calling request.
 */
export function auditLog(params: AuditParams): void {
  try {
    getDb().prepare(`
      INSERT INTO audit_logs
        (id, user_id, action, resource_type, resource_id, ip_address, status, severity, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      params.userId,
      params.action,
      params.resourceType  ?? null,
      params.resourceId    ?? null,
      params.ipAddress     ?? null,
      params.status,
      params.severity,
      params.description   ?? null,
    );
  } catch {
    console.error('[auditLog] Failed to write audit entry for action:', params.action);
  }
}
