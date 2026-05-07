import Database, { type Database as DB } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from './env';

let db: DB | null = null;

export function getDb(): DB {
  if (!db) {
    throw new Error('[db] Database not initialized. Call initDb() before starting the server.');
  }
  return db;
}

export function initDb(): void {
  const dbPath = env.DATABASE_PATH;

  db = new Database(dbPath);

  // WAL mode gives better read concurrency for a web server workload.
  db.pragma('journal_mode = WAL');

  // Foreign key enforcement is OFF by default in SQLite.
  // This MUST be set for every connection — it is not a persistent schema setting.
  db.pragma('foreign_keys = ON');

  // Apply schema (all statements use CREATE TABLE/INDEX IF NOT EXISTS — safe to re-run).
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log(`[db] SQLite connected: ${dbPath}`);
  console.log('[db] Foreign keys enforced, WAL mode active');
}
