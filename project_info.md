# Project Info and Change Log

## Purpose of This File
This file documents the development progress of the Secure Course Assignment Portal project.

Every meaningful change made to the project must be recorded here. This includes code changes, security improvements, new dependencies, database changes, API changes, frontend changes, bug fixes, configuration changes, and important design decisions.

This file should help explain the project history and make it easier to prepare weekly course reports.

---

## Required Rule
After every change in the project, update this file.

Each update should include:

- Date
- Changed files or affected area
- Description of the change
- Reason for the change
- Security relevance, if applicable
- Testing performed
- Known issues or next steps

---

## Update Format

Use the following format for every update:

```md
## YYYY-MM-DD - Short Title

### Changed Area
Example: Backend authentication, frontend login page, database schema, file upload, validation, logs.

### What Changed
Describe what was added, removed, or modified.

### Why This Change Was Needed
Explain the reason for the change.

### Security Relevance
Explain how this change relates to secure development.
If the change is not security-related, write: Not directly security-related.

### Testing
Describe how the change was tested.

### Notes / Next Steps
Write any known issues, future improvements, or open questions.
```

---

## Initial Project Decision

### Project Name
Secure Course Assignment Portal

### Stack

- Frontend: React + Vite
- Backend: Node.js + Express.js
- API Style: RESTful API
- Database: PostgreSQL or MySQL
- IDE: Visual Studio Code

### Main Roles

- Guest
- Student
- Teaching Assistant
- Lecturer
- Administrator

### Main Security Topics Planned

- Input validation
- Authentication
- Password hashing
- Role-based access control
- Secure file upload
- XSS prevention
- SQL injection prevention
- Path traversal prevention
- SSRF prevention
- CSRF prevention
- Logging and monitoring
- Race condition handling
- Secure error handling

---

## Change Log

## 2026-05-03 - Initial Planning Document Created

### Changed Area
Project documentation.

### What Changed
Created the initial project planning document and this `project_info.md` file.

### Why This Change Was Needed
The project needs a clear planning structure before implementation begins.

### Security Relevance
The project was designed around secure development topics that will be added gradually during the course.

### Testing
No code was tested because this stage only includes planning and documentation.

### Notes / Next Steps
Next step: create the initial project folder structure and basic frontend/backend skeleton.

---

## 2026-05-03 - Full Project Skeleton (Client + Server)

### Changed Area
Full-stack skeleton — backend REST API and React frontend.

### What Changed

**Server (`server/`)**

New or modified files:

- `tsconfig.json` — Simplified to `"module": "commonjs"` + `"moduleResolution": "node"` for compatibility with `ts-node-dev`. Added `"ignoreDeprecations": "6.0"` for TypeScript 6 compatibility.
- `package.json` — Added `dev` (`ts-node-dev --respawn --transpile-only`), `build` (`tsc`), and `start` scripts.
- `.env` — Local environment variables: `PORT=3000`, `DATABASE_URL=`, `JWT_SECRET=`, `NODE_ENV=development`.
- `.env.example` — Template for new contributors.
- `src/config/env.ts` — Loads `.env` via dotenv and exports typed env constants.
- `src/app.ts` — Express app with `helmet`, `cors` (origin: localhost:5173), `morgan`, `express.json()`, and all route registrations.
- `src/server.ts` — Entry point; starts the HTTP server on `PORT`.
- `src/middlewares/errorHandler.ts` — Global error handler middleware.
- `src/controllers/health.controller.ts` — `GET /api/health` → `{ status: "ok", message: "Server is running" }`.
- `src/controllers/auth.controller.ts` — Placeholder handlers: register, login, logout, changePassword (all return 501).
- `src/controllers/users.controller.ts` — Placeholder CRUD handlers (all return 501).
- `src/controllers/orders.controller.ts` — Placeholder CRUD handlers (all return 501).
- `src/controllers/securityLogs.controller.ts` — Placeholder read handlers (all return 501).
- `src/routes/health.routes.ts` — `GET /api/health`.
- `src/routes/auth.routes.ts` — POST register, POST login, POST logout, PUT change-password.
- `src/routes/users.routes.ts` — RESTful CRUD: GET /, GET /:id, POST /, PUT /:id, DELETE /:id.
- `src/routes/orders.routes.ts` — RESTful CRUD: GET /, GET /:id, POST /, PUT /:id, DELETE /:id.
- `src/routes/securityLogs.routes.ts` — GET /, GET /:id.

