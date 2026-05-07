# SafeSubmit — Database Schema

## 1. Database Overview

### Why SQLite?

SQLite is used in this phase because:

- **Zero configuration** — no server process to install or manage. A single `.db` file is enough to run the full application locally.
- **Course context** — for a secure development course, SQLite removes infrastructure complexity and lets the team focus entirely on application-level security: input validation, parameterised queries, RBAC, and audit logging.
- **Identical SQL semantics** — SQLite supports `CHECK` constraints, `FOREIGN KEY` enforcement (via `PRAGMA foreign_keys = ON`), indexes, and transactions. The query patterns written here translate directly to PostgreSQL or MySQL with minimal changes.
- **File-portable** — the database file can be committed for testing, shared between team members, or reset in seconds.

### Migration Path

When the project is ready for production or a cloud deployment, the schema can be migrated to **PostgreSQL** or **MySQL** by:

1. Replacing `TEXT` timestamp columns with native `TIMESTAMP` / `DATETIME` types.
2. Replacing SQLite's `INTEGER` booleans with native `BOOLEAN`.
3. Enabling native UUID generation (`gen_random_uuid()` in PostgreSQL).
4. Swapping the SQLite driver (`better-sqlite3`) for `pg` or `mysql2` in the Express backend.

The table structure, column names, constraints, and indexes defined here are intentionally compatible with all three databases.

---

## 2. Roles Overview

| Role | Description |
|------|-------------|
| **student** | Registers independently. Can view published assignments and submit work. Can view their own submissions and feedback. |
| **lecturer** | Registers but requires admin approval before gaining access. Creates and manages assignments. Reviews and grades student submissions. |
| **teaching_assistant** | Assigned by a lecturer or admin. Can view and review submissions for assignments they are associated with. May leave feedback if granted permission. |
| **admin** | Full system access. Approves lecturer registrations. Creates and deactivates users. Changes roles. Views all audit logs. |

### Role Lifecycle

```
Guest → registers → Student (immediately active)
Guest → registers as Lecturer → status: pending → Admin approves → status: active
Admin → creates TA → status: active (no approval required)
Admin → promotes Student to TA → role_change_logs entry created
```

---

## 3. Entity Relationship Overview

```
users (1) ──────────────────────────── (N) assignments
                                              │
                                              │ (1)
                                              ▼
users (1) ──────────────────────────── (N) submissions
                                              │
                                              │ (1)
                                              ▼
users (1) ──────────────────────────── (N) reviews
              │
              │ (1)
              ▼
lecturer_approval_requests (N) ── reviewed_by ── (1) users [admin]

users [admin] (1) ────────────────────────────── (N) role_change_logs
users [any]   (1) ────────────────────────────── (N) audit_logs  [nullable]
```

### Relationship Summary

| From | To | Relationship |
|------|----|-------------|
| `users` | `assignments` | One lecturer creates many assignments |
| `assignments` | `submissions` | One assignment receives many submissions |
| `users` | `submissions` | One student makes many submissions |
| `submissions` | `reviews` | One submission can have one or more reviews |
| `users` | `reviews` | One reviewer (lecturer or TA) writes many reviews |
| `users` | `lecturer_approval_requests` | One lecturer has one pending approval request |
| `users` (admin) | `lecturer_approval_requests` | One admin reviews many requests |
| `users` (admin) | `role_change_logs` | One admin creates many role change records |
| `users` | `audit_logs` | One user generates many audit events (nullable for guests) |

---

## 4. Tables

---

### 4.1 `users`

