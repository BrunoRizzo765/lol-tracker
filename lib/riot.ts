const API_KEY = process.env.RIOT_API_KEY;
const PLATFORM = process.env.RIOT_REGION || "la1";
const REGIONAL = process.env.RIOT_REGIONAL || "americas";

if (!API_KEY) console.warn("RIOT_API_KEY is not configured.");

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
  if (!API_KEY || API_KEY === "RGAPI-REPLACE_ME") throw new Error("Missing RIOT_API_KEY");
  const response = await fetch(`${base}${path}`, {
    headers: { "X-Riot-Token": API_KEY },
    next: { revalidate },
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

export async function getMatchIds(puuid: string, count = 10) {
  return riotFetch<MatchList>(
    `https://${REGIONAL}.api.riotgames.com`,
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`,
    120,
  );
}

export async function getMatch(matchId: string) {
  return riotFetch<Match>(
    `https://${REGIONAL}.api.riotgames.com`,
    `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
    3600,
  );
}

export async function getRankedEntries(puuid: string) {
  return riotFetch<LeagueEntry[]>(
    `https://${PLATFORM}.api.riotgames.com`,
    `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    600,
  );
}

export async function getFriendMatches(gameName: string, tagLine: string, count = 8) {
  const account = await getAccount(gameName, tagLine);
  const [ids, ranked] = await Promise.all([
    getMatchIds(account.puuid, count),
    getRankedEntries(account.puuid).catch(() => [] as LeagueEntry[]),
  ]);
  const matches = await Promise.all(ids.map((id) => getMatch(id)));
  return { account, matches, ranked };
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
    entries[0]
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

export async function getLiveGame(gameName: string, tagLine: string) {
  const account = await getAccount(gameName, tagLine);
  let game: CurrentGame;
  try {
    game = await riotFetch<CurrentGame>(
      `https://${PLATFORM}.api.riotgames.com`,
      `/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(account.puuid)}`,
      20,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "RIOT_NOT_FOUND") return null; // not currently in a game
    throw error;
  }

  const champions = await getChampionsById().catch(() => new Map<number, { id: string; name: string }>());
  const champName = (id: number) => champions.get(id)?.id ?? String(id);
  const me = game.participants.find((p) => p.puuid === account.puuid);

  return {
    friend: account.gameName,
    tag: account.tagLine,
    gameId: game.gameId,
    queueId: game.gameQueueConfigId,
    mode: game.gameMode,
    startTime: game.gameStartTime,
    length: game.gameLength,
    championName: me ? champName(me.championId) : "",
    teamId: me?.teamId ?? 100,
    participants: game.participants.map((p) => ({
      puuid: p.puuid,
      name: p.riotId || p.summonerName || "Invocador",
      championName: champName(p.championId),
      teamId: p.teamId,
      isFriend: p.puuid === account.puuid,
    })),
    bannedChampions: game.bannedChampions
      .filter((b) => b.championId > 0)
      .map((b) => ({ championName: champName(b.championId), teamId: b.teamId })),
  };
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