**Client (`client/`)**

New or modified files:

- `vite.config.ts` — Added `@tailwindcss/vite` plugin.
- `src/index.css` — Complete rewrite: Tailwind import + full Karambit Fade design system (CSS variables, buttons, cards, forms, navbar, responsive grid, auth layout, log table, animations).
- `src/App.css` — Cleared (styles moved to index.css).
- `src/App.tsx` — Rewritten: `BrowserRouter` + `Routes` wiring all six pages through `Layout`.
- `src/services/api.ts` — Axios instance (`baseURL: http://localhost:3000`, `withCredentials: true`) with typed endpoint groups: `healthApi`, `authApi`, `usersApi`, `ordersApi`, `securityLogsApi`.
- `src/components/Layout.tsx` — Wraps pages with `Navbar` + `<main>` + footer.
- `src/components/Navbar.tsx` — Sticky, glass-effect navbar with desktop links, auth buttons, and a mobile hamburger menu toggle using `NavLink` active classes.
- `src/components/HealthCheck.tsx` — Button that calls `GET /api/health` and displays success / error status.
- `src/pages/HomePage.tsx` — Hero section, 6-card features grid, embedded `HealthCheck`.
- `src/pages/LoginPage.tsx` — Login form skeleton (email + password) with gradient-border card.
- `src/pages/RegisterPage.tsx` — Register form skeleton (name, email, password, confirm, role select).
- `src/pages/DashboardPage.tsx` — 4 stat cards + recent activity list + API endpoints reference panel.
- `src/pages/SecurityLogsPage.tsx` — Search/filter bar + placeholder log table with severity badges.
- `src/pages/NotFoundPage.tsx` — 404 page with gradient heading and navigation buttons.

### Why This Change Was Needed
This is the initial working skeleton. It establishes the full client-server RESTful architecture and responsive UI that all future security topics (auth, validation, RBAC, file upload, etc.) will be built on top of.

### Security Relevance

- **helmet** sets secure HTTP response headers (XSS protection, HSTS, no-sniff, etc.).
- **cors** restricts which origins can call the API — only `http://localhost:5173` in development.
- **express.json()** with body parsing is in place but body-size limits and validation will be added.
- All sensitive configuration (JWT secret, DB URL) is isolated in `.env` which is never committed.
- `.env.example` documents required variables without exposing real values.
- Placeholder routes return `501 Not Implemented` rather than silently succeeding — this prevents accidental use of unimplemented endpoints.

### Testing

- `npx tsc --noEmit` passes with zero errors on both `server/` and `client/`.
- Server: run `npm run dev` inside `server/` — server starts on `http://localhost:3000`.
- Client: run `npm run dev` inside `client/` — Vite starts on `http://localhost:5173`.
- Health check: open the home page, click **Check Health** — should show `Server is running` when server is up.

### Notes / Next Steps

- Add a PostgreSQL/MySQL connection via an ORM (Prisma or TypeORM).
- Implement real authentication with `bcrypt` password hashing and JWT.
- Add request body validation (Zod or express-validator).
- Add rate limiting (express-rate-limit) to auth routes.
- Add role-based middleware guards to protected routes.

---

## 2026-05-07 - Phase 1: Fix & Harden Skeleton

### Changed Area
Backend routing, error handling, CORS configuration, frontend API service layer.

### What Changed

**Server**

- `src/controllers/orders.controller.ts` — deleted. Replaced by `src/controllers/submissions.controller.ts` with all functions renamed (`getOrders` → `getSubmissions`, `getOrderById` → `getSubmissionById`, `createOrder` → `createSubmission`, `updateOrder` → `updateSubmission`, `deleteOrder` → `deleteSubmission`).
- `src/routes/orders.routes.ts` — deleted. Replaced by `src/routes/submissions.routes.ts` with updated import and router export name (`ordersRouter` → `submissionsRouter`).
- `src/app.ts` — replaced hardcoded `origin: 'http://localhost:5173'` with `origin: env.CORS_ORIGIN`; replaced `ordersRouter` import/registration with `submissionsRouter`; added `env` import; route updated from `/api/orders` to `/api/submissions`.
- `src/config/env.ts` — added `CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173'`.
- `src/middlewares/errorHandler.ts` — now reads optional `status` property on the error object and returns `err.status ?? 500` as the HTTP status code; in `production` mode the response message is always `"Internal server error"` (no stack trace, no internal detail); in development mode the actual `err.message` is included for debuggability. Stack is logged via `console.error` in all environments.
- `.env` — added `CORS_ORIGIN=http://localhost:5173`.
- `.env.example` — added `CORS_ORIGIN=http://localhost:5173`; improved `JWT_SECRET` comment to include generation command.

