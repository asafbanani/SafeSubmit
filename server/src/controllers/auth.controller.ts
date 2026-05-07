import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import UserModel, { type UserRole } from '../models/user.model';
import LecturerApprovalModel from '../models/lecturerApproval.model';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { getDb } from '../config/db';

// Cost factor for bcrypt — 12 is the current recommended minimum.
// Increase this value as hardware improves; never decrease it.
const BCRYPT_ROUNDS = 12;

// Roles a user can self-register as.
// 'admin' is intentionally excluded — it can only be granted by an existing admin.
const SELF_REGISTER_ROLES: UserRole[] = ['student', 'lecturer', 'teaching_assistant'];

// Lock the account after this many consecutive failed attempts.
const MAX_FAILED_ATTEMPTS = 5;

// How long an account stays locked after being triggered (minutes).
const LOCKOUT_MINUTES = 15;

// A pre-computed dummy hash used when the email is not found.
// Running bcrypt.compare against it takes the same time as a real compare,
// preventing attackers from detecting non-existent emails via response timing.
const DUMMY_HASH = '$2b$12$invalidhashusedfortimingattackpreventiononly000000000000';

// ── Register ─────────────────────────────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { full_name, email, password, role } = req.body as {
      full_name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // ── Presence validation (full Zod schema validation comes in Phase 5) ──

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      next(new ValidationError('full_name is required'));
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      next(new ValidationError('A valid email is required'));
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      next(new ValidationError('Password must be at least 8 characters'));
      return;
    }

    if (!role || !SELF_REGISTER_ROLES.includes(role as UserRole)) {
      next(new ValidationError(`role must be one of: ${SELF_REGISTER_ROLES.join(', ')}`));
      return;
    }

    // ── Duplicate email check ─────────────────────────────────────────────

    const existing = UserModel.findByEmail(email.toLowerCase().trim());
    if (existing) {
      // Same message whether the email exists or not — prevents user enumeration
      next(new ConflictError('An account with this email already exists'));
      return;
    }

    // ── Hash the password — plain text is never stored ────────────────────

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // ── Create user + approval request in a single transaction ───────────
    // better-sqlite3 transactions are synchronous and atomic.
    // If either INSERT fails, both are rolled back.

    const db = getDb();

    const createUserAndApproval = db.transaction(() => {
      const user = UserModel.create({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: role as UserRole,
      });

      if (role === 'lecturer') {
        LecturerApprovalModel.create(user.id);
      }

      return user;
    });

    const user = createUserAndApproval();

    // ── Response ──────────────────────────────────────────────────────────

    const message =
      role === 'lecturer'
        ? 'Registration successful. Your account is pending admin approval before you can log in.'
        : 'Registration successful.';

    res.status(201).json({ message, user });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      next(new ValidationError('Email and password are required'));
      return;
    }

    const user = UserModel.findByEmail(email.toLowerCase().trim());

    // Always run bcrypt.compare — even when the user doesn't exist — so that
    // the response time is identical regardless of whether the email is registered.
    // This defeats timing-based email enumeration.
    const hashToCompare = user?.password_hash ?? DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    // ── Wrong credentials ─────────────────────────────────────────────────
    if (!user || !passwordMatch) {
      if (user) {
        // Email is correct but password is wrong — track the failed attempt.
        const newCount = user.failed_login_attempts + 1;

        if (newCount >= MAX_FAILED_ATTEMPTS) {
          // Threshold reached — lock the account.
          const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
          UserModel.lockAccount(user.id, lockedUntil);
          next(new UnauthorizedError(
            `Too many failed attempts. Your account is locked for ${LOCKOUT_MINUTES} minutes.`,
          ));
          return;
        }

        UserModel.incrementFailedAttempts(user.id);
        const remaining = MAX_FAILED_ATTEMPTS - newCount;
        next(new UnauthorizedError(
          `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
        ));
        return;
      }

      // Email not found — same phrasing as wrong-password to prevent enumeration.
      next(new UnauthorizedError('Invalid credentials'));
      return;
    }

    // ── Correct password — check account status ───────────────────────────

    if (user.status === 'locked') {
      const lockedUntil = user.locked_until ? new Date(user.locked_until) : null;
      if (lockedUntil && lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000);
        next(new UnauthorizedError(
          `Account is locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
        ));
        return;
      }
      // Lock has expired — fall through and allow login, resetFailedAttempts will clear status.
    }

    if (user.status === 'pending') {
      next(new UnauthorizedError('Your account is pending admin approval. Please wait for confirmation.'));
      return;
    }

    if (user.status === 'deactivated') {
      next(new UnauthorizedError('This account has been deactivated. Contact an administrator.'));
      return;
    }

    // ── Issue token ───────────────────────────────────────────────────────

    UserModel.resetFailedAttempts(user.id);
    UserModel.updateLastLogin(user.id);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
// JWT authentication is stateless — the server holds no session to destroy.
// The client is responsible for discarding the token (clear localStorage).

export function logout(_req: Request, res: Response): void {
  res.status(200).json({ message: 'Logged out successfully. Please discard your token.' });
}

// ── Change Password ───────────────────────────────────────────────────────────

export function changePassword(_req: Request, res: Response): void {
  res.status(501).json({ message: 'Change password — not yet implemented' });
}
