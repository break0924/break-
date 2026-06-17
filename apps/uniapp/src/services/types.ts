export type Team = {
  id: string;
  name: string;
  nameEn?: string;
  flagUrl?: string;
};

export type OddsSnapshot = {
  id: string;
  market: string;
  selection: string;
  odds: string;
  isLatest: boolean;
};

export type AiAnalysis = {
  id: string;
  title?: string;
  summary: string;
  tacticalNotes?: string;
  injuryNotes?: string;
  riskLevel: string;
  confidence?: string;
  publishedAt?: string;
};

export type MatchItem = {
  id: string;
  matchNo: string;
  stage: string;
  groupName?: string;
  kickoffAt: string;
  venue?: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  homeTeam: Team;
  awayTeam: Team;
  oddsSnapshots?: OddsSnapshot[];
  aiAnalyses?: AiAnalysis[];
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