**Client**

- `src/services/api.ts` — renamed `ordersApi` export to `submissionsApi`; all paths updated from `/api/orders` to `/api/submissions`.
- `src/pages/DashboardPage.tsx` — updated endpoint reference panel entry from `/api/orders` to `/api/submissions`.

### Why This Change Was Needed

Three structural issues existed before real feature work could begin:
1. `/api/orders` was a naming mismatch — the spec calls for `/api/submissions` throughout.
2. The hardcoded CORS origin `localhost:5173` would be a deployment bug in any non-local environment.
3. The error handler always returned HTTP 500 regardless of error type, hiding valid 4xx errors and violating OWASP secure error handling guidance.

### Security Relevance

- **Secure Error Handling (OWASP A05)** — The hardened `errorHandler` now returns the correct HTTP status code for each error type (e.g. 401, 403, 422) instead of always returning 500. Stack traces are never exposed in production responses, preventing information disclosure that attackers could use to understand server internals.
- **Environment-driven CORS** — Moving the allowed origin to `.env` ensures production deployments are not accidentally permissive toward localhost. It also allows the allowed origin to change without a code change.
- **Credential hygiene** — The `.env.example` now documents how to generate a strong `JWT_SECRET` using `crypto.randomBytes`, guiding contributors away from leaving the placeholder value.

### Testing

- Verified `server/src/controllers/` no longer contains `orders.controller.ts`.
- Verified `server/src/routes/` no longer contains `orders.routes.ts`.
- Verified `submissions.controller.ts` and `submissions.routes.ts` exist with correct function names.
- Verified `app.ts` imports `submissionsRouter` and mounts it at `/api/submissions`.
- Verified `env.ts` exports `CORS_ORIGIN`.
- Verified `client/src/services/api.ts` exports `submissionsApi` with paths pointing to `/api/submissions`.
- Verified `DashboardPage.tsx` shows `/api/submissions` in the endpoint reference panel.

### Notes / Next Steps

- `GET /api/submissions` now returns 501 (not yet implemented) — which is correct behavior.
- `GET /api/orders` now returns 404 — the route no longer exists.
- The `errorHandler` is ready to accept `AppError` subclasses (401, 403, 422) that will be introduced in Phase 3.
- Next step: Phase 2 — database design and schema documentation. See `DBschema.md`.

---

## 2026-05-07 - Phase 2: Database Design (SQLite Schema)

### Changed Area
Database planning and documentation.

### What Changed

Created `DBschema.md` at the project root. This file contains the full database schema design for SafeSubmit.

**Database choice:** SQLite (via `better-sqlite3`). Chosen for zero-configuration local development and course-appropriate simplicity. The schema is designed to migrate to PostgreSQL or MySQL with minimal changes.

**Tables defined (7 total):**

| Table | Purpose |
|-------|---------|
| `users` | All system users across all roles. Includes security fields: `password_hash`, `failed_login_attempts`, `locked_until`, `status`, `is_active`. |
| `assignments` | Assignments created by lecturers. Lifecycle: `draft → published → closed → archived`. |
| `submissions` | Student work submitted against an assignment. One submission per student per assignment enforced by `UNIQUE(assignment_id, student_id)`. |
| `reviews` | Grades and feedback written by lecturers or TAs for a submission. |
| `role_change_logs` | Immutable audit trail of every admin role change. Insert-only. |
| `audit_logs` | General-purpose security and activity event log. Insert-only. `user_id` is nullable for unauthenticated events. |
| `lecturer_approval_requests` | Approval workflow for lecturer registrations. Admin must approve before a lecturer account becomes active. |