**Purpose:** Central identity table. Every person in the system is a user. Roles, account status, security counters, and approval metadata are all stored here.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. Never reused. |
| `full_name` | TEXT | NOT NULL | — | User's display name. |
| `email` | TEXT | NOT NULL | — | Login identifier. Must be unique across all users. |
| `password_hash` | TEXT | NOT NULL | — | bcrypt hash (cost factor ≥ 12). Plain-text passwords are never stored. |
| `role` | TEXT | NOT NULL | — | One of: `student`, `lecturer`, `teaching_assistant`, `admin`. Enforced by CHECK constraint. |
| `status` | TEXT | NOT NULL | `'pending'` | Account lifecycle state. See status values below. |
| `is_active` | INTEGER | NOT NULL | `1` | Soft-delete flag. `0` disables login without deleting data. |
| `last_login_at` | TEXT | NULL | `NULL` | ISO 8601 timestamp of the last successful login. Updated on every login. |
| `failed_login_attempts` | INTEGER | NOT NULL | `0` | Counter incremented on each failed login. Reset to 0 on successful login. |
| `locked_until` | TEXT | NULL | `NULL` | ISO 8601 timestamp. If set and in the future, the account rejects logins. Used for temporary lockout after too many failures. |
| `approved_by` | TEXT | NULL | `NULL` | FK → `users.id`. Set when an admin approves a lecturer account. NULL for all non-lecturer roles. |
| `approved_at` | TEXT | NULL | `NULL` | ISO 8601 timestamp. Set alongside `approved_by`. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Account creation timestamp. |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp. Must be updated by the application on every write. |

**Status values:**

| Value | Meaning |
|-------|---------|
| `pending` | Account created but not yet active. Used for lecturers awaiting admin approval. |
| `active` | Normal, fully operational account. |
| `locked` | Temporarily locked due to too many failed login attempts. |
| `deactivated` | Permanently disabled by an admin. Cannot log in. Data is retained. |

**Constraints:**
- `email` is UNIQUE
- `role` CHECK enforces the four valid values
- `status` CHECK enforces the four valid values
- `approved_by` is a self-referencing FK to `users.id`

**Security notes:**
- `password_hash` must be generated with bcrypt at cost factor ≥ 12. Never log, display, or return this field in API responses.
- `failed_login_attempts` and `locked_until` together implement account lockout. The application should lock the account after N consecutive failures (e.g., 5) and set `locked_until` to `now + 15 minutes`.
- `is_active = 0` is the soft-delete mechanism. Deactivated users retain their data (foreign keys remain valid) but cannot authenticate.
- Students and TAs are created with `status = 'active'`. Lecturers are created with `status = 'pending'`.

**Indexes:** `email` (unique), `role`, `status`, `is_active`

---

### 4.2 `assignments`

**Purpose:** Assignments created by lecturers. Students submit work against an assignment. An assignment has a lifecycle from draft to published to closed.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `lecturer_id` | TEXT | NOT NULL | — | FK → `users.id`. The lecturer who created this assignment. |
| `title` | TEXT | NOT NULL | — | Short title shown to students. |
| `description` | TEXT | NULL | `NULL` | Full assignment brief. May contain markdown. |
| `due_date` | TEXT | NOT NULL | — | ISO 8601 datetime. Deadline for submissions. |
| `status` | TEXT | NOT NULL | `'draft'` | Lifecycle state. See status values below. |
| `max_score` | REAL | NULL | `NULL` | Maximum possible grade. Optional. If NULL, grading is qualitative/feedback-only. |
| `allow_late_submission` | INTEGER | NOT NULL | `0` | `1` = accepts submissions after `due_date`. `0` = rejects them. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Creation timestamp. |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp. |

**Status values:**

| Value | Meaning |
|-------|---------|
| `draft` | Only visible to the lecturer. Not yet published to students. |
| `published` | Visible to students. Submissions are accepted. |
| `closed` | Past due date or manually closed. No new submissions accepted. |
| `archived` | Hidden from normal views. Retained for historical reference. |

**Constraints:**
- `lecturer_id` FK references `users(id)` with `ON DELETE RESTRICT` — assignments cannot be orphaned
- `status` CHECK enforces the four valid values

**Security notes:**
- Only a user with `role = 'lecturer'` and `status = 'active'` should be permitted to create or modify assignments. This enforcement happens in the API middleware layer, not in the DB schema.
- Students must only see assignments with `status = 'published'` for their enrolled courses.
- `allow_late_submission` is a flag, not security-critical, but must be enforced server-side (not client-side).

**Indexes:** `lecturer_id`, `status`, `due_date`

---

### 4.3 `submissions`

