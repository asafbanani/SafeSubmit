import { randomUUID } from 'crypto';
import { getDb } from '../config/db';

// ── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'lecturer' | 'teaching_assistant' | 'admin';
export type UserStatus = 'pending' | 'active' | 'locked' | 'deactivated';

/** Full row as stored in the database — includes password_hash. */
export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  is_active: number;            // SQLite boolean: 1 = true, 0 = false
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Safe to send in API responses — password_hash is excluded. */
export type SafeUser = Omit<User, 'password_hash'>;

export interface CreateUserInput {
  full_name: string;
  email: string;
  password_hash: string;        // Must already be a bcrypt hash — never plain text
  role: UserRole;
}

// ── Columns returned in safe queries (no password_hash) ──────────────────────

const SAFE_COLUMNS = `
  id, full_name, email, role, status, is_active,
  last_login_at, failed_login_attempts, locked_until,
  approved_by, approved_at, created_at, updated_at
`.trim();

// ── Model ────────────────────────────────────────────────────────────────────

const UserModel = {
  /** Returns the full row including password_hash — for internal auth use only. */
  findByEmail(email: string): User | undefined {
    return getDb()
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined;
  },

  /** Returns the full row including password_hash — for internal auth use only. */
  findById(id: string): User | undefined {
    return getDb()
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as User | undefined;
  },

  /** Returns a SafeUser (no password_hash) — safe for API responses. */
  findSafeById(id: string): SafeUser | undefined {
    return getDb()
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`)
      .get(id) as SafeUser | undefined;
  },

  /**
   * Inserts a new user row and returns the created SafeUser.
   *
   * Status is set automatically:
   *   - lecturer  → 'pending'  (requires admin approval before login)
   *   - all others → 'active'
   *
   * password_hash must be a bcrypt hash — this function never hashes itself.
   */
  create(input: CreateUserInput): SafeUser {
    const db = getDb();
    const id = randomUUID();
    const status: UserStatus = input.role === 'lecturer' ? 'pending' : 'active';

    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.full_name, input.email, input.password_hash, input.role, status);

    return db
      .prepare(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`)
      .get(id) as SafeUser;
  },

  /** Atomically increments failed_login_attempts. */
  incrementFailedAttempts(id: string): void {
    getDb()
      .prepare('UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(id);
  },

  /** Locks the account and records when the lock expires. */
  lockAccount(id: string, until: Date): void {
    getDb()
      .prepare(`UPDATE users SET status = 'locked', locked_until = ?, failed_login_attempts = failed_login_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(until.toISOString(), id);
  },

  /** Clears the failed attempt counter and unlocks the account. Called on successful login. */
  resetFailedAttempts(id: string): void {
    getDb()
      .prepare(`UPDATE users SET failed_login_attempts = 0, status = CASE WHEN status = 'locked' THEN 'active' ELSE status END, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(id);
  },

  /** Records the current timestamp as the last successful login. */
  updateLastLogin(id: string): void {
    getDb()
      .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(id);
  },
};

export default UserModel;