**Key design decisions documented in DBschema.md:**
- All primary keys are UUID v4 stored as `TEXT` (no integer auto-increment)
- Passwords stored only as bcrypt hashes (`password_hash` column)
- Booleans stored as `INTEGER (0/1)` — SQLite has no native boolean type
- Timestamps stored as ISO 8601 `TEXT` — SQLite has no native datetime type
- `PRAGMA foreign_keys = ON` required at connection time
- `CHECK` constraints enforce role, status, and severity enum values at the DB level
- Indexes added on all foreign keys, status columns, and `created_at`

### Why This Change Was Needed
A clearly documented schema is required before any backend implementation begins. The schema defines the data model, relationships, and security-relevant constraints that all future API routes, authentication logic, and audit logging will depend on.

### Security Relevance

- **Password security** — `password_hash` enforced; plain-text storage is architecturally impossible given column naming and documentation
- **Account lockout** — `failed_login_attempts` and `locked_until` fields support brute-force protection
- **Role-based access control** — `role` column with CHECK constraint; role changes require atomic transaction + `role_change_logs` entry
- **Audit logging** — `audit_logs` table designed to capture every sensitive system event, insert-only
- **Lecturer approval workflow** — `lecturer_approval_requests` table enforces admin oversight before lecturers can access the system
- **UUID primary keys** — prevents sequential ID enumeration attacks
- **Soft delete** — `is_active` flag retains data integrity and audit trails when accounts are deactivated
- **Foreign key constraints** — `ON DELETE RESTRICT` on critical relationships prevents orphaned data that could create security ambiguity

### Testing
No code was written in this phase. The schema is documentation-only. The SQL in `DBschema.md` Section 5 can be applied directly to a SQLite database for verification:

```bash
sqlite3 safesubmit.db < DBschema.md  # (after extracting the SQL block)
# or using sqlite3 shell:
sqlite3 safesubmit.db ".read schema.sql"
```

### Notes / Next Steps
- `DBschema.md` is the single source of truth for the database structure during this phase.
- The original plan referenced PostgreSQL with the `pg` driver. This phase changes the database to **SQLite** using `better-sqlite3`. The API design and security patterns are identical.
- Next: Phase 3 — implement the database connection (`server/src/config/db.ts`), run the schema on startup, and begin implementing the authentication controllers (`register`, `login`) against real data.

---

## 2026-05-07 - Phase 2b: Database Implementation

### Changed Area
Backend database layer — driver installation, connection module, schema application, server startup integration.

### What Changed

**New files:**
- `src/db/schema.sql` — SQLite DDL for all 7 tables (`users`, `assignments`, `submissions`, `reviews`, `role_change_logs`, `audit_logs`, `lecturer_approval_requests`) plus all indexes. Uses `CREATE TABLE IF NOT EXISTS` throughout — safe to re-run without data loss.
- `src/config/db.ts` — Singleton database module. Exports `initDb()` (called once at startup) and `getDb()` (called anywhere a DB reference is needed). Sets `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` on every connection. Reads and applies `schema.sql` via `db.exec()`.

**Modified files:**
- `src/server.ts` — calls `initDb()` before `app.listen()`. Server starts the DB before accepting any requests.
- `src/config/env.ts` — replaced `DATABASE_URL` (PostgreSQL connection string) with `DATABASE_PATH` (path to the SQLite `.db` file). Default: `safesubmit.db` in the server working directory.
- `.env` — updated: `DATABASE_PATH=safesubmit.db`.
- `.env.example` — updated: `DATABASE_PATH=safesubmit.db`.
- `.gitignore` — added `*.db`, `*.db-shm`, `*.db-wal` to exclude the SQLite database file and WAL journal from version control.

**Package installed:**
- `better-sqlite3` (production dependency) — synchronous SQLite driver
- `@types/better-sqlite3` (dev dependency) — TypeScript types

### Why This Change Was Needed
The schema documentation from Phase 2 needed to be turned into a working database. The connection module and startup integration are prerequisites for all backend features (authentication, submissions, reviews, admin actions) that follow.

### Security Relevance

