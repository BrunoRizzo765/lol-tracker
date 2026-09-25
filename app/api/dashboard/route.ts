import { NextResponse } from "next/server";
import { listFriends, updateFriendSync } from "/lib/friends-store";
import { listMatches, listMatchesForFriend } from "/lib/matches-store";
import {
  getAccount,
  getLiveGameByPuuid,
  getRankedEntries,
  rankScore,
  riotKeyConfigured,
  splitRanks,
} from "/lib/riot";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchLimit = Math.min(Number(searchParams.get("matchLimit") || 40) || 40, 100);

  if (!riotKeyConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta RIOT_API_KEY real en .env.local. Sacá una Development Key en https://developer.riotgames.com y reemplazá RGAPI-REPLACE_ME.",
      },
      { status: 500 },
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

  const result = [];
  for (const friend of friends) {
    try {
      const account = friend.puuid
        ? { puuid: friend.puuid, gameName: friend.gameName, tagLine: friend.tagLine }
        : await getAccount(friend.gameName, friend.tagLine);

      const [rankedResult, live, storedMatches] = await Promise.all([
        getRankedEntries(account.puuid, friend.platform)
          .then((r) => ({ ranked: r.entries, platform: r.platform, rankError: null as string | null }))
          .catch((error) => ({
            ranked: [] as Awaited<ReturnType<typeof getRankedEntries>>["entries"],
            platform: friend.platform,
            rankError: error instanceof Error ? error.message : "RANK_ERROR",
          })),
        getLiveGameByPuuid(account.puuid, account.gameName, account.tagLine, friend.platform).catch(
          () => null,
        ),
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
        id: `${friend.gameName}#${friend.tagLine}`,
        dbId: friend.id,
        name: friend.gameName,
        tag: friend.tagLine,
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

  const { matches: recent, total: matchTotal } = await listMatches({ limit: matchLimit });
  const live = result.map((f) => f.live).filter(Boolean);

  return NextResponse.json({
    friends: result,
    recent,
    matchTotal,
    hasMoreMatches: recent.length < matchTotal,
    live,
    ladder,
  });
}
