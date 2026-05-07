-- ============================================================
-- SafeSubmit — SQLite Schema
-- ============================================================
-- Applied once at server startup via db.exec() in config/db.ts.
-- All CREATE TABLE and CREATE INDEX statements use IF NOT EXISTS,
-- making this script safe to re-run without data loss.
--
-- PRAGMA foreign_keys = ON is set in db.ts per-connection,
-- not here, because PRAGMAs must be set for every connection
-- and are not persistent schema changes.
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                    TEXT    NOT NULL PRIMARY KEY,
  full_name             TEXT    NOT NULL,
  email                 TEXT    NOT NULL UNIQUE,
  password_hash         TEXT    NOT NULL,
  role                  TEXT    NOT NULL
                          CHECK (role IN ('student', 'lecturer', 'teaching_assistant', 'admin')),
  status                TEXT    NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'active', 'locked', 'deactivated')),
  is_active             INTEGER NOT NULL DEFAULT 1
                          CHECK (is_active IN (0, 1)),
  last_login_at         TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until          TEXT,
  approved_by           TEXT    REFERENCES users(id) ON DELETE SET NULL,
  approved_at           TEXT,
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status    ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ------------------------------------------------------------
-- assignments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                    TEXT    NOT NULL PRIMARY KEY,
  lecturer_id           TEXT    NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title                 TEXT    NOT NULL,
  description           TEXT,
  due_date              TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  max_score             REAL,
  allow_late_submission INTEGER NOT NULL DEFAULT 0
                          CHECK (allow_late_submission IN (0, 1)),
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_assignments_lecturer_id ON assignments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status      ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date    ON assignments(due_date);

-- ------------------------------------------------------------
-- submissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id              TEXT    NOT NULL PRIMARY KEY,
  assignment_id   TEXT    NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  student_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_path       TEXT,
  submission_text TEXT,
  status          TEXT    NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'under_review', 'graded', 'returned')),
  submitted_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id    ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status        ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at  ON submissions(submitted_at);

-- ------------------------------------------------------------
-- reviews
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id            TEXT    NOT NULL PRIMARY KEY,
  submission_id TEXT    NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  reviewer_id   TEXT    NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  grade         REAL,
  feedback      TEXT,
  is_final      INTEGER NOT NULL DEFAULT 0
                  CHECK (is_final IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id   ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_final      ON reviews(is_final);

-- ------------------------------------------------------------
-- role_change_logs  (insert-only — never update or delete rows)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_change_logs (
  id             TEXT NOT NULL PRIMARY KEY,
  admin_id       TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  old_role       TEXT NOT NULL,
  new_role       TEXT NOT NULL,
  reason         TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_role_change_logs_admin_id       ON role_change_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_role_change_logs_target_user_id ON role_change_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_logs_created_at     ON role_change_logs(created_at);

-- ------------------------------------------------------------
-- audit_logs  (insert-only — never update or delete rows)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT NOT NULL PRIMARY KEY,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  status        TEXT NOT NULL
                  CHECK (status IN ('success', 'failure', 'error')),
  severity      TEXT NOT NULL DEFAULT 'info'
                  CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity   ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status     ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ------------------------------------------------------------
-- lecturer_approval_requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecturer_approval_requests (
  id           TEXT NOT NULL PRIMARY KEY,
  user_id      TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  requested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  reviewed_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note   TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_lar_user_id      ON lecturer_approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lar_status       ON lecturer_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_lar_requested_at ON lecturer_approval_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_lar_reviewed_by  ON lecturer_approval_requests(reviewed_by);
