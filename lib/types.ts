export type Match = {
  id: string;
  date: number;
  duration: number;
  queueId: number;
  mode: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  cs: number;
  level: number;
  gold: number;
  friend?: string;
};

export type Rank = {
  queue: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type LiveParticipant = {
  puuid: string;
  name: string;
  tag: string;
  champion: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  spell1Image: string;
  spell2Image: string;
  isFriend: boolean;
};

export type LiveBan = {
  champion: string;
  teamId: number;
  pickTurn: number;
};

export type LiveGame = {
  friend: string;
  tag: string;
  gameId: number;
  queueId: number;
  mode: string;
  startTime: number;
  length: number;
  championName: string;
  teamId: number;
  platform?: string;
  ddragonVersion?: string | null;
  friendsInGame: string[];
  bans: LiveBan[];
  teams: {
    teamId: number;
    participants: LiveParticipant[];
  }[];
};

export type Friend = {
  id: string;
  dbId?: number;
  name: string;
  tag: string;
  solo: Rank | null;
  flex: Rank | null;
  /** Prefer Solo, else Flex — used for ladder sorting. */
  rank: Rank | null;
  matches: Match[];
  live: LiveGame | null;
  syncedOldest?: number | null;
  syncedNewest?: number | null;
  lastSyncAt?: string | null;
  rankError?: string | null;
  error?: string;
};

export type MatchDetailParticipant = {
  puuid: string;
  name: string;
  tag: string;
  champion: string;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  level: number;
  win: boolean;
  items: number[];
};

export type MatchDetailTeam = {
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  participants: MatchDetailParticipant[];
};

export type MatchDetail = {
  id: string;
  date: number;
  duration: number;
  queueId: number;
  mode: string;
  teams: MatchDetailTeam[];
  ddragonVersion?: string | null;
};

export type LadderEntry = {
  name: string;
  tag: string;
  solo: Rank | null;
  flex: Rank | null;
  rank: Rank | null;
  live: boolean;
  lastMatchAt: number | null;
  score: number;
};

export type Dashboard = {
  friends: Friend[];
  recent: Match[];
  matchTotal: number;
  hasMoreMatches: boolean;
  live: LiveGame[];
  ladder: LadderEntry[];
  /** Data Dragon version used for champion/item icons on the client. */
  ddragonVersion?: string | null;
  /** Present when the server is serving sample data because config is missing. */
  demo?: { reason: string } | null;
};
