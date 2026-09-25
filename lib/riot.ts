const API_KEY = process.env.RIOT_API_KEY;
const PLATFORM = process.env.RIOT_REGION || "la1";
const REGIONAL = process.env.RIOT_REGIONAL || "americas";

export function riotKeyConfigured() {
  return Boolean(API_KEY && API_KEY !== "RGAPI-REPLACE_ME" && API_KEY.startsWith("RGAPI-"));
}

if (!riotKeyConfigured()) {
  console.warn("RIOT_API_KEY is missing or still set to the placeholder RGAPI-REPLACE_ME.");
}

type RiotAccount = { puuid: string; gameName: string; tagLine: string };
type MatchList = string[];

type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
};

type Match = {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    mapId: number;
    queueId: number;
    participants: Participant[];
    teams: { teamId: number; win: boolean; objectives?: Record<string, unknown> }[];
  };
};

type Participant = {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  teamId: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  champLevel: number;
  role?: string;
  lane?: string;
  item0: number; item1: number; item2: number; item3: number; item4: number; item5: number;
};

async function riotFetch<T>(base: string, path: string, revalidate = 120): Promise<T> {
  if (!riotKeyConfigured()) throw new Error("Missing RIOT_API_KEY");
  const response = await fetch(`${base}${path}`, {
    headers: { "X-Riot-Token": API_KEY as string },
    ...(revalidate <= 0
      ? { cache: "no-store" as const }
      : { next: { revalidate } }),
  });
  if (response.status === 404) throw new Error("RIOT_NOT_FOUND");
  if (response.status === 429) throw new Error("RIOT_RATE_LIMIT");
  if (!response.ok) throw new Error(`RIOT_HTTP_${response.status}`);
  return response.json() as Promise<T>;
}

export async function getAccount(gameName: string, tagLine: string) {
  return riotFetch<RiotAccount>(
    `https://${REGIONAL}.api.riotgames.com`,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    3600,
  );
}

