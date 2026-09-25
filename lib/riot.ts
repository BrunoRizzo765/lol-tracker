const API_KEY = process.env.RIOT_API_KEY;
const PLATFORM = process.env.RIOT_REGION || "la1";
const REGIONAL = process.env.RIOT_REGIONAL || "americas";

if (!API_KEY) console.warn("RIOT_API_KEY is not configured.");

type RiotAccount = { puuid: string; gameName: string; tagLine: string };
type MatchList = string[];

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

export async function getFriendMatches(gameName: string, tagLine: string, count = 8) {
  const account = await getAccount(gameName, tagLine);
  const ids = await getMatchIds(account.puuid, count);
  const matches = await Promise.all(ids.map((id) => getMatch(id)));
  return { account, matches };
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

export type { Match, Participant, RiotAccount };
