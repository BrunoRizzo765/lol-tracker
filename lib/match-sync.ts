import { listFriends, updateFriendSync, type StoredFriend } from "/lib/friends-store";
import { existingMatchIds, upsertMatches, type MatchInput } from "/lib/matches-store";
import { getAccount, getMatch, getMatchIds, participantFor, resolvePlatform } from "/lib/riot";

/** Safety caps so one sync doesn't blow rate limits forever. */
const MAX_IDS_PER_FRIEND = 1000;
const MAX_DETAILS_PER_FRIEND = 400;

export type FriendSyncResult = {
  friendId: number;
  name: string;
  tag: string;
  mode: "full" | "refresh";
  fetched: number;
  inserted: number;
  error?: string;
};

async function collectMatchIds(
  puuid: string,
  opts: { startTime?: number; endTime?: number } = {},
): Promise<string[]> {
  const ids: string[] = [];
  let start = 0;
  while (ids.length < MAX_IDS_PER_FRIEND) {
    const batch = await getMatchIds(puuid, {
      start,
      count: 100,
      startTime: opts.startTime,
      endTime: opts.endTime,
    });
    if (!batch.length) break;
    ids.push(...batch);
    if (batch.length < 100) break;
    start += batch.length;
  }
  return ids.slice(0, MAX_IDS_PER_FRIEND);
}

async function syncOneFriend(friend: StoredFriend): Promise<FriendSyncResult> {
  const isFirst = friend.syncedNewest == null;
  const mode: "full" | "refresh" = isFirst ? "full" : "refresh";
  const nowSec = Math.floor(Date.now() / 1000);

  const base: FriendSyncResult = {
    friendId: friend.id,
    name: friend.gameName,
    tag: friend.tagLine,
    mode,
    fetched: 0,
    inserted: 0,
  };

  try {
    const account = await getAccount(friend.gameName, friend.tagLine);
    const platform =
      friend.platform ||
      (await resolvePlatform(account.puuid, friend.platform).catch(() => null));

    const ids = isFirst
      ? await collectMatchIds(account.puuid)
      : await collectMatchIds(account.puuid, {
          // Slight overlap so we don't miss games around the cursor.
          startTime: Math.floor(friend.syncedNewest! / 1000) - 3600,
          endTime: nowSec,
        });

    base.fetched = ids.length;

    const known = await existingMatchIds(friend.id, ids);
    const missing = ids.filter((id) => !known.has(id)).slice(0, MAX_DETAILS_PER_FRIEND);

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
      }
    }

    const inserted = await upsertMatches(rows);
    base.inserted = inserted;

    const creations = rows.map((r) => r.gameCreation);
    let syncedNewest = friend.syncedNewest;
    let syncedOldest = friend.syncedOldest;

    if (creations.length) {
      syncedNewest = Math.max(syncedNewest ?? 0, ...creations, Date.now());
      syncedOldest = Math.min(syncedOldest ?? creations[0], ...creations);
    } else if (isFirst) {
      // Mark as synced even with 0 ranked/normal games so later calls only refresh.
      syncedNewest = Date.now();
      syncedOldest = Date.now();
    } else {
      syncedNewest = Math.max(syncedNewest ?? 0, Date.now());
    }

    await updateFriendSync(friend.id, {
      puuid: account.puuid,
      platform: platform || undefined,
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

/**
 * First time per friend → full match history.
 * Later → only matches newer than the last sync cursor.
 */
export async function syncMatches(): Promise<{
  results: FriendSyncResult[];
  inserted: number;
  fetched: number;
  full: number;
  refresh: number;
}> {
  const friends = await listFriends();
  const results: FriendSyncResult[] = [];
  for (const friend of friends) {
    results.push(await syncOneFriend(friend));
  }
  return {
    results,
    inserted: results.reduce((s, r) => s + r.inserted, 0),
    fetched: results.reduce((s, r) => s + r.fetched, 0),
    full: results.filter((r) => r.mode === "full").length,
    refresh: results.filter((r) => r.mode === "refresh").length,
  };
}
