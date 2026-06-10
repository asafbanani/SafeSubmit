import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT:         process.env['PORT']          ?? '3000',
  NODE_ENV:     process.env['NODE_ENV']      ?? 'development',
  DATABASE_PATH: process.env['DATABASE_PATH'] ?? 'safesubmit.db',
  JWT_SECRET:   process.env['JWT_SECRET']    ?? 'change_me_later',
  CORS_ORIGIN:  process.env['CORS_ORIGIN']   ?? 'http://localhost:5173',
  UPLOADS_PATH: process.env['UPLOADS_PATH']  ?? './uploads',

  // ── SSRF defense settings ──────────────────────────────────────────────────
  // Comma-separated hostnames that the server may fetch from.
  // No https://, no trailing slash, no wildcards. Keep the list small.
  SSRF_TRUSTED_DOMAINS: process.env['SSRF_TRUSTED_DOMAINS'] ?? 'upload.wikimedia.org,images.unsplash.com',
  // Maximum number of bytes accepted from an external response.
  SSRF_MAX_RESPONSE_BYTES: parseInt(process.env['SSRF_MAX_RESPONSE_BYTES'] ?? '2097152', 10),
  // Connection + response timeout in milliseconds.
  SSRF_TIMEOUT_MS: parseInt(process.env['SSRF_TIMEOUT_MS'] ?? '5000', 10),
};