**Purpose:** A student's submitted work for a specific assignment. Each student may submit once per assignment (enforced by a UNIQUE constraint). A submission can be saved as a draft before final submission.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `assignment_id` | TEXT | NOT NULL | — | FK → `assignments.id`. Which assignment this is for. |
| `student_id` | TEXT | NOT NULL | — | FK → `users.id`. The student who submitted. |
| `file_path` | TEXT | NULL | `NULL` | Server-side path to the uploaded file. NULL if text-only submission. Must be validated against path traversal. |
| `submission_text` | TEXT | NULL | `NULL` | Inline text submission. NULL if file-only submission. |
| `status` | TEXT | NOT NULL | `'draft'` | Submission lifecycle state. See status values below. |
| `submitted_at` | TEXT | NULL | `NULL` | ISO 8601 timestamp. Set when the student finalises the submission (status changes to `submitted`). Different from `created_at`, which is set when the draft is first saved. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Draft creation timestamp. |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp. |

**Status values:**

| Value | Meaning |
|-------|---------|
| `draft` | Saved but not yet submitted. Only visible to the student. |
| `submitted` | Finalised and sent. `submitted_at` is set. |
| `under_review` | A reviewer has started grading. |
| `graded` | A final grade has been assigned. |
| `returned` | Returned to the student with feedback. |

**Constraints:**
- `UNIQUE(assignment_id, student_id)` — exactly one submission record per student per assignment
- `assignment_id` FK references `assignments(id)` with `ON DELETE RESTRICT`
- `student_id` FK references `users(id)` with `ON DELETE RESTRICT`
- `status` CHECK enforces valid values

**Security notes:**
- `file_path` must never be constructed from user input. The server assigns this path after validating the upload. Path traversal prevention is mandatory in the upload handler.
- Students must only be able to read or modify their own submissions (`student_id = req.user.id`). The API must enforce this — the schema cannot.
- A submission in `graded` or `returned` status must not be editable by the student. This is enforced in the API layer.
- The `UNIQUE` constraint prevents submission duplication races.

**Indexes:** `assignment_id`, `student_id`, `status`, `submitted_at`

---

### 4.4 `reviews`

**Purpose:** Grades and feedback written by a lecturer or teaching assistant for a specific submission. A submission may have multiple review records (e.g., a draft review followed by a final review), but only one should be marked `is_final = 1`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `submission_id` | TEXT | NOT NULL | — | FK → `submissions.id`. The submission being reviewed. |
| `reviewer_id` | TEXT | NOT NULL | — | FK → `users.id`. The lecturer or TA who wrote this review. |
| `grade` | REAL | NULL | `NULL` | Numeric grade. NULL if feedback-only. Must be ≤ `assignments.max_score` (enforced in API). |
| `feedback` | TEXT | NULL | `NULL` | Written feedback for the student. |
| `is_final` | INTEGER | NOT NULL | `0` | `1` = this is the official final grade. `0` = draft or interim. Only one final review per submission should exist (enforced in API). |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Review creation timestamp. |
| `updated_at` | TEXT | NOT NULL | `datetime('now')` | Last modification timestamp. |

**Constraints:**
- `submission_id` FK references `submissions(id)` with `ON DELETE RESTRICT`
- `reviewer_id` FK references `users(id)` with `ON DELETE RESTRICT`

**Security notes:**
- Only users with `role IN ('lecturer', 'teaching_assistant', 'admin')` may create reviews. Enforced in API middleware.
- A TA should only be able to review submissions for assignments their lecturer has granted them access to. This association is outside the schema as currently defined — a future `assignment_ta` join table can model it.
- `grade` should be validated against `assignments.max_score` in the API before insert.
- Students must never be able to write or modify reviews. Role check in the API middleware is the enforcement point.

**Indexes:** `submission_id`, `reviewer_id`, `is_final`

---

### 4.5 `role_change_logs`

