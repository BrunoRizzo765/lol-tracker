import type {
  Dashboard,
  Friend,
  LadderEntry,
  LiveGame,
  Match,
  MatchDetail,
  MatchDetailParticipant,
  Rank,
} from "/lib/types";

/**
 * Sample data served when RIOT_API_KEY or DATABASE_URL are missing, so the UI
 * can be previewed without any setup. Everything is deterministic (seeded PRNG)
 * so reloads look identical.
 */

export const DEMO_PREFIX = "DEMO_";

const CHAMPS = [
  "Ahri", "Yasuo", "Jinx", "Thresh", "LeeSin", "Lux", "Ezreal", "Zed", "Vayne", "Leona",
  "Kaisa", "Sett", "Viego", "Akali", "Jhin", "Nami", "Darius", "Sylas", "Caitlyn", "Ornn",
  "Yone", "Samira", "Pyke", "Ekko", "Aatrox",
];
const SPELLS = ["SummonerFlash.png", "SummonerDot.png", "SummonerHeal.png", "SummonerTeleport.png", "SummonerSmite.png", "SummonerExhaust.png", "SummonerBarrier.png"];
const ITEMS = [3031, 3036, 3046, 3072, 3089, 3157, 3065, 3071, 3111, 3006, 3047, 6672, 6673, 6675, 3153, 3142, 3110, 3075, 4645, 3020, 3742, 6653, 3135, 3115, 3124];
const QUEUES = [420, 420, 420, 440, 450, 400, 490, 420];
const RANDOM_NAMES = ["Lumen", "Nyx", "Kael", "Sora", "Zephyr", "Iris", "Bram", "Vesper", "Orin", "Tala", "Rook", "Mira", "Dax", "Nova", "Juno"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const DEMO_FRIENDS = [
  { name: "Panchito", tag: "LAS", tier: "DIAMOND", division: "II", lp: 47, wins: 112, losses: 91, flexTier: "EMERALD", flexDiv: "I", flexLp: 12 },
  { name: "Brunardo", tag: "BRU", tier: "EMERALD", division: "III", lp: 81, wins: 96, losses: 88, flexTier: "PLATINUM", flexDiv: "II", flexLp: 55 },
  { name: "Tomii", tag: "0001", tier: "PLATINUM", division: "I", lp: 23, wins: 64, losses: 60, flexTier: null, flexDiv: null, flexLp: 0 },
  { name: "Lucho", tag: "LAS", tier: "GOLD", division: "IV", lp: 66, wins: 41, losses: 45, flexTier: "GOLD", flexDiv: "II", flexLp: 30 },
  { name: "Feca", tag: "GG", tier: "MASTER", division: "I", lp: 214, wins: 203, losses: 170, flexTier: "DIAMOND", flexDiv: "IV", flexLp: 9 },
];

function makeRank(queue: string, tier: string | null, division: string | null, lp: number, wins: number, losses: number): Rank | null {
  if (!tier) return null;
  return { queue, tier, division: division || "I", lp, wins, losses, winRate: Math.round((wins / (wins + losses)) * 100) };
}

function makeMatch(seed: number, friend: string, index: number): Match {
  const r = rng(seed * 7919 + index * 104729);
  const now = Date.now();
  const hoursAgo = index * 5.5 + r() * 4;
  const win = r() > 0.46;
  const duration = Math.round(18 * 60 + r() * 20 * 60);
  const kills = Math.round(r() * (win ? 14 : 8));
  const deaths = Math.round(r() * (win ? 5 : 10));
  const assists = Math.round(r() * 16);
  return {
    id: `${DEMO_PREFIX}${friend}_${index}`,
    date: Math.round(now - hoursAgo * 3600_000),
    duration,
    queueId: QUEUES[Math.floor(r() * QUEUES.length)],
    mode: "CLASSIC",
    champion: CHAMPS[Math.floor(r() * CHAMPS.length)],
    kills,
    deaths,
    assists,
    win,
    cs: Math.round((duration / 60) * (4.5 + r() * 4)),
    level: Math.min(18, 11 + Math.round(r() * 7)),
    gold: Math.round((duration / 60) * (320 + r() * 180)),
    friend,
  };
}

function makeLiveGame(friendName: string, tag: string, otherFriend: string, version: string | null): LiveGame {
  const r = rng(4242);
  const teams = [100, 200].map((teamId) => ({
    teamId,
    participants: Array.from({ length: 5 }, (_, i) => {
      const isFriend = teamId === 100 && (i === 1 || i === 3);
      const name = isFriend ? (i === 1 ? friendName : otherFriend) : RANDOM_NAMES[Math.floor(r() * RANDOM_NAMES.length)];
      return {
        puuid: `demo-${teamId}-${i}`,
        name,
        tag: isFriend ? (i === 1 ? tag : "LAS") : ["LAS", "LAN", "BR1"][Math.floor(r() * 3)],
        champion: CHAMPS[(teamId + i * 3 + Math.floor(r() * 5)) % CHAMPS.length],
        teamId,
        spell1Id: 4,
        spell2Id: 14,
        spell1Image: SPELLS[0],
        spell2Image: SPELLS[1 + Math.floor(r() * (SPELLS.length - 1))],
        isFriend,
      };
    }),
  }));
  return {
    friend: friendName,
    tag,
    gameId: 987654321,
    queueId: 420,
    mode: "CLASSIC",
    startTime: Date.now() - 14 * 60_000,
    length: 14 * 60 + 22,
    championName: teams[0].participants[1].champion,
    teamId: 100,
    platform: "la1",
    ddragonVersion: version,
    friendsInGame: [friendName, otherFriend],
    bans: [100, 200].flatMap((teamId) =>
      Array.from({ length: 5 }, (_, i) => ({
        teamId,
        pickTurn: i + 1,
        champion: CHAMPS[(teamId / 100 + i * 7 + 2) % CHAMPS.length],
      })),
    ),
    teams,
  };
}

export function demoDashboard(reason: string, version: string | null): Dashboard {
  const friends: Friend[] = DEMO_FRIENDS.map((f, fi) => {
    const matches = Array.from({ length: 12 }, (_, i) => makeMatch(fi + 1, f.name, i));
    return {
      id: `demo-${fi}`,
      dbId: undefined,
      name: f.name,
      tag: f.tag,
      solo: makeRank("RANKED_SOLO_5x5", f.tier, f.division, f.lp, f.wins, f.losses),
      flex: makeRank("RANKED_FLEX_SR", f.flexTier, f.flexDiv, f.flexLp, Math.round(f.wins * 0.4), Math.round(f.losses * 0.4)),
      rank: null,
      matches,
      live: null,
      syncedOldest: Date.now() - 45 * 24 * 3600_000,
      syncedNewest: Date.now() - 2 * 3600_000,
      lastSyncAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    };
  });
  for (const f of friends) f.rank = f.solo ?? f.flex;

  const live = makeLiveGame(friends[0].name, friends[0].tag, friends[2].name, version);
  friends[0].live = live;
  friends[2].live = live;

  const score = (r: Rank | null) => {
    if (!r) return 0;
    const tiers = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    const divs: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
    return tiers.indexOf(r.tier) * 400 + (divs[r.division] ?? 0) * 100 + r.lp;
  };

  const ladder: LadderEntry[] = friends
    .map((f) => ({
      name: f.name,
      tag: f.tag,
      solo: f.solo,
      flex: f.flex,
      rank: f.rank,
      live: Boolean(f.live),
      lastMatchAt: f.matches.length ? Math.max(...f.matches.map((m) => m.date)) : null,
      score: score(f.rank),
    }))
    .sort((a, b) => (a.live !== b.live ? (a.live ? -1 : 1) : b.score - a.score));

  const recent = friends
    .flatMap((f) => f.matches)
    .sort((a, b) => b.date - a.date);

  return {
    friends,
    recent: recent.slice(0, 40),
    matchTotal: recent.length,
    hasMoreMatches: recent.length > 40,
    live: [live],
    ladder,
    ddragonVersion: version,
    demo: { reason },
  };
}

export function demoMatchesPage(limit: number, before?: number) {
  const all = DEMO_FRIENDS.flatMap((f, fi) => Array.from({ length: 12 }, (_, i) => makeMatch(fi + 1, f.name, i)))
    .sort((a, b) => b.date - a.date)
    .filter((m) => !before || m.date < before);
  return { matches: all.slice(0, limit), total: all.length, hasMore: all.length > limit };
}

export function demoMatchDetail(id: string, version: string | null): MatchDetail {
  const r = rng(id.split("").reduce((s, c) => s + c.charCodeAt(0), 0));
  const friendName = id.replace(DEMO_PREFIX, "").replace(/_\d+$/, "") || "Amigo";
  const friendTeamWin = r() > 0.5;
  const duration = Math.round(20 * 60 + r() * 18 * 60);
  const participants: MatchDetailParticipant[] = [100, 200].flatMap((teamId) =>
    Array.from({ length: 5 }, (_, i) => {
      const win = teamId === 100 ? friendTeamWin : !friendTeamWin;
      const isFriend = teamId === 100 && i === 2;
      return {
        puuid: `demo-${id}-${teamId}-${i}`,
        name: isFriend ? friendName : RANDOM_NAMES[Math.floor(r() * RANDOM_NAMES.length)],
        tag: isFriend ? "LAS" : ["LAS", "LAN", "BR1"][Math.floor(r() * 3)],
        champion: CHAMPS[Math.floor(r() * CHAMPS.length)],
        teamId,
        kills: Math.round(r() * (win ? 13 : 7)),
        deaths: Math.round(r() * (win ? 5 : 9)),
        assists: Math.round(r() * 15),
        cs: Math.round((duration / 60) * (3 + r() * 5)),
        gold: Math.round((duration / 60) * (300 + r() * 200)),
        level: Math.min(18, 10 + Math.round(r() * 8)),
        win,
        items: Array.from({ length: 6 }, () => (r() > 0.15 ? ITEMS[Math.floor(r() * ITEMS.length)] : 0)),
      };
    }),
  );
  const teams = [100, 200].map((teamId) => {
    const ps = participants.filter((p) => p.teamId === teamId);
    return {
      teamId,
      win: ps[0].win,
      kills: ps.reduce((s, p) => s + p.kills, 0),
      deaths: ps.reduce((s, p) => s + p.deaths, 0),
      assists: ps.reduce((s, p) => s + p.assists, 0),
      gold: ps.reduce((s, p) => s + p.gold, 0),
      participants: ps,
    };
  });
  return {
    id,
    date: Date.now() - Math.round(r() * 48) * 3600_000,
    duration,
    queueId: 420,
    mode: "CLASSIC",
    teams,
    ddragonVersion: version,
  };
}
