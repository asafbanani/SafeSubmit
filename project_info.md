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