export async function getMatchIds(
  puuid: string,
  opts: { count?: number; start?: number; startTime?: number; endTime?: number } = {},
) {
  const count = Math.min(Math.max(opts.count ?? 10, 1), 100);
  const start = Math.max(opts.start ?? 0, 0);
  const params = new URLSearchParams({
    start: String(start),
    count: String(count),
  });
  // Riot expects epoch seconds for startTime / endTime.
  if (opts.startTime != null) params.set("startTime", String(Math.floor(opts.startTime)));
  if (opts.endTime != null) params.set("endTime", String(Math.floor(opts.endTime)));

  return riotFetch<MatchList>(
    `https://${REGIONAL}.api.riotgames.com`,
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?${params}`,
    0,
  );
}

export async function getMatch(matchId: string) {
  return riotFetch<Match>(
    `https://${REGIONAL}.api.riotgames.com`,
    `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
    3600,
  );
}

type Summoner = { id?: string; puuid: string; profileIconId: number; summonerLevel: number };

/** Platforms that share the americas / europe / asia match routing. */
const PLATFORM_FALLBACKS: Record<string, string[]> = {
  americas: ["la1", "la2", "br1", "na1"],
  europe: ["euw1", "eun1", "tr1", "ru"],
  asia: ["kr", "jp1"],
  sea: ["oc1", "sg2", "tw2", "vn2"],
};

function platformsToTry(preferred?: string | null): string[] {
  const primary = preferred || PLATFORM;
  const group =
    PLATFORM_FALLBACKS[REGIONAL] ||
    Object.values(PLATFORM_FALLBACKS).find((list) => list.includes(primary)) ||
    [];
  return [primary, ...group.filter((p) => p !== primary)];
}

/**
 * Find which platform shard hosts this PUUID.
 * Summoner IDs were removed from Riot payloads in 2025 — only PUUID lookups remain reliable.
 */
export async function resolvePlatform(puuid: string, preferred?: string | null): Promise<string> {
  let lastError: Error | null = null;
  for (const platform of platformsToTry(preferred)) {
    try {
      await riotFetch<Summoner>(
        `https://${platform}.api.riotgames.com`,
        `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
        3600,
      );
      return platform;
    } catch (error) {
      if (error instanceof Error && error.message === "RIOT_NOT_FOUND") {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error("PLATFORM_NOT_FOUND");
}

export async function getSummonerByPuuid(puuid: string, platform = PLATFORM) {
  return riotFetch<Summoner>(
    `https://${platform}.api.riotgames.com`,
    `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
    3600,
  );
}

/**
 * Ranked Solo/Flex for a PUUID.
 * 1) Resolve the correct platform shard
 * 2) Call league-v4 entries/by-puuid (summoner id is gone)
 */
export async function getRankedEntries(
  puuid: string,
  preferredPlatform?: string | null,
): Promise<{ entries: LeagueEntry[]; platform: string }> {
  const platform = await resolvePlatform(puuid, preferredPlatform);
  const entries = await riotFetch<LeagueEntry[]>(
    `https://${platform}.api.riotgames.com`,
    `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    0,
  );
  return { entries: entries ?? [], platform };
}

export function toRank(entry: LeagueEntry | null | undefined) {
  if (!entry?.tier) return null;
  const wins = entry.wins ?? 0;
  const losses = entry.losses ?? 0;
  return {
    queue: entry.queueType,
    tier: entry.tier,
    division: entry.rank,
    lp: entry.leaguePoints,
    wins,
    losses,
    winRate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0,
  };
}

export function splitRanks(entries: LeagueEntry[] | undefined) {
  const list = entries ?? [];
  const solo = list.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;
  const flex = list.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;
  return { solo: toRank(solo), flex: toRank(flex) };
}

export async function getFriendMatches(gameName: string, tagLine: string, count = 8) {
  const account = await getAccount(gameName, tagLine);
  const [ids, rankedResult] = await Promise.all([
    getMatchIds(account.puuid, { count }),
    getRankedEntries(account.puuid)
      .then((r) => ({ ranked: r.entries, platform: r.platform, rankError: null as string | null }))
      .catch((error) => ({
        ranked: [] as LeagueEntry[],
        platform: null as string | null,
        rankError: error instanceof Error ? error.message : "RANK_ERROR",
      })),
  ]);
  const matches = await Promise.all(ids.map((id) => getMatch(id)));
  return {
    account,
    matches,
    ranked: rankedResult.ranked,
    platform: rankedResult.platform,
    rankError: rankedResult.rankError,
  };
}

const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 9, GRANDMASTER: 8, MASTER: 7, DIAMOND: 6, EMERALD: 5,
  PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1, IRON: 0,
};
const DIVISION_ORDER: Record<string, number> = { I: 4, II: 3, III: 2, IV: 1 };

export function rankScore(entry: Pick<LeagueEntry, "tier" | "rank" | "leaguePoints"> | null) {
  if (!entry) return -1;
  const tier = TIER_ORDER[entry.tier?.toUpperCase()] ?? 0;
  const division = DIVISION_ORDER[entry.rank?.toUpperCase()] ?? 0;
  return tier * 10000 + division * 1000 + entry.leaguePoints;
}

export function pickSoloQueue(entries: LeagueEntry[] | undefined) {
  if (!entries?.length) return null;
  return (
    entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ??
    entries.find((e) => e.queueType === "RANKED_FLEX_SR") ??
    null
  );
}

export function parseFriends() {
  return (process.env.FRIENDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const idx = value.lastIndexOf("#");
      if (idx <= 0) return null;
      return { gameName: value.slice(0, idx), tagLine: value.slice(idx + 1) };
    })
    .filter((x): x is { gameName: string; tagLine: string } => Boolean(x));
}

export function participantFor(match: Match, puuid: string) {
  return match.info.participants.find((p) => p.puuid === puuid) ?? null;
}

// --- Data Dragon (public CDN, no API key) ---

const DDRAGON = "https://ddragon.leagueoflegends.com";

export async function getDDragonVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON}/api/versions.json`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("DDRAGON_VERSION");
  const versions = (await res.json()) as string[];
  return versions[0];
}

type ChampionData = { data: Record<string, { id: string; key: string; name: string }> };

export async function getChampionsById(): Promise<Map<number, { id: string; name: string }>> {
  const version = await getDDragonVersion();
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("DDRAGON_CHAMPIONS");
  const json = (await res.json()) as ChampionData;
  const map = new Map<number, { id: string; name: string }>();
  for (const champ of Object.values(json.data)) map.set(Number(champ.key), { id: champ.id, name: champ.name });
  return map;
}

type SpellData = { data: Record<string, { id: string; key: string; image: { full: string } }> };

export async function getSummonerSpellsById(): Promise<Map<number, { id: string; image: string }>> {
  const version = await getDDragonVersion();
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/summoner.json`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("DDRAGON_SPELLS");
  const json = (await res.json()) as SpellData;
  const map = new Map<number, { id: string; image: string }>();
  for (const spell of Object.values(json.data)) {
    map.set(Number(spell.key), { id: spell.id, image: spell.image.full });
  }
  return map;
}

// --- Spectator (live games) ---

type CurrentGame = {
  gameId: number;
  gameStartTime: number;
  gameLength: number;
  gameMode: string;
  gameQueueConfigId: number;
  mapId: number;
  participants: {
    puuid: string;
    teamId: number;
    championId: number;
    riotId?: string;
    summonerName?: string;
    spell1Id: number;
    spell2Id: number;
  }[];
  bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
};

function parseRiotIdField(riotId?: string, summonerName?: string) {
  if (riotId && riotId.includes("#")) {
    const idx = riotId.lastIndexOf("#");
    return { name: riotId.slice(0, idx), tag: riotId.slice(idx + 1) };
  }
  if (riotId) return { name: riotId, tag: "" };
  return { name: summonerName || "Invocador", tag: "" };
}

export async function getLiveGameByPuuid(
  puuid: string,
  friendName: string,
  friendTag: string,
  preferredPlatform?: string | null,
  friendPuids: string[] = [],
) {
  const [champions, spells, version] = await Promise.all([
    getChampionsById().catch(() => new Map<number, { id: string; name: string }>()),
    getSummonerSpellsById().catch(() => new Map<number, { id: string; image: string }>()),
    getDDragonVersion().catch(() => null),
  ]);
  const champMeta = (id: number) => champions.get(id);
  const spellImg = (id: number) => spells.get(id)?.image || "";

  const tracked = new Set([puuid, ...friendPuids]);

  for (const platform of platformsToTry(preferredPlatform)) {
    let game: CurrentGame;
    try {
      game = await riotFetch<CurrentGame>(
        `https://${platform}.api.riotgames.com`,
        `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
        20,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "RIOT_NOT_FOUND") continue;
      throw error;
    }

    const me = game.participants.find((p) => p.puuid === puuid);
    const elapsed =
      game.gameStartTime > 0
        ? Math.max(0, Math.floor((Date.now() - game.gameStartTime) / 1000))
        : game.gameLength;

    const participants = game.participants.map((p) => {
      const identity = parseRiotIdField(p.riotId, p.summonerName);
      const champ = champMeta(p.championId);
      return {
        puuid: p.puuid,
        name: identity.name,
        tag: identity.tag,
        champion: champ?.id || String(p.championId),
        teamId: p.teamId,
        spell1Id: p.spell1Id,
        spell2Id: p.spell2Id,
        spell1Image: spellImg(p.spell1Id),
        spell2Image: spellImg(p.spell2Id),
        isFriend: tracked.has(p.puuid),
      };
    });

    const friendsInGame = participants
      .filter((p) => p.isFriend)
      .map((p) => (p.tag ? `${p.name}#${p.tag}` : p.name));

    const bans = (game.bannedChampions || [])
      .filter((b) => b.championId > 0)
      .map((b) => ({
        champion: champMeta(b.championId)?.id || String(b.championId),
        teamId: b.teamId,
        pickTurn: b.pickTurn,
      }))
      .sort((a, b) => a.pickTurn - b.pickTurn);

    return {
      friend: friendName,
      tag: friendTag,
      gameId: game.gameId,
      queueId: game.gameQueueConfigId,
      mode: game.gameMode,
      startTime: game.gameStartTime,
      length: elapsed,
      championName: me ? champMeta(me.championId)?.id || "" : "",
      teamId: me?.teamId ?? 100,
      platform,
      ddragonVersion: version,
      friendsInGame,
      bans,
      teams: [100, 200].map((teamId) => ({
        teamId,
        participants: participants.filter((p) => p.teamId === teamId),
      })),
    };
  }

  return null;
}