**Purpose:** Immutable audit trail of every role change made by an admin. Required for accountability and traceability. Rows are insert-only — never updated or deleted.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `admin_id` | TEXT | NOT NULL | — | FK → `users.id`. The admin who performed the change. |
| `target_user_id` | TEXT | NOT NULL | — | FK → `users.id`. The user whose role was changed. |
| `old_role` | TEXT | NOT NULL | — | The user's role before the change. |
| `new_role` | TEXT | NOT NULL | — | The user's role after the change. |
| `reason` | TEXT | NULL | `NULL` | Optional justification provided by the admin. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Timestamp of when the change occurred. |

**Constraints:**
- `admin_id` FK references `users(id)` with `ON DELETE RESTRICT`
- `target_user_id` FK references `users(id)` with `ON DELETE RESTRICT`
- No `updated_at` — this table is insert-only. Records must never be modified.

**Security notes:**
- This table is append-only. The API must not expose an update or delete endpoint for it.
- Every role change in the system must produce a row here. The API should insert into `role_change_logs` in the same transaction as updating `users.role`.
- Only admins can read this table. Non-admin tokens must receive a 403.
- The `reason` field gives admins a channel to document justification, supporting accountability.

**Indexes:** `admin_id`, `target_user_id`, `created_at`

---

### 4.6 `audit_logs`

**Purpose:** General-purpose security and activity event log. Captures every significant action in the system: logins (successful and failed), submissions, file uploads, admin actions, and errors. `user_id` is nullable to record events from unauthenticated actors (e.g., failed login attempts from unknown accounts).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `user_id` | TEXT | NULL | `NULL` | FK → `users.id`. NULL for unauthenticated events (e.g., login with unknown email). |
| `action` | TEXT | NOT NULL | — | Event name. Examples: `login_success`, `login_failure`, `register`, `submit_assignment`, `upload_file`, `change_role`, `deactivate_user`. |
| `resource_type` | TEXT | NULL | `NULL` | Type of entity affected. Examples: `user`, `assignment`, `submission`, `review`. |
| `resource_id` | TEXT | NULL | `NULL` | UUID of the specific entity affected. |
| `ip_address` | TEXT | NULL | `NULL` | IPv4 or IPv6 address of the requester. |
| `user_agent` | TEXT | NULL | `NULL` | HTTP User-Agent header. |
| `status` | TEXT | NOT NULL | — | Outcome of the action: `success`, `failure`, `error`. |
| `severity` | TEXT | NOT NULL | `'info'` | Importance level: `info`, `warning`, `error`, `critical`. |
| `description` | TEXT | NULL | `NULL` | Human-readable description of the event. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Timestamp of the event. |

**Standard `action` values:**

| Action | Severity | Description |
|--------|----------|-------------|
| `login_success` | info | User authenticated successfully |
| `login_failure` | warning | Wrong credentials provided |
| `account_locked` | warning | Account locked after too many failures |
| `logout` | info | User ended their session |
| `register` | info | New user registered |
| `lecturer_approval_requested` | info | Lecturer registration awaiting admin review |
| `lecturer_approved` | info | Admin approved a lecturer account |
| `lecturer_rejected` | warning | Admin rejected a lecturer account |
| `submit_assignment` | info | Student submitted work |
| `upload_file` | info | File uploaded |
| `change_role` | warning | Admin changed a user's role |
| `deactivate_user` | warning | Admin deactivated an account |
| `unauthorized_access` | error | Request rejected for insufficient permissions |
| `invalid_token` | error | JWT was malformed or expired |
| `rate_limit_exceeded` | warning | Too many requests from one source |

**Constraints:**
- `user_id` FK references `users(id)` with `ON DELETE SET NULL` — logs are retained even if the user is deleted
- `status` CHECK enforces `success`, `failure`, `error`
- `severity` CHECK enforces `info`, `warning`, `error`, `critical`
- No `updated_at` — this table is insert-only. Logs must never be modified.

**Security notes:**
- This table is append-only. No update or delete endpoint may exist for it.
- Only admins should be able to read the full audit log. Students and lecturers have no access.
- `ip_address` and `user_agent` are important for detecting anomalous behaviour (e.g., same account logging in from many different IPs).
- Logging must be fire-and-forget in the API: a logging failure must never crash the main request.
- Logs must capture failed login attempts even when the email is unknown — use `user_id = NULL` and record the attempted email in `description`.
- Do not log `password_hash` or raw passwords anywhere.

