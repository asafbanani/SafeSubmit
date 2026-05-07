import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Access tokens expire in 15 minutes. Short expiry limits the damage window
// if a token is stolen — the attacker loses access without needing a server-side revocation.
const ACCESS_TOKEN_EXPIRY = '15m';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