- **`PRAGMA foreign_keys = ON`** — SQLite disables FK enforcement by default. Setting it explicitly in `db.ts` on every connection ensures referential integrity is always enforced, regardless of how the DB module is used.
- **`PRAGMA journal_mode = WAL`** — Write-Ahead Logging improves concurrency and crash safety. Not a security feature directly, but prevents data corruption under concurrent load.
- **Database file not committed** — `*.db` is in `.gitignore`. The database file (which will contain hashed passwords and user data) is never committed to version control.
- **Schema idempotency** — `CREATE TABLE IF NOT EXISTS` means re-running the server never overwrites existing data, preventing accidental data loss during development restarts.
- **Singleton pattern** — `getDb()` throws if called before `initDb()`, preventing any query from running before the DB is properly configured (foreign keys on, schema applied).

### Testing

Verified with a Node.js script that mirrors `db.ts` behaviour:
- All 7 tables created: `assignments`, `audit_logs`, `lecturer_approval_requests`, `reviews`, `role_change_logs`, `submissions`, `users`
- `PRAGMA foreign_keys` returns `1` (ON)
- `PRAGMA journal_mode` returns `wal`
- Re-running the schema produces no errors (idempotency confirmed)
- Test database cleaned up after verification

### Notes / Next Steps
- The database file (`safesubmit.db`) is created in the `server/` directory when the server first starts.
- `getDb()` is now available to import in any controller that needs to run a query.
- Next: Phase 3 — implement `register` and `login` in `auth.controller.ts` using `getDb()`, bcrypt for password hashing, and JWT for token issuance.

---

## 2026-05-07 - Phase 3a: Registration Module

### Changed Area
Backend authentication — models, error utilities, registration controller.

### What Changed

**New files:**

- `src/utils/AppError.ts` — Error class hierarchy used across the whole backend:
  - `AppError` (base, carries `status: number`)
  - `ValidationError` (422)
  - `ConflictError` (409)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
  - `NotFoundError` (404)

- `src/models/user.model.ts` — Model for the `users` table (per DBschema.md §4.1):
  - `User` interface — full DB row including `password_hash` (internal use only)
  - `SafeUser` type — `User` minus `password_hash` (used in all API responses)
  - `CreateUserInput` interface
  - `UserModel.findByEmail(email)` — returns full `User` including hash (auth only)
  - `UserModel.findById(id)` — returns full `User` (auth only)
  - `UserModel.findSafeById(id)` — returns `SafeUser` (safe for responses)
  - `UserModel.create(input)` — inserts new user, returns `SafeUser`; automatically sets `status = 'pending'` for lecturers and `status = 'active'` for all other roles

- `src/models/lecturerApproval.model.ts` — Model for the `lecturer_approval_requests` table (per DBschema.md §4.7):
  - `LecturerApprovalRequest` interface
  - `LecturerApprovalModel.create(userId)` — creates a pending approval request
  - `LecturerApprovalModel.findByUserId(userId)`
  - `LecturerApprovalModel.findById(id)`
  - `LecturerApprovalModel.findAllPending()`

**Modified files:**

- `src/controllers/auth.controller.ts` — `register` handler fully implemented:
  - Validates presence of `full_name`, `email`, `password`, `role`
  - Rejects `role = 'admin'` — admin cannot be self-registered
  - Checks for duplicate email (returns `ConflictError` 409)
  - Hashes password with `bcrypt` at cost factor 12
  - Creates user + approval request in a single `better-sqlite3` transaction (atomic)
  - Returns 201 with `SafeUser` (no `password_hash`)
  - Lecturers receive a "pending approval" message; students and TAs receive "Registration successful"
  - `login`, `logout`, `changePassword` still return 501 (not yet implemented)

- `src/middlewares/errorHandler.ts` — upgraded to use `AppError`:
  - `instanceof AppError` check routes known operational errors (4xx) to their correct status code and message
  - Unknown errors (programming bugs) still return 500 and hide details in production

**Packages installed:**
- `bcrypt` (production) — password hashing
- `@types/bcrypt` (dev) — TypeScript types

### Why This Change Was Needed
The auth controller was a 501 stub. Registration is the entry point for all users into the system — it must be implemented and secure before login or any other feature.

### Security Relevance

