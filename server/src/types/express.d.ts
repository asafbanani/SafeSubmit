import type { UserRole } from '../models/user.model';

// Augment Express's Request interface so every handler has access to
// the authenticated user that was decoded from the JWT by authenticate.ts.
// Using module augmentation keeps this typed without importing anything at runtime.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        full_name: string;
      };
    }
  }
}

export {};
