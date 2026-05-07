import { randomUUID } from 'crypto';
import { getDb } from '../config/db';

// ── Types ────────────────────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface LecturerApprovalRequest {
  id: string;
  user_id: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: ApprovalStatus;
  admin_note: string | null;
  created_at: string;
}

// ── Model ────────────────────────────────────────────────────────────────────

const LecturerApprovalModel = {
  /**
   * Creates a pending approval request for a newly registered lecturer.
   * Called inside the same transaction as user creation in the register controller.
   */
  create(userId: string): LecturerApprovalRequest {
    const db = getDb();
    const id = randomUUID();

    db.prepare(`
      INSERT INTO lecturer_approval_requests (id, user_id)
      VALUES (?, ?)
    `).run(id, userId);

    return db
      .prepare('SELECT * FROM lecturer_approval_requests WHERE id = ?')
      .get(id) as LecturerApprovalRequest;
  },

  findByUserId(userId: string): LecturerApprovalRequest | undefined {
    return getDb()
      .prepare('SELECT * FROM lecturer_approval_requests WHERE user_id = ?')
      .get(userId) as LecturerApprovalRequest | undefined;
  },

  findById(id: string): LecturerApprovalRequest | undefined {
    return getDb()
      .prepare('SELECT * FROM lecturer_approval_requests WHERE id = ?')
      .get(id) as LecturerApprovalRequest | undefined;
  },

  findAllPending(): LecturerApprovalRequest[] {
    return getDb()
      .prepare(`SELECT * FROM lecturer_approval_requests WHERE status = 'pending' ORDER BY requested_at ASC`)
      .all() as LecturerApprovalRequest[];
  },
};

export default LecturerApprovalModel;
