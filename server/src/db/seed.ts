/**
 * ⚠️  DEVELOPMENT / DEMO SEED — never run this in production.
 *
 * Creates the admin account, demo users, assignments, submissions,
 * reviews, and audit log entries for local testing.
 *
 * Safe to run multiple times — existing rows are skipped by email / title.
 *
 * Usage:
 *   npm run seed
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { initDb, getDb } from '../config/db';
import type { Database } from 'better-sqlite3';

const BCRYPT_ROUNDS = 12;

// ── User seed data ─────────────────────────────────────────────────────────────

interface SeedUser {
  full_name: string;
  email: string;
  password: string;
  role: 'student' | 'lecturer' | 'teaching_assistant' | 'admin';
}

const SEED_USERS: SeedUser[] = [
  { full_name: 'Admin',   email: 'admin@safesubmit.local', password: 'Admin@123',   role: 'admin'              },
  { full_name: 'Alice',   email: 'alice@demo.com',          password: 'Alice@123',   role: 'student'            },
  { full_name: 'Bob',     email: 'bob@demo.com',             password: 'Bob@123',     role: 'student'            },
  { full_name: 'Charlie', email: 'charlie@demo.com',         password: 'Charlie@123', role: 'student'            },
  { full_name: 'Diana',   email: 'diana@demo.com',           password: 'Diana@123',   role: 'lecturer'           },
  { full_name: 'Eve',     email: 'eve@demo.com',             password: 'Eve@123',     role: 'teaching_assistant' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function userId(db: Database, email: string): string {
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (!row) throw new Error(`User not found: ${email}`);
  return row.id;
}

function isoAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isoIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// ── Step 1 — Users ─────────────────────────────────────────────────────────────

async function seedUsers(db: Database): Promise<void> {
  console.log('\n👤  Users\n');
  for (const user of SEED_USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) {
      console.log(`  ⏭  skip     ${user.email.padEnd(32)} (already exists)`);
      continue;
    }
    const password_hash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(randomUUID(), user.full_name, user.email, password_hash, user.role);
    console.log(`  ✅  created  ${user.email.padEnd(32)} [${user.role}]  pw: ${user.password}`);
  }
}

// ── Step 2 — Assignments ───────────────────────────────────────────────────────

function seedAssignments(db: Database): void {
  console.log('\n📋  Assignments\n');

  const dianaId = userId(db, 'diana@demo.com');

  const assignments = [
    {
      title:       'Assignment 1 — Secure Authentication',
      description: 'Implement a login system with password hashing (bcrypt, cost ≥ 12), account lockout after 5 failed attempts, and uniform error messages to prevent username enumeration. Deliverable: source code + 1-page security report.',
      due_date:    isoAgo(60),
      status:      'closed',
      max_score:   100,
    },
    {
      title:       'Assignment 2 — SQL Injection Prevention',
      description: 'Identify and fix all SQL injection vulnerabilities in the provided vulnerable Node.js application. Use parameterised queries / prepared statements only — no string concatenation. Deliverable: patched source + diff explaining each fix.',
      due_date:    isoAgo(30),
      status:      'closed',
      max_score:   100,
    },
    {
      title:       'Assignment 3 — XSS & CSRF Defense',
      description: 'Add XSS output encoding and CSRF token protection to the sample Express application. Demonstrate the attack before the fix and the defence after. Deliverable: video walkthrough + patched code.',
      due_date:    isoIn(20),
      status:      'published',
      max_score:   100,
    },
    {
      title:       'Assignment 4 — Threat Modelling with STRIDE',
      description: 'Produce a STRIDE threat model for the SafeSubmit application. Include a data-flow diagram, threat enumeration table, and mitigation plan for each identified threat.',
      due_date:    isoIn(45),
      status:      'draft',
      max_score:   100,
    },
  ];

  for (const a of assignments) {
    const existing = db.prepare('SELECT id FROM assignments WHERE title = ?').get(a.title);
    if (existing) {
      console.log(`  ⏭  skip     "${a.title.substring(0, 45)}…"`);
      continue;
    }
    db.prepare(`
      INSERT INTO assignments (id, lecturer_id, title, description, due_date, status, max_score, allow_late_submission)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(randomUUID(), dianaId, a.title, a.description, a.due_date, a.status, a.max_score);
    console.log(`  ✅  created  "${a.title.substring(0, 50)}"  [${a.status}]`);
  }
}

// ── Step 3 — Submissions ───────────────────────────────────────────────────────

function assignmentId(db: Database, title: string): string {
  const row = db.prepare('SELECT id FROM assignments WHERE title = ?').get(title) as { id: string } | undefined;
  if (!row) throw new Error(`Assignment not found: ${title}`);
  return row.id;
}

function seedSubmissions(db: Database): void {
  console.log('\n📤  Submissions\n');

  const aliceId   = userId(db, 'alice@demo.com');
  const bobId     = userId(db, 'bob@demo.com');
  const charlieId = userId(db, 'charlie@demo.com');

  const a1Id = assignmentId(db, 'Assignment 1 — Secure Authentication');
  const a2Id = assignmentId(db, 'Assignment 2 — SQL Injection Prevention');
  const a3Id = assignmentId(db, 'Assignment 3 — XSS & CSRF Defense');

  const submissions = [
    // ── Assignment 1 (closed) ──────────────────────────────────────────────
    {
      assignment_id:   a1Id,
      student_id:      aliceId,
      submission_text: 'Implemented bcrypt hashing at cost 12 for password storage. Added account lockout (5 attempts, 15-minute window) using a failed_login_attempts counter in the database. Ensured identical 401 error messages for wrong email and wrong password to prevent user enumeration. See attached code.',
      status:          'graded',
      submitted_at:    isoAgo(62),
    },
    {
      assignment_id:   a1Id,
      student_id:      bobId,
      submission_text: 'Used bcrypt with salt rounds 10. Implemented lockout after 5 failed attempts. Could not fully prevent timing-based enumeration — see security report for details and proposed fix.',
      status:          'graded',
      submitted_at:    isoAgo(61),
    },
    {
      assignment_id:   a1Id,
      student_id:      charlieId,
      submission_text: 'Full implementation using bcrypt cost 12. Added a dummy hash comparison for non-existent users to eliminate timing side-channels. Lockout is per-account (not per-IP) with a 15-minute expiry stored in the DB.',
      status:          'graded',
      submitted_at:    isoAgo(63),
    },

    // ── Assignment 2 (closed) ──────────────────────────────────────────────
    {
      assignment_id:   a2Id,
      student_id:      aliceId,
      submission_text: 'Replaced all string-concatenated queries with prepared statements using the ? placeholder. Added input-length validation before queries reach the DB layer. Tested with SQLMap — no injections found after patching.',
      status:          'graded',
      submitted_at:    isoAgo(32),
    },
    {
      assignment_id:   a2Id,
      student_id:      bobId,
      submission_text: 'Fixed most injection points but missed the search endpoint. Reviewer flagged this — resubmitting after fixing the LIKE clause vulnerability.',
      status:          'returned',
      submitted_at:    isoAgo(31),
    },
    {
      assignment_id:   a2Id,
      student_id:      charlieId,
      submission_text: 'All 7 injection points identified and fixed with parameterised queries. Added a DB-layer wrapper that rejects any query string containing raw user input. Full SQLMap report included.',
      status:          'graded',
      submitted_at:    isoAgo(33),
    },

    // ── Assignment 3 (open/published) ─────────────────────────────────────
    {
      assignment_id:   a3Id,
      student_id:      aliceId,
      submission_text: 'Work in progress — XSS defense using DOMPurify on all user-generated output. CSRF tokens not yet added.',
      status:          'under_review',
      submitted_at:    isoAgo(2),
    },
    {
      assignment_id:   a3Id,
      student_id:      bobId,
      submission_text: 'Submitted early draft. Added Content-Security-Policy header and CSRF double-submit cookie pattern. Awaiting TA feedback before final submission.',
      status:          'under_review',
      submitted_at:    isoAgo(3),
    },
    // Charlie has not submitted Assignment 3 yet (intentionally left out)
  ];

  for (const s of submissions) {
    const existing = db.prepare(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?'
    ).get(s.assignment_id, s.student_id);

    if (existing) {
      console.log(`  ⏭  skip     (already exists)`);
      continue;
    }

    db.prepare(`
      INSERT INTO submissions (id, assignment_id, student_id, submission_text, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), s.assignment_id, s.student_id, s.submission_text, s.status, s.submitted_at);
    console.log(`  ✅  created  student=${s.student_id.substring(0, 8)}… assignment=${s.assignment_id.substring(0, 8)}…  [${s.status}]`);
  }
}

// ── Step 4 — Reviews ──────────────────────────────────────────────────────────

function submissionId(db: Database, assignmentTitle: string, studentEmail: string): string {
  const aId = assignmentId(db, assignmentTitle);
  const sId = userId(db, studentEmail);
  const row = db.prepare(
    'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?'
  ).get(aId, sId) as { id: string } | undefined;
  if (!row) throw new Error(`Submission not found: ${assignmentTitle} / ${studentEmail}`);
  return row.id;
}

function seedReviews(db: Database): void {
  console.log('\n⭐  Reviews\n');

  const dianaId = userId(db, 'diana@demo.com');
  const eveId   = userId(db, 'eve@demo.com');

  const reviews = [
    // ── Assignment 1 reviews (all graded) ─────────────────────────────────
    {
      submission_id: submissionId(db, 'Assignment 1 — Secure Authentication', 'alice@demo.com'),
      reviewer_id:   eveId,
      grade:         88,
      feedback:      'Excellent implementation. bcrypt cost 12 is correct, lockout logic is sound, and the dummy hash for timing safety is a nice touch. Minor: the lockout expiry could be surfaced more clearly in the UI error message. Overall very strong work.',
      is_final:      1,
    },
    {
      submission_id: submissionId(db, 'Assignment 1 — Secure Authentication', 'bob@demo.com'),
      reviewer_id:   eveId,
      grade:         74,
      feedback:      'Good effort. bcrypt is used correctly at cost 10 (acceptable but 12 is preferred). The timing side-channel issue you identified in the report is real — the fix would be to always run bcrypt.compare even when the user is not found. Lockout works correctly. Deducted marks for the unresolved timing vulnerability.',
      is_final:      1,
    },
    {
      submission_id: submissionId(db, 'Assignment 1 — Secure Authentication', 'charlie@demo.com'),
      reviewer_id:   dianaId,
      grade:         96,
      feedback:      'Outstanding. The dummy hash approach for timing safety is exactly right and well explained. Cost 12, per-account lockout, clear error messages — all implemented correctly. The only thing missing is a brief threat model explaining WHY each decision was made. Full marks otherwise.',
      is_final:      1,
    },

    // ── Assignment 2 reviews ───────────────────────────────────────────────
    {
      submission_id: submissionId(db, 'Assignment 2 — SQL Injection Prevention', 'alice@demo.com'),
      reviewer_id:   eveId,
      grade:         91,
      feedback:      'All identified injection points fixed correctly. Prepared statements used throughout. SQLMap report is convincing. Small deduction: the search LIKE clause could still be abused via wildcard flooding — consider input length limits there.',
      is_final:      1,
    },
    {
      submission_id: submissionId(db, 'Assignment 2 — SQL Injection Prevention', 'bob@demo.com'),
      reviewer_id:   eveId,
      grade:         null,  // not graded yet — returned for revision
      feedback:      'The main login and user-lookup queries are fixed. However, the search endpoint at GET /api/users?q= is still vulnerable to injection via the LIKE clause. Please fix and resubmit. See the annotated diff I attached.',
      is_final:      0,
    },
    {
      submission_id: submissionId(db, 'Assignment 2 — SQL Injection Prevention', 'charlie@demo.com'),
      reviewer_id:   dianaId,
      grade:         98,
      feedback:      'All 7 injection points found and fixed. The DB wrapper approach is clever and goes beyond the brief. SQLMap output confirms zero vulnerabilities. Best submission in the cohort.',
      is_final:      1,
    },

    // ── Assignment 3 reviews (under review — initial TA notes, not final) ─
    {
      submission_id: submissionId(db, 'Assignment 3 — XSS & CSRF Defense', 'alice@demo.com'),
      reviewer_id:   eveId,
      grade:         null,
      feedback:      'DOMPurify usage looks correct. CSRF tokens are missing — this is a core requirement of the assignment. Please add the double-submit cookie pattern or synchronizer token before final submission.',
      is_final:      0,
    },
    {
      submission_id: submissionId(db, 'Assignment 3 — XSS & CSRF Defense', 'bob@demo.com'),
      reviewer_id:   eveId,
      grade:         null,
      feedback:      'CSP header is well configured. The double-submit CSRF cookie implementation looks correct in principle. Need to verify the token validation happens on ALL state-changing routes, not just /login. Please address and resubmit.',
      is_final:      0,
    },
  ];

  for (const r of reviews) {
    const existing = db.prepare(
      'SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?'
    ).get(r.submission_id, r.reviewer_id);

    if (existing) {
      console.log(`  ⏭  skip     (already exists)`);
      continue;
    }

    db.prepare(`
      INSERT INTO reviews (id, submission_id, reviewer_id, grade, feedback, is_final)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), r.submission_id, r.reviewer_id, r.grade, r.feedback, r.is_final);

    const gradeStr = r.grade !== null ? `grade=${r.grade}` : 'ungraded';
    console.log(`  ✅  created  reviewer=${r.reviewer_id.substring(0, 8)}…  [${gradeStr}  final=${r.is_final}]`);
  }
}

// ── Step 5 — Audit logs ───────────────────────────────────────────────────────

function seedAuditLogs(db: Database): void {
  console.log('\n🔒  Audit logs\n');

  const aliceId   = userId(db, 'alice@demo.com');
  const bobId     = userId(db, 'bob@demo.com');
  const charlieId = userId(db, 'charlie@demo.com');
  const dianaId   = userId(db, 'diana@demo.com');
  const eveId     = userId(db, 'eve@demo.com');
  const adminId   = userId(db, 'admin@safesubmit.local');

  const existing = db.prepare('SELECT COUNT(*) as n FROM audit_logs').get() as { n: number };
  if (existing.n > 0) {
    console.log(`  ⏭  skip     audit_logs (${existing.n} rows already exist)`);
    return;
  }

  const logs = [
    // Successful logins
    { user_id: adminId,   action: 'login',            resource_type: 'session', resource_id: null, ip: '192.168.1.1',  status: 'success', severity: 'info',    desc: 'Admin logged in successfully',             created_at: isoAgo(10) },
    { user_id: dianaId,   action: 'login',            resource_type: 'session', resource_id: null, ip: '192.168.1.20', status: 'success', severity: 'info',    desc: 'Lecturer Diana logged in',                 created_at: isoAgo(9)  },
    { user_id: eveId,     action: 'login',            resource_type: 'session', resource_id: null, ip: '192.168.1.30', status: 'success', severity: 'info',    desc: 'TA Eve logged in',                         created_at: isoAgo(8)  },
    { user_id: aliceId,   action: 'login',            resource_type: 'session', resource_id: null, ip: '10.0.0.5',     status: 'success', severity: 'info',    desc: 'Student Alice logged in',                  created_at: isoAgo(7)  },
    { user_id: bobId,     action: 'login',            resource_type: 'session', resource_id: null, ip: '10.0.0.6',     status: 'success', severity: 'info',    desc: 'Student Bob logged in',                    created_at: isoAgo(6)  },
    { user_id: charlieId, action: 'login',            resource_type: 'session', resource_id: null, ip: '10.0.0.7',     status: 'success', severity: 'info',    desc: 'Student Charlie logged in',                created_at: isoAgo(5)  },

    // Failed login attempts (Bob had 3 wrong password attempts)
    { user_id: bobId,     action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '10.0.0.6',     status: 'failure', severity: 'warning', desc: 'Failed login attempt — wrong password (1)', created_at: isoAgo(6, 1) },
    { user_id: bobId,     action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '10.0.0.6',     status: 'failure', severity: 'warning', desc: 'Failed login attempt — wrong password (2)', created_at: isoAgo(6, 1) },
    { user_id: bobId,     action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '10.0.0.6',     status: 'failure', severity: 'warning', desc: 'Failed login attempt — wrong password (3)', created_at: isoAgo(6, 1) },

    // Unknown email probe (possible enumeration attempt)
    { user_id: null,      action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '185.220.101.5', status: 'failure', severity: 'warning', desc: 'Login attempt with unknown email: hacker@evil.com', created_at: isoAgo(4) },
    { user_id: null,      action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '185.220.101.5', status: 'failure', severity: 'warning', desc: 'Login attempt with unknown email: admin@admin.com',  created_at: isoAgo(4) },
    { user_id: null,      action: 'login_failed',     resource_type: 'session', resource_id: null, ip: '185.220.101.5', status: 'failure', severity: 'error',   desc: 'Repeated unknown-email probes from same IP — possible enumeration attack', created_at: isoAgo(4) },

    // Submission events
    { user_id: aliceId,   action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.5', status: 'success', severity: 'info', desc: 'Alice submitted Assignment 1',  created_at: isoAgo(62) },
    { user_id: bobId,     action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.6', status: 'success', severity: 'info', desc: 'Bob submitted Assignment 1',    created_at: isoAgo(61) },
    { user_id: charlieId, action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.7', status: 'success', severity: 'info', desc: 'Charlie submitted Assignment 1', created_at: isoAgo(63) },
    { user_id: aliceId,   action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.5', status: 'success', severity: 'info', desc: 'Alice submitted Assignment 2',  created_at: isoAgo(32) },
    { user_id: bobId,     action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.6', status: 'success', severity: 'info', desc: 'Bob submitted Assignment 2',    created_at: isoAgo(31) },
    { user_id: charlieId, action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.7', status: 'success', severity: 'info', desc: 'Charlie submitted Assignment 2', created_at: isoAgo(33) },
    { user_id: aliceId,   action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.5', status: 'success', severity: 'info', desc: 'Alice submitted Assignment 3 (draft)', created_at: isoAgo(2) },
    { user_id: bobId,     action: 'submission_create', resource_type: 'submission', resource_id: null, ip: '10.0.0.6', status: 'success', severity: 'info', desc: 'Bob submitted Assignment 3 (early draft)', created_at: isoAgo(3) },

    // Admin actions
    { user_id: adminId, action: 'user_approved',  resource_type: 'user', resource_id: dianaId, ip: '192.168.1.1', status: 'success', severity: 'info', desc: 'Admin approved lecturer account for Diana', created_at: isoAgo(15) },
    { user_id: adminId, action: 'user_view_logs', resource_type: 'audit_log', resource_id: null, ip: '192.168.1.1', status: 'success', severity: 'info', desc: 'Admin viewed security audit logs',          created_at: isoAgo(1)  },
  ];

  const insert = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, status, severity, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const log of logs) {
    insert.run(
      randomUUID(), log.user_id, log.action, log.resource_type,
      log.resource_id, log.ip, log.status, log.severity, log.desc, log.created_at,
    );
  }

  console.log(`  ✅  inserted ${logs.length} audit log entries`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  initDb();
  const db = getDb();

  console.log('\n🌱  SafeSubmit demo seed starting…');

  await seedUsers(db);
  seedAssignments(db);
  seedSubmissions(db);
  seedReviews(db);
  seedAuditLogs(db);

  console.log('\n✔  Seed complete.\n');
}

seed().catch((err: unknown) => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
