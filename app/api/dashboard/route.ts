import { NextResponse } from "next/server";
import { getFriendMatches, parseFriends, participantFor, pickSoloQueue, rankScore } from "/lib/riot";

export const runtime = "nodejs";

export async function GET() {
  const friends = parseFriends();
  if (!friends.length) return NextResponse.json({ error: "No friends configured." }, { status: 400 });

  const result = [];
  for (const friend of friends) {
    try {
      const { account, matches, ranked } = await getFriendMatches(friend.gameName, friend.tagLine, 8);
      const solo = pickSoloQueue(ranked);
      result.push({
        id: account.puuid,
        name: account.gameName,
        tag: account.tagLine,
        rank: solo
          ? {
              queue: solo.queueType,
              tier: solo.tier,
              division: solo.rank,
              lp: solo.leaguePoints,
              wins: solo.wins,
              losses: solo.losses,
              winRate: solo.wins + solo.losses ? Math.round((solo.wins / (solo.wins + solo.losses)) * 100) : 0,
              hotStreak: solo.hotStreak,
            }
          : null,
        matches: matches.map((match) => {
          const p = participantFor(match, account.puuid);
          return p ? {
            id: match.metadata.matchId,
            date: match.info.gameCreation,
            duration: match.info.gameDuration,
            queueId: match.info.queueId,
            mode: match.info.gameMode,
            champion: p.championName,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            win: p.win,
            cs: p.totalMinionsKilled + p.neutralMinionsKilled,
            level: p.champLevel,
            gold: p.goldEarned,
          } : null;
        }).filter(Boolean),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      result.push({ id: `${friend.gameName}#${friend.tagLine}`, name: friend.gameName, tag: friend.tagLine, rank: null, matches: [], error: message });
    }
  }

  const ladder = result
    .map((friend) => ({
      name: friend.name,
      tag: friend.tag,
      rank: friend.rank,
      score: rankScore(
        friend.rank ? { tier: friend.rank.tier, rank: friend.rank.division, leaguePoints: friend.rank.lp } : null,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const allMatches = result.flatMap((friend) => friend.matches.map((match) => ({ ...match, friend: friend.name })));
  const valid = allMatches.filter(Boolean) as Array<NonNullable<(typeof result)[number]["matches"][number]> & { friend: string }>;
  const stats = result.map((friend) => {
    const ms = friend.matches.filter(Boolean) as NonNullable<(typeof friend.matches)[number]>[];
    const wins = ms.filter((m) => m.win).length;
    const kills = ms.reduce((sum, m) => sum + m.kills, 0);
    const deaths = ms.reduce((sum, m) => sum + m.deaths, 0);
    const assists = ms.reduce((sum, m) => sum + m.assists, 0);
    return { name: friend.name, tag: friend.tag, games: ms.length, wins, losses: ms.length - wins, winRate: ms.length ? Math.round((wins / ms.length) * 100) : 0, kda: deaths ? Number(((kills + assists) / deaths).toFixed(2)) : kills + assists };
  }).sort((a, b) => b.winRate - a.winRate || b.kda - a.kda);

  valid.sort((a, b) => b.date - a.date);
  return NextResponse.json({ friends: result, recent: valid.slice(0, 30), ranking: stats, ladder });
}
