import { ensureSchema, pool } from "/lib/db";
import { parseFriends } from "/lib/riot";

export type StoredFriend = {
  id: number;
  gameName: string;
  tagLine: string;
  puuid: string | null;
  platform: string | null;
  syncedNewest: number | null;
  syncedOldest: number | null;
  lastSyncAt: string | null;
};

type Row = {
  id: number;
  game_name: string;
  tag_line: string;
  puuid: string | null;
  platform: string | null;
  synced_newest: string | number | null;
  synced_oldest: string | number | null;
  last_sync_at: Date | string | null;
};

const toNum = (v: string | number | null | undefined) =>
  v == null ? null : typeof v === "number" ? v : Number(v);

const toFriend = (r: Row): StoredFriend => ({
  id: r.id,
  gameName: r.game_name,
  tagLine: r.tag_line,
  puuid: r.puuid,
  platform: r.platform,
  syncedNewest: toNum(r.synced_newest),
  syncedOldest: toNum(r.synced_oldest),
  lastSyncAt: r.last_sync_at ? new Date(r.last_sync_at).toISOString() : null,
});

async function selectAll() {
  await ensureSchema();
  const { rows } = await pool.query<Row>(
    `SELECT id, game_name, tag_line, puuid, platform, synced_newest, synced_oldest, last_sync_at
     FROM friends ORDER BY created_at ASC, id ASC`,
  );
  return rows;
}

/**
 * Returns the tracked players. On an empty table it seeds the list from the
 * legacy FRIENDS env var once, so existing configs keep working.
 */
export async function listFriends(): Promise<StoredFriend[]> {
  let rows = await selectAll();
  if (rows.length === 0) {
    const seed = parseFriends();
    for (const f of seed) {
      await pool.query(
        "INSERT INTO friends (game_name, tag_line) VALUES ($1, $2) ON CONFLICT (game_name, tag_line) DO NOTHING",
        [f.gameName, f.tagLine],
      );
    }
    if (seed.length) rows = await selectAll();
  }
  return rows.map(toFriend);
}

export async function addFriend(gameName: string, tagLine: string): Promise<StoredFriend> {
  await ensureSchema();
  const { rows } = await pool.query<Row>(
    `INSERT INTO friends (game_name, tag_line) VALUES ($1, $2)
     ON CONFLICT (game_name, tag_line) DO UPDATE SET game_name = EXCLUDED.game_name
     RETURNING id, game_name, tag_line, puuid, platform, synced_newest, synced_oldest, last_sync_at`,
    [gameName, tagLine],
  );
  return toFriend(rows[0]);
}

export async function removeFriend(id: number): Promise<void> {
  await ensureSchema();
  await pool.query("DELETE FROM friends WHERE id = $1", [id]);
}

export async function updateFriendSync(
  id: number,
  data: {
    puuid?: string;
    platform?: string;
    syncedNewest?: number | null;
    syncedOldest?: number | null;
  },
) {
  await ensureSchema();
  await pool.query(
    `UPDATE friends SET
       puuid = COALESCE($2, puuid),
       platform = COALESCE($3, platform),
       synced_newest = CASE WHEN $4::bigint IS NULL THEN synced_newest ELSE $4::bigint END,
       synced_oldest = CASE WHEN $5::bigint IS NULL THEN synced_oldest ELSE $5::bigint END,
       last_sync_at = NOW()
     WHERE id = $1`,
    [
      id,
      data.puuid ?? null,
      data.platform ?? null,
      data.syncedNewest ?? null,
      data.syncedOldest ?? null,
    ],
  );
}

export function parseRiotId(raw: string): { gameName: string; tagLine: string } | null {
  const value = raw.trim();
  const idx = value.lastIndexOf("#");
  if (idx <= 0 || idx === value.length - 1) return null;
  const gameName = value.slice(0, idx).trim();
  const tagLine = value.slice(idx + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}