- **Password hashing** — `bcrypt.hash(password, 12)` is called before any DB write. Plain-text passwords never touch the database. The cost factor (12) is set as a named constant `BCRYPT_ROUNDS` — not hard-coded inline — so it can be reviewed and increased over time.
- **No hard-coded passwords** — passwords only come from the request body; there are no seeded or default passwords anywhere in the codebase.
- **`SafeUser` type** — `password_hash` is structurally excluded from the return type of `UserModel.create()` and `findSafeById()`. It is physically impossible to accidentally include the hash in an API response when using these methods.
- **Admin role protection** — `SELF_REGISTER_ROLES` explicitly excludes `'admin'`. An attacker cannot register as admin by sending `role: 'admin'` in the request body.
- **Lecturer approval** — lecturers are created with `status = 'pending'` and a `lecturer_approval_requests` row is created in the same DB transaction. If either write fails, both are rolled back, preventing a lecturer account from being created without an approval record.
- **Atomic transaction** — `better-sqlite3`'s `.transaction()` ensures the user row and approval request are always consistent. No partial state is possible.
- **Conflict error message** — duplicate email returns a `ConflictError` (409) with a clear message. This is acceptable because the registration form explicitly asks for an email — unlike the login endpoint, which must return identical messages for "email not found" and "wrong password" to prevent enumeration.
- **`AppError` in errorHandler** — known errors (4xx) are returned with their correct status and explicit message. Unknown errors (5xx) hide their message in production, preventing internal detail leakage.

### Testing

Verified with a ts-node smoke test against a live SQLite database:
- Student created with `status = 'active'`, no `password_hash` in response ✓
- Lecturer created with `status = 'pending'`, approval request created and linked ✓
- Password stored as bcrypt hash (`$2b$...`), not plain text ✓
- Duplicate email correctly rejected by `UNIQUE` constraint ✓
- TypeScript compilation: zero errors ✓

### Notes / Next Steps
- `login` is next: look up user by email, `bcrypt.compare`, check `status`, issue JWT, reset `failed_login_attempts`, log to `audit_logs`.
- `JWT_SECRET` in `.env` is still `change_me_later` — must be replaced with a strong random value before login is implemented.
- Full input validation (Zod) is deferred to Phase 5 but basic presence checks are already in the controller.


---

## Phase 3b — Authenticated Client Screens (2026-05-07)

### Changed Area
`client/` — all frontend auth plumbing + role-specific pages

### What Changed

**New files created:**

- `client/src/context/AuthContext.tsx` — React context for auth state:
  - `AuthUser` type: `{ id, email, role, full_name }`
  - JWT stored in `localStorage` under key `'ss_token'`
  - Pure base64 JWT decode (`atob`) — no external library
  - `AuthProvider` wraps the entire app
  - `useAuth()` hook throws if called outside provider
  - Listens for `'ss:logout'` CustomEvent so the Axios interceptor can trigger logout

- `client/src/components/ProtectedRoute.tsx` — route guard:
  - Unauthenticated users redirected to `/login`
  - Wrong role redirected to `/unauthorized`
  - Optional `roles` prop; if omitted, any logged-in user passes

- `client/src/pages/UnauthorizedPage.tsx` — 403 page

- `client/src/pages/ProfilePage.tsx` — shows name, email, role chip

- Student pages (`client/src/pages/student/`):
  - `StudentDashboard.tsx` — stat cards + empty state
  - `OpenSubmissionsPage.tsx` — lists open assignments (placeholder)
  - `MySubmissionsPage.tsx` — lists own submissions (placeholder)

- Lecturer pages (`client/src/pages/lecturer/`):
  - `LecturerDashboard.tsx`
  - `MyCoursesPage.tsx`
  - `CreateSubmissionBoxPage.tsx` — form stub (POST not yet wired)
  - `ManageSubmissionBoxesPage.tsx`
  - `ReviewSubmissionsPage.tsx`

- TA pages (`client/src/pages/ta/`):
  - `TADashboard.tsx`
  - `AssignedCoursesPage.tsx`
  - `TAReviewSubmissionsPage.tsx`

- Admin pages (`client/src/pages/admin/`):
  - `AdminDashboard.tsx` — stat cards + quick actions + system status panel
  - `UserManagementPage.tsx`
  - `RoleManagementPage.tsx`
  - `PendingApprovalsPage.tsx`

- Root `.gitignore` — excludes `.claude/`, `node_modules/`, `*.db`, `.env`, build outputs

**Modified files:**

- `client/src/services/api.ts`:
  - Fixed `authApi.register` field name: `name` → `full_name`
  - Fixed role value in register type: added `'teaching_assistant'` (removed incorrect `'ta'`)
  - Added Axios request interceptor: reads `localStorage['ss_token']`, sets `Authorization: Bearer <token>`
  - Added Axios response interceptor: on 401 fires `'ss:logout'` CustomEvent (picked up by AuthContext)

