import { ensureSchema, pool } from "/lib/db";
import type { Match } from "/lib/types";

export type StoredMatch = Match & { friendId: number; friend: string };

type Row = {
  friend_id: number;
  match_id: string;
  game_creation: string | number;
  game_duration: number;
  queue_id: number;
  game_mode: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  cs: number;
  level: number;
  gold: number;
  game_name: string;
};

const toMatch = (r: Row): StoredMatch => ({
  friendId: r.friend_id,
  friend: r.game_name,
  id: r.match_id,
  date: Number(r.game_creation),
  duration: r.game_duration,
  queueId: r.queue_id,
  mode: r.game_mode,
  champion: r.champion,
  kills: r.kills,
  deaths: r.deaths,
  assists: r.assists,
  win: r.win,
  cs: r.cs,
  level: r.level,
  gold: r.gold,
});

export type MatchInput = {
  friendId: number;
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  queueId: number;
  gameMode: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  cs: number;
  level: number;
  gold: number;
};

export async function upsertMatches(rows: MatchInput[]) {
  if (!rows.length) return 0;
  await ensureSchema();
  let inserted = 0;
  for (const m of rows) {
    const result = await pool.query(
      `INSERT INTO matches (
         friend_id, match_id, game_creation, game_duration, queue_id, game_mode,
         champion, kills, deaths, assists, win, cs, level, gold
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (friend_id, match_id) DO NOTHING`,
      [
        m.friendId,
        m.matchId,
        m.gameCreation,
        m.gameDuration,
        m.queueId,
        m.gameMode,
        m.champion,
        m.kills,
        m.deaths,
        m.assists,
        m.win,
        m.cs,
        m.level,
        m.gold,
      ],
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

export async function listMatches(opts: {
  limit?: number;
  offset?: number;
  friendId?: number;
  before?: number;
}): Promise<{ matches: StoredMatch[]; total: number }> {
  await ensureSchema();
  const limit = Math.min(Math.max(opts.limit ?? 40, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const params: unknown[] = [];
  const where: string[] = [];

  if (opts.friendId) {
    params.push(opts.friendId);
    where.push(`m.friend_id = $${params.length}`);
  }
  if (opts.before) {
    params.push(opts.before);
    where.push(`m.game_creation < $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM matches m ${whereSql}`,
    params,
  );

  params.push(limit);
  params.push(offset);
  const { rows } = await pool.query<Row>(
    `SELECT m.*, f.game_name
     FROM matches m
     JOIN friends f ON f.id = m.friend_id
     ${whereSql}
     ORDER BY m.game_creation DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return { matches: rows.map(toMatch), total: Number(countRes.rows[0]?.count || 0) };
}

export async function listMatchesForFriend(friendId: number, limit = 8): Promise<StoredMatch[]> {
  const { matches } = await listMatches({ friendId, limit });
  return matches;
}

export async function existingMatchIds(friendId: number, matchIds: string[]): Promise<Set<string>> {
  if (!matchIds.length) return new Set();
  await ensureSchema();
  const { rows } = await pool.query<{ match_id: string }>(
    `SELECT match_id FROM matches WHERE friend_id = $1 AND match_id = ANY($2::text[])`,
    [friendId, matchIds],
  );
  return new Set(rows.map((r) => r.match_id));
}