**Indexes:** `user_id`, `action`, `severity`, `status`, `created_at`

---

### 4.7 `lecturer_approval_requests`

**Purpose:** Tracks the approval workflow for lecturer registrations. When a lecturer registers, a row is inserted here with `status = 'pending'`. An admin reviews it and sets `status` to `approved` or `rejected`, which then activates (or keeps deactivated) the corresponding `users` row.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | NOT NULL | — | UUID v4. Primary key. |
| `user_id` | TEXT | NOT NULL | — | FK → `users.id`. The lecturer who requested activation. UNIQUE — one active request per user. |
| `requested_at` | TEXT | NOT NULL | `datetime('now')` | When the lecturer registered and the request was created. |
| `reviewed_by` | TEXT | NULL | `NULL` | FK → `users.id`. The admin who reviewed this request. NULL until reviewed. |
| `reviewed_at` | TEXT | NULL | `NULL` | ISO 8601 timestamp of the admin's decision. NULL until reviewed. |
| `status` | TEXT | NOT NULL | `'pending'` | Approval state: `pending`, `approved`, `rejected`. |
| `admin_note` | TEXT | NULL | `NULL` | Optional note from the admin explaining the decision. |
| `created_at` | TEXT | NOT NULL | `datetime('now')` | Row creation timestamp (same as `requested_at`; kept for schema consistency). |

**Constraints:**
- `user_id` is UNIQUE — only one approval request per lecturer at a time
- `user_id` FK references `users(id)` with `ON DELETE CASCADE` — if the user is deleted, their pending request is also removed
- `reviewed_by` FK references `users(id)` with `ON DELETE SET NULL`
- `status` CHECK enforces `pending`, `approved`, `rejected`

**Security notes:**
- When an admin approves a request, the API must atomically: (1) update `lecturer_approval_requests.status = 'approved'`, (2) update `users.status = 'active'`, (3) set `users.approved_by` and `users.approved_at`. These three writes should happen in a single transaction.
- Only admins should be able to list or update approval requests. Role check in API middleware.
- A rejected lecturer cannot re-apply unless the admin resets their record or they register again with a different email.

**Indexes:** `user_id` (unique), `status`, `requested_at`, `reviewed_by`

---

## 5. SQL Schema

```sql
-- ============================================================
-- SafeSubmit — SQLite Schema
-- ============================================================
-- Requires: PRAGMA foreign_keys = ON at connection time.
-- UUIDs are generated by the application layer (e.g., crypto.randomUUID()).
-- Timestamps are stored as ISO 8601 TEXT: 'YYYY-MM-DDTHH:MM:SSZ'.
-- ============================================================

PRAGMA foreign_keys = ON;

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

CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status     ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_active  ON users(is_active);

-- ------------------------------------------------------------
-- assignments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                   TEXT    NOT NULL PRIMARY KEY,
  lecturer_id          TEXT    NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title                TEXT    NOT NULL,
  description          TEXT,
  due_date             TEXT    NOT NULL,
  status               TEXT    NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  max_score            REAL,
  allow_late_submission INTEGER NOT NULL DEFAULT 0
                         CHECK (allow_late_submission IN (0, 1)),
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
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
-- role_change_logs  (insert-only — never update or delete)
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
-- audit_logs  (insert-only — never update or delete)
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
```

---

## 6. Security Notes

### 6.1 Password Hashing

Passwords are stored exclusively as bcrypt hashes in the `password_hash` column.

- **Algorithm:** bcrypt with cost factor ≥ 12
- **Plain-text passwords must never be stored, logged, or returned in any API response**
- The cost factor should be increased over time as hardware improves
- When verifying a password, use `bcrypt.compare(plaintext, hash)` — never hash the candidate and compare hashes directly
- Generate the hash in the service layer, not in the controller or route handler

```js
// Correct
const hash = await bcrypt.hash(password, 12);

// Verify
const valid = await bcrypt.compare(candidatePassword, user.password_hash);
```

### 6.2 UUID Usage

All primary keys are UUID v4 generated by the application:

