import { Pool } from "pg";

const globalForPg = globalThis as unknown as { _pgPool?: Pool; _pgReady?: Promise<void> };

export const pool =
  globalForPg._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (!globalForPg._pgPool) globalForPg._pgPool = pool;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS friends (
  id          SERIAL PRIMARY KEY,
  game_name   TEXT NOT NULL,
  tag_line    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_name, tag_line)
);
`;

/** Ensures the friends table exists. Safe to call on every request. */
export async function ensureSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!globalForPg._pgReady) {
    globalForPg._pgReady = pool.query(SCHEMA).then(() => undefined);
  }
  await globalForPg._pgReady;
}
