import { pool } from "/lib/db";
import { parseFriends } from "/lib/riot";

export type StoredFriend = { id: number; gameName: string; tagLine: string };

type Row = { id: number; game_name: string; tag_line: string };
const toFriend = (r: Row): StoredFriend => ({ id: r.id, gameName: r.game_name, tagLine: r.tag_line });

async function selectAll() {
  const { rows } = await pool.query<Row>(
    "SELECT id, game_name, tag_line FROM friends ORDER BY created_at ASC, id ASC",
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
  const { rows } = await pool.query<Row>(
    `INSERT INTO friends (game_name, tag_line) VALUES ($1, $2)
     ON CONFLICT (game_name, tag_line) DO UPDATE SET game_name = EXCLUDED.game_name
     RETURNING id, game_name, tag_line`,
    [gameName, tagLine],
  );
  return toFriend(rows[0]);
}

export async function removeFriend(id: number): Promise<void> {
  await pool.query("DELETE FROM friends WHERE id = $1", [id]);
}