```js
const { randomUUID } = require('crypto');
const id = randomUUID(); // e.g., '550e8400-e29b-41d4-a716-446655440000'
```

Why UUIDs instead of integer IDs:
- **No enumeration attacks** — an attacker cannot guess `id = 2` to retrieve the next record
- **Safe to expose in URLs** — `/api/submissions/550e8400-...` reveals nothing about record counts or ordering
- **Globally unique** — safe to merge data from multiple environments without ID collisions

### 6.3 Audit Logs

Every significant action must produce a row in `audit_logs`. Key points:

- The log entry must be written **after** the action completes, so `status` reflects the actual outcome
- Logging must be **fire-and-forget** — a logging failure must not cause the main request to fail
- Log **failed login attempts** even when the email is not found (use `user_id = NULL`, describe the attempt in `description`)
- Never log `password_hash` or raw passwords in `description`
- The `ip_address` should be read from `req.ip` with Express `trust proxy` configured correctly if behind a reverse proxy

### 6.4 Role Changes

Every change to a user's `role` field must:

1. Update `users.role` and `users.updated_at`
2. Insert a row into `role_change_logs` with `old_role`, `new_role`, `admin_id`, and optional `reason`
3. Both operations must happen in a **single database transaction** — if either fails, neither is committed
4. The API must verify that the requesting user has `role = 'admin'` before allowing this operation

### 6.5 Lecturer Approval Workflow

Registration flow for lecturers:

1. Lecturer submits registration form → `users` row created with `status = 'pending'`
2. `lecturer_approval_requests` row created with `status = 'pending'`
3. `audit_logs` entry: `action = 'lecturer_approval_requested'`
4. Admin reviews the request via the admin panel
5. Admin approves → **in one transaction:**
   - `lecturer_approval_requests.status = 'approved'`, `reviewed_by = admin.id`, `reviewed_at = now()`
   - `users.status = 'active'`, `users.approved_by = admin.id`, `users.approved_at = now()`
   - `audit_logs` entry: `action = 'lecturer_approved'`
6. Admin rejects → `lecturer_approval_requests.status = 'rejected'`, `users.status = 'deactivated'`
7. Lecturer login attempts while `status = 'pending'` must return a clear message: "Your account is awaiting admin approval" — not a generic invalid credentials error (this is a UX exception to the generic-error rule, since no credential is being checked)

### 6.6 Failed Login Tracking and Account Locking

The `users` table tracks failed attempts with two fields:

| Field | Purpose |
|-------|---------|
| `failed_login_attempts` | Counter. Incremented on every failed login. |
| `locked_until` | Timestamp. If set and in the future, all login attempts are rejected. |

**Locking algorithm (application layer):**

```
1. Find user by email
2. If user not found → log audit event, return generic "Invalid credentials"
3. If user.status = 'locked' AND user.locked_until > now() → return "Account temporarily locked"
4. If bcrypt.compare fails:
   a. Increment failed_login_attempts
   b. If failed_login_attempts >= LOCK_THRESHOLD (e.g., 5):
      - Set status = 'locked'
      - Set locked_until = now() + LOCK_DURATION (e.g., 15 minutes)
   c. Log audit event: action = 'login_failure'
   d. Return generic "Invalid credentials"
5. If bcrypt.compare succeeds:
   a. Reset failed_login_attempts = 0
   b. Clear locked_until = NULL
   c. Set status = 'active' (in case lock expired naturally)
   d. Set last_login_at = now()
   e. Log audit event: action = 'login_success'
   f. Return JWT
```

**Important:** Always return the same generic error message for both "email not found" and "wrong password". This prevents **user enumeration attacks** — an attacker must not be able to determine whether an email is registered in the system.

### 6.7 Input Validation and SQL Injection

- All database queries must use **parameterised statements** — never string-interpolate user input into SQL
- With `better-sqlite3` (the recommended SQLite driver for Node.js): `db.prepare('SELECT * FROM users WHERE email = ?').get(email)`
- Validate all input at the API boundary using Zod schemas before it reaches the database layer
- The `CHECK` constraints in the schema are a defence-in-depth measure — they catch bad data that slips past the API layer, but they do not replace application-level validation

