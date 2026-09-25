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
  hotStreak: boolean;
};

export type Friend = {
  id: string;
  name: string;
  tag: string;
  rank: Rank | null;
  matches: Match[];
  error?: string;
};

export type LadderEntry = { name: string; tag: string; rank: Rank | null; score: number };

export type RankingEntry = { name: string; tag: string; games: number; wins: number; losses: number; winRate: number; kda: number };

export type Dashboard = {
  friends: Friend[];
  recent: Match[];
  ranking: RankingEntry[];
  ladder: LadderEntry[];
};