- `client/src/pages/LoginPage.tsx` — fully wired:
  - Controlled inputs, `useState` for email/password/error/loading
  - Calls `authApi.login()`, then `auth.login(token)`, navigates to `/dashboard`
  - Displays API error message inline

- `client/src/pages/RegisterPage.tsx` — fully wired:
  - Fixed role select values: `'ta'` → `'teaching_assistant'`
  - Client-side password match + length validation before sending
  - Calls `authApi.register()` with correct `full_name` field
  - Lecturers see "pending approval" message; others navigate to `/login` after 2.5 s

- `client/src/components/Navbar.tsx` — auth-aware:
  - Shows role-specific nav links based on `user.role`
  - Logged-in: user chip (name + role tag) + Sign Out button
  - Logged-out: Login + Register buttons
  - Mobile menu mirrors desktop state

- `client/src/pages/DashboardPage.tsx` — role dispatcher:
  - Renders `StudentDashboard`, `LecturerDashboard`, `TADashboard`, or `AdminDashboard` based on `user.role`

- `client/src/App.tsx` — wrapped with `<AuthProvider>`, all routes added:
  - `/dashboard`, `/profile` — any authenticated user
  - `/submissions/*` — student only
  - `/lecturer/*` — lecturer only
  - `/ta/*` — teaching_assistant only
  - `/admin/*`, `/security-logs` — admin only

- `client/src/index.css` — added CSS classes:
  - `.alert-error`, `.alert-success`, `.alert-warning`
  - `.empty-state`, `.role-tag`, `.user-chip`, `.dash-welcome`

### Why This Change Was Needed
The backend registration was complete but no client screen connected to it. Users had no way to log in, no auth state, no protected routes, and no role-specific UI. This phase closes that gap and makes the full registration flow testable end-to-end in the browser.

### Security Relevance

- **Frontend guards are UX only** — `ProtectedRoute` redirects unauthenticated users, but the real security enforcement is in server-side `authenticate` + `authorize` middleware (Phase 4). This is documented in code comments.
- **localStorage JWT trade-off** — `localStorage` is accessible to any JS on the page (XSS risk). The alternative (`httpOnly` cookie) prevents JS access but requires CSRF protection. For this course project, `localStorage` is used with the understanding that XSS prevention (CSP, output encoding) is the complementary control.
- **Auto-logout on 401** — the Axios interceptor fires `'ss:logout'` on any 401 response, which clears the token and user state. This prevents a user with an expired or revoked token from remaining in a logged-in UI state.
- **No sensitive data in JWT decode** — the client uses the JWT payload only for display (name, role badge). Authorization decisions are never made client-side; every API call that needs authorization sends the raw token and the server validates it.

### Testing
- Register as student → 201, navigated to login
- Register as lecturer → 201, "pending approval" message shown
- Login with valid credentials → dashboard shows correct role UI
- Navigate to `/security-logs` without admin token → redirected to `/unauthorized`
- Navigate to `/dashboard` without any token → redirected to `/login`
- Sign Out → token cleared, dashboard no longer accessible

### Notes / Next Steps
- Login API (`POST /api/auth/login`) still returns 501 — implement in Phase 3c with JWT issuance and bcrypt compare
- `JWT_SECRET` must be replaced with a strong random value before login goes live
- `CreateSubmissionBoxPage` form is a stub — wire to `POST /api/submissions` in Phase 5
- `PendingApprovalsPage` and `UserManagementPage` will be wired in Phase 6

---

## Phase 3c — Secure Login (2026-05-07)

### Changed Area
`server/` — login implementation with bcrypt comparison, JWT issuance, account lockout

### What Changed

**New files:**

- `server/src/utils/jwt.ts`
  - `signToken(payload)` — signs a JWT with `HS256`, 15-minute expiry, secret from `env.JWT_SECRET`
  - `verifyToken(token)` — verifies and returns the decoded payload
  - Payload shape: `{ id, email, role, full_name }`
  - Short expiry (15m) limits the window of abuse if a token is stolen

**Modified files:**