---

## 7. Future Backend Integration Notes

### 7.1 Database Setup

```js
// server/src/config/db.ts
const Database = require('better-sqlite3');
const db = new Database('./safesubmit.db');
db.pragma('journal_mode = WAL');  // Better concurrent read performance
db.pragma('foreign_keys = ON');   // Must be set — SQLite disables FK checks by default
```

The schema SQL from Section 5 should be run once on startup via a migration script or an `initDb()` function called before `app.listen()`.

### 7.2 Auth Routes (`/api/auth`)

| Method | Path | Handler | Tables |
|--------|------|---------|--------|
| POST | `/register` | Create user + approval request if lecturer | `users`, `lecturer_approval_requests`, `audit_logs` |
| POST | `/login` | Verify credentials, issue JWT | `users`, `audit_logs` |
| POST | `/logout` | Client discards token (stateless) | `audit_logs` |
| PUT | `/change-password` | Verify current password, update hash | `users`, `audit_logs` |

### 7.3 Assignment Routes (`/api/assignments`)

| Method | Path | Roles | Tables |
|--------|------|-------|--------|
| GET | `/` | All authenticated | `assignments` |
| GET | `/:id` | All authenticated | `assignments` |
| POST | `/` | lecturer, admin | `assignments`, `audit_logs` |
| PUT | `/:id` | lecturer (owner), admin | `assignments`, `audit_logs` |
| DELETE | `/:id` | lecturer (owner), admin | `assignments`, `audit_logs` |

### 7.4 Submission Routes (`/api/submissions`)

| Method | Path | Roles | Tables |
|--------|------|-------|--------|
| GET | `/` | student (own), lecturer (their assignments), admin | `submissions` |
| GET | `/:id` | student (own), lecturer (their assignments), ta, admin | `submissions` |
| POST | `/` | student | `submissions`, `audit_logs` |
| PUT | `/:id` | student (own, if not graded) | `submissions`, `audit_logs` |

### 7.5 Review Routes (`/api/reviews`)

| Method | Path | Roles | Tables |
|--------|------|-------|--------|
| GET | `/:submissionId` | lecturer, ta, admin | `reviews` |
| POST | `/` | lecturer, ta | `reviews`, `submissions`, `audit_logs` |
| PUT | `/:id` | reviewer (own review), lecturer | `reviews`, `audit_logs` |

### 7.6 Admin Routes (`/api/admin`)

| Method | Path | Action | Tables |
|--------|------|--------|--------|
| GET | `/users` | List all users | `users` |
| PUT | `/users/:id/role` | Change role | `users`, `role_change_logs`, `audit_logs` |
| PUT | `/users/:id/deactivate` | Deactivate user | `users`, `audit_logs` |
| GET | `/approval-requests` | List pending lecturer approvals | `lecturer_approval_requests` |
| PUT | `/approval-requests/:id` | Approve or reject | `lecturer_approval_requests`, `users`, `audit_logs` |
| GET | `/audit-logs` | View security event log | `audit_logs` |
| GET | `/role-change-logs` | View role change history | `role_change_logs` |

### 7.7 Audit Log Middleware

The Express backend should include a middleware or utility function that writes to `audit_logs` after every sensitive operation:

```js
// server/src/utils/auditLogger.ts  (future)
async function logAudit({ userId, action, resourceType, resourceId, ipAddress, userAgent, status, severity, description }) {
  // Fire-and-forget: never await this in the request handler
  // Use try/catch internally — a logging failure must not crash the request
}
```

The middleware should be called:
- In auth controllers (login, logout, register, password change)
- In the `authenticate` middleware on JWT failure
- In the `authorize` middleware on permission denial
- In any controller that creates, modifies, or deletes a record

### 7.8 Recommended SQLite Driver

**`better-sqlite3`** — synchronous, fast, full-featured, well-maintained:

```
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

Why not `sqlite3` (async callback-based): `better-sqlite3` uses synchronous I/O which is simpler and avoids callback complexity. For a single-server web application at course scale, synchronous SQLite is performant enough and eliminates a class of async bugs.
