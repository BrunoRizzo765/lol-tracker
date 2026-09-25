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

ALTER TABLE friends ADD COLUMN IF NOT EXISTS puuid TEXT;
ALTER TABLE friends ADD COLUMN IF NOT EXISTS synced_newest BIGINT;
ALTER TABLE friends ADD COLUMN IF NOT EXISTS synced_oldest BIGINT;
ALTER TABLE friends ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS matches (
  friend_id     INTEGER NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  match_id      TEXT NOT NULL,
  game_creation BIGINT NOT NULL,
  game_duration INTEGER NOT NULL DEFAULT 0,
  queue_id      INTEGER NOT NULL DEFAULT 0,
  game_mode     TEXT NOT NULL DEFAULT '',
  champion      TEXT NOT NULL DEFAULT '',
  kills         INTEGER NOT NULL DEFAULT 0,
  deaths        INTEGER NOT NULL DEFAULT 0,
  assists       INTEGER NOT NULL DEFAULT 0,
  win           BOOLEAN NOT NULL DEFAULT FALSE,
  cs            INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 0,
  gold          INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (friend_id, match_id)
);

CREATE INDEX IF NOT EXISTS matches_creation_idx ON matches (game_creation DESC);
CREATE INDEX IF NOT EXISTS matches_friend_creation_idx ON matches (friend_id, game_creation DESC);
`;

/** Ensures tables/columns exist. Safe to call on every request. */
export async function ensureSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!globalForPg._pgReady) {
    globalForPg._pgReady = pool.query(SCHEMA).then(() => undefined);
  }
  await globalForPg._pgReady;
}