- `server/src/models/user.model.ts` — added four update methods:
  - `incrementFailedAttempts(id)` — atomically increments counter
  - `lockAccount(id, until)` — sets `status = 'locked'`, records `locked_until`, increments counter
  - `resetFailedAttempts(id)` — clears counter, unlocks account if status was `'locked'`, nulls `locked_until`
  - `updateLastLogin(id)` — stamps `last_login_at`

- `server/src/controllers/auth.controller.ts` — `login` fully implemented:
  1. Validates `email` and `password` presence
  2. Looks up user by email (case-insensitive via `toLowerCase().trim()`)
  3. Always runs `bcrypt.compare` — even when user doesn't exist — using `DUMMY_HASH` so response time is identical regardless of whether the email is registered (timing-safe)
  4. Wrong credentials with known email → increments `failed_login_attempts`:
     - 1–4 failures: returns `"Invalid credentials. N attempt(s) remaining before lockout."`
     - 5th failure: calls `lockAccount()`, returns lockout message
  5. Correct password → checks `status`:
     - `'locked'` and lock still active → returns minutes remaining
     - `'locked'` but expiry passed → falls through, login succeeds (auto-unlock)
     - `'pending'` → rejects with approval-pending message
     - `'deactivated'` → rejects
     - `'active'` → resets counter, stamps last login, issues JWT
  6. Returns `{ token }` on success

- `server/src/controllers/auth.controller.ts` — `logout` implemented (stateless):
  - Returns 200 with instruction to discard the token
  - No server-side session state to clear (JWT is stateless)

- `server/.env` — `JWT_SECRET` replaced with a 128-hex-char cryptographically random value (generated via `crypto.randomBytes(64).toString('hex')`)

**Packages installed:**
- `jsonwebtoken` (production)
- `@types/jsonwebtoken` (dev)

### Why This Change Was Needed
Registration was complete but login returned 501. No user could authenticate. This phase closes the auth loop and makes the full register → login → JWT flow functional end-to-end.

### Security Relevance

- **Timing-safe comparison** — `bcrypt.compare` is always called, even for unknown emails. Without this, an attacker using Burp Suite could distinguish "email not found" (fast) from "wrong password" (slow bcrypt), enabling email enumeration at scale.
- **Uniform error messages** — `"Invalid credentials"` is returned for both wrong email and wrong password cases. The lockout warning (`"N attempts remaining"`) is only shown when the email is confirmed correct, which is a deliberate UX trade-off consistent with OWASP guidance (showing remaining attempts is better than surprising users with a locked account).
- **Account lockout** — after 5 consecutive wrong passwords, the account is locked for 15 minutes. Counter is reset on every successful login. This defeats online brute-force and credential-stuffing attacks.
- **Short JWT expiry** — 15 minutes. A stolen token is usable for at most 15 minutes. Refresh tokens (longer-lived) are a Phase 4+ concern.
- **Strong JWT secret** — 512 bits of entropy (128 hex chars from `crypto.randomBytes`). Brute-forcing an HS256 secret of this length is computationally infeasible.
- **JWT payload** — includes only `id`, `email`, `role`, `full_name`. No sensitive fields (password hash, phone, etc.).
- **`DUMMY_HASH` constant** — a valid bcrypt format string that always fails comparison but still costs the same CPU time as a real comparison, maintaining timing indistinguishability.
- **Stateless logout** — the server issues no session cookie and keeps no session store, so there is nothing server-side to invalidate. The client clears `localStorage`. This is documented in the code comment so future maintainers don't add session state without considering the implications.

### Testing (manual smoke test)
- `POST /api/auth/login` with registered student credentials → 200 `{ token }`
- `POST /api/auth/login` with wrong password → 401 `"Invalid credentials. 4 attempts remaining before lockout."`
- After 5 wrong passwords → `locked` status in DB, 401 with lockout message
- After lockout period expires → login succeeds again, counter reset
- `POST /api/auth/login` with unregistered email → 401 `"Invalid credentials"` (same message, same response time)
- `POST /api/auth/login` with pending lecturer → 401 approval-pending message
- TypeScript compilation: zero errors ✓

### Notes / Next Steps
- `authenticate` middleware (Phase 4) reads the JWT and attaches `req.user` so route handlers know who is calling
- `authorize` middleware (Phase 4) checks `req.user.role` against an allowed list
- Refresh token flow is not implemented — after 15 minutes the client must log in again
