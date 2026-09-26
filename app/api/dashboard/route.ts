import { NextResponse } from "next/server";
import { listFriends, updateFriendSync } from "/lib/friends-store";
import { listMatches, listMatchesForFriend } from "/lib/matches-store";
import {
  getAccount,
  getDDragonVersion,
  getLiveGameByPuuid,
  getRankedEntries,
  rankScore,
  riotKeyConfigured,
  splitRanks,
} from "/lib/riot";
import { demoDashboard } from "/lib/demo";
import type { LiveGame } from "/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchLimit = Math.min(Number(searchParams.get("matchLimit") || 40) || 40, 100);

  // Sin configuración → datos de ejemplo para poder ver la UI igual.
  const missing = [
    !riotKeyConfigured() && "RIOT_API_KEY",
    !process.env.DATABASE_URL && "DATABASE_URL",
  ].filter(Boolean) as string[];
  if (missing.length) {
    const version = await getDDragonVersion().catch(() => null);
    return NextResponse.json(
      demoDashboard(`Falta ${missing.join(" y ")} en .env.local`, version),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let friends;
  try {
    friends = await listFriends();
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB_ERROR";
    return NextResponse.json(
      { error: message === "Missing DATABASE_URL" ? "Configurá DATABASE_URL (Postgres)." : message },
      { status: 500 },
    );
  }

  if (!friends.length) {
    return NextResponse.json(
      { error: "No hay amigos. Agregá uno desde la UI o configurá FRIENDS en .env." },
      { status: 400 },
    );
  }

  // Resolve accounts first so live games can mark every friend in the lobby.
  const accounts = [];
  for (const friend of friends) {
    try {
      const account = friend.puuid
        ? { puuid: friend.puuid, gameName: friend.gameName, tagLine: friend.tagLine }
        : await getAccount(friend.gameName, friend.tagLine);
      accounts.push({ friend, account, error: null as string | null });
    } catch (error) {
      accounts.push({
        friend,
        account: null,
        error: error instanceof Error ? error.message : "ACCOUNT_ERROR",
      });
    }
  }

  const friendPuids = accounts.map((a) => a.account?.puuid).filter((p): p is string => Boolean(p));

  const result = [];
  for (const row of accounts) {
    const { friend, account, error: accountError } = row;
    if (!account) {
      result.push({
        id: `${friend.gameName}#${friend.tagLine}`,
        dbId: friend.id,
        name: friend.gameName,
        tag: friend.tagLine,
        solo: null,
        flex: null,
        rank: null,
        live: null,
        matches: [],
        error: accountError || "ACCOUNT_ERROR",
      });
      continue;
    }

    try {
      const [rankedResult, live, storedMatches] = await Promise.all([
        getRankedEntries(account.puuid, friend.platform)
          .then((r) => ({ ranked: r.entries, platform: r.platform, rankError: null as string | null }))
          .catch((error) => ({
            ranked: [] as Awaited<ReturnType<typeof getRankedEntries>>["entries"],
            platform: friend.platform,
            rankError: error instanceof Error ? error.message : "RANK_ERROR",
          })),
        getLiveGameByPuuid(
          account.puuid,
          account.gameName,
          account.tagLine,
          friend.platform,
          friendPuids,
        ).catch(() => null),
        listMatchesForFriend(friend.id, 12),
      ]);

      if (rankedResult.platform && rankedResult.platform !== friend.platform) {
        await updateFriendSync(friend.id, {
          puuid: account.puuid,
          platform: rankedResult.platform,
        }).catch(() => undefined);
      } else if (!friend.puuid) {
        await updateFriendSync(friend.id, { puuid: account.puuid }).catch(() => undefined);
      }

      const { solo, flex } = splitRanks(rankedResult.ranked);
      const rank = solo ?? flex;

      result.push({
        id: account.puuid,
        dbId: friend.id,
        name: account.gameName,
        tag: account.tagLine,
        platform: rankedResult.platform || friend.platform,
        solo,
        flex,
        rank,
        rankError: rankedResult.rankError,
        live,
        syncedOldest: friend.syncedOldest,
        syncedNewest: friend.syncedNewest,
        lastSyncAt: friend.lastSyncAt,
        matches: storedMatches.map(({ friendId: _f, friend: _n, ...m }) => m),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      result.push({
        id: account.puuid,
        dbId: friend.id,
        name: account.gameName,
        tag: account.tagLine,
        solo: null,
        flex: null,
        rank: null,
        live: null,
        matches: [],
        error: message,
      });
    }
  }

  const ladder = result
    .map((friend) => {
      const ms = friend.matches;
      const lastMatchAt = ms.length ? Math.max(...ms.map((m) => m.date)) : null;
      return {
        name: friend.name,
        tag: friend.tag,
        solo: friend.solo,
        flex: friend.flex,
        rank: friend.rank,
        live: Boolean(friend.live),
        lastMatchAt,
        score: rankScore(
          friend.rank
            ? { tier: friend.rank.tier, rank: friend.rank.division, leaguePoints: friend.rank.lp }
            : null,
        ),
      };
    })
    .sort((a, b) => {
      if (a.live !== b.live) return a.live ? -1 : 1;
      return b.score - a.score;
    });

  // One card per live match (several friends may be in the same game).
  const liveByGame = new Map<number, LiveGame>();
  for (const friend of result) {
    if (!friend.live) continue;
    const existing = liveByGame.get(friend.live.gameId);
    if (!existing) {
      liveByGame.set(friend.live.gameId, friend.live);
    } else {
      const merged = new Set([...(existing.friendsInGame || []), ...(friend.live.friendsInGame || [])]);
      existing.friendsInGame = [...merged];
    }
  }

  const [{ matches: recent, total: matchTotal }, ddragonVersion] = await Promise.all([
    listMatches({ limit: matchLimit }),
    getDDragonVersion().catch(() => null),
  ]);

  return NextResponse.json({
    friends: result,
    recent,
    matchTotal,
    hasMoreMatches: recent.length < matchTotal,
    live: [...liveByGame.values()],
    ladder,
    ddragonVersion,
    demo: null,
  });
}