export async function getLiveGame(gameName: string, tagLine: string) {
  const account = await getAccount(gameName, tagLine);
  return getLiveGameByPuuid(account.puuid, account.gameName, account.tagLine);
}

// --- Match detail (full scoreboard) ---

export async function getMatchDetail(matchId: string) {
  const match = await getMatch(matchId);
  const participants = match.info.participants.map((p) => ({
    puuid: p.puuid,
    name: p.riotIdGameName || "",
    tag: p.riotIdTagline || "",
    champion: p.championName,
    teamId: p.teamId,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    gold: p.goldEarned,
    level: p.champLevel,
    win: p.win,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
  }));

  const teams = [100, 200].map((teamId) => {
    const ps = participants.filter((p) => p.teamId === teamId);
    return {
      teamId,
      win: ps[0]?.win ?? false,
      kills: ps.reduce((s, p) => s + p.kills, 0),
      deaths: ps.reduce((s, p) => s + p.deaths, 0),
      assists: ps.reduce((s, p) => s + p.assists, 0),
      gold: ps.reduce((s, p) => s + p.gold, 0),
      participants: ps,
    };
  });

  return {
    id: match.metadata.matchId,
    date: match.info.gameCreation,
    duration: match.info.gameDuration,
    queueId: match.info.queueId,
    mode: match.info.gameMode,
    teams,
  };
}

export type { Match, Participant, RiotAccount, LeagueEntry };
