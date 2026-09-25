import { listFriends, updateFriendSync, type StoredFriend } from "/lib/friends-store";
import { existingMatchIds, upsertMatches, type MatchInput } from "/lib/matches-store";
import { getAccount, getMatch, getMatchIds, participantFor } from "/lib/riot";

const DAY_SEC = 24 * 60 * 60;
const WINDOW_DAYS = 5;
/** Cap Riot detail fetches per friend per sync click (rate-limit friendly). */
const MAX_FETCH_PER_FRIEND = 40;

export type SyncMode = "refresh" | "backfill";

export type FriendSyncResult = {
  friendId: number;
  name: string;
  tag: string;
  fetched: number;
  inserted: number;
  windowStart: number;
  windowEnd: number;
  error?: string;
};

function windowFor(friend: StoredFriend, mode: SyncMode): { startSec: number; endSec: number } {
  const nowSec = Math.floor(Date.now() / 1000);

  if (mode === "refresh") {
    if (friend.syncedNewest) {
      // From last known match (minus 1h overlap) up to now.
      const startSec = Math.floor(friend.syncedNewest / 1000) - 3600;
      return { startSec: Math.max(0, startSec), endSec: nowSec };
    }
    return { startSec: nowSec - WINDOW_DAYS * DAY_SEC, endSec: nowSec };
  }

  // backfill: 5 more days older than the oldest cursor we already synced.
  const oldestMs = friend.syncedOldest ?? friend.syncedNewest ?? Date.now();
  const endSec = Math.floor(oldestMs / 1000);
  return { startSec: Math.max(0, endSec - WINDOW_DAYS * DAY_SEC), endSec };
}

async function collectMatchIds(
  puuid: string,
  startSec: number,
  endSec: number,
): Promise<string[]> {
  const ids: string[] = [];
  let start = 0;
  while (ids.length < MAX_FETCH_PER_FRIEND) {
    const batch = await getMatchIds(puuid, {
      start,
      count: 100,
      startTime: startSec,
      endTime: endSec,
    });
    if (!batch.length) break;
    ids.push(...batch);
    if (batch.length < 100) break;
    start += batch.length;
  }
  return ids.slice(0, MAX_FETCH_PER_FRIEND);
}

async function syncOneFriend(friend: StoredFriend, mode: SyncMode): Promise<FriendSyncResult> {
  const { startSec, endSec } = windowFor(friend, mode);
  const base = {
    friendId: friend.id,
    name: friend.gameName,
    tag: friend.tagLine,
    fetched: 0,
    inserted: 0,
    windowStart: startSec * 1000,
    windowEnd: endSec * 1000,
  };

  try {
    const account = await getAccount(friend.gameName, friend.tagLine);
    const ids = await collectMatchIds(account.puuid, startSec, endSec);
    base.fetched = ids.length;

    const known = await existingMatchIds(friend.id, ids);
    const missing = ids.filter((id) => !known.has(id));

    const rows: MatchInput[] = [];
    for (const matchId of missing) {
      try {
        const match = await getMatch(matchId);
        const p = participantFor(match, account.puuid);
        if (!p) continue;
        rows.push({
          friendId: friend.id,
          matchId: match.metadata.matchId,
          gameCreation: match.info.gameCreation,
          gameDuration: match.info.gameDuration,
          queueId: match.info.queueId,
          gameMode: match.info.gameMode,
          champion: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          win: p.win,
          cs: p.totalMinionsKilled + p.neutralMinionsKilled,
          level: p.champLevel,
          gold: p.goldEarned,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "RIOT_RATE_LIMIT") break;
        // skip individual match failures
      }
    }

    const inserted = await upsertMatches(rows);
    base.inserted = inserted;

    // Advance sync cursors even if Riot returned 0 games (we still covered the window).
    const creations = rows.map((r) => r.gameCreation);
    let syncedNewest = friend.syncedNewest;
    let syncedOldest = friend.syncedOldest;

    if (mode === "refresh") {
      syncedNewest = Math.max(syncedNewest ?? 0, endSec * 1000, ...creations);
      if (syncedOldest == null) {
        syncedOldest = creations.length
          ? Math.min(...creations)
          : startSec * 1000;
      } else if (creations.length) {
        syncedOldest = Math.min(syncedOldest, ...creations);
      }
    } else {
      // backfill: always push oldest cursor to the start of this window
      syncedOldest = Math.min(syncedOldest ?? endSec * 1000, startSec * 1000, ...creations);
      if (syncedNewest == null && creations.length) {
        syncedNewest = Math.max(...creations);
      }
    }

    await updateFriendSync(friend.id, {
      puuid: account.puuid,
      syncedNewest,
      syncedOldest,
    });

    return base;
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : "SYNC_ERROR",
    };
  }
}

export async function syncMatches(mode: SyncMode = "refresh"): Promise<{
  mode: SyncMode;
  results: FriendSyncResult[];
  inserted: number;
  fetched: number;
}> {
  const friends = await listFriends();
  const results: FriendSyncResult[] = [];
  for (const friend of friends) {
    results.push(await syncOneFriend(friend, mode));
  }
  return {
    mode,
    results,
    inserted: results.reduce((s, r) => s + r.inserted, 0),
    fetched: results.reduce((s, r) => s + r.fetched, 0),
  };
}
