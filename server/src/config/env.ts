import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env['PORT'] ?? '3000',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  DATABASE_PATH: process.env['DATABASE_PATH'] ?? 'safesubmit.db',
  JWT_SECRET: process.env['JWT_SECRET'] ?? 'change_me_later',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
};
