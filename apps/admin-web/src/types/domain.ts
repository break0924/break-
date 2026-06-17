export type TeamItem = {
  id: string;
  fifaCode?: string;
  name: string;
  nameEn?: string;
  groupName?: string;
  flagUrl?: string;
};

export type TeamForm = {
  fifaCode?: string;
  name: string;
  nameEn?: string;
  groupName?: string;
  flagUrl?: string;
};

export type MatchItem = {
  id: string;
  matchNo: string;
  stage: string;
  groupName?: string;
  kickoffAt: string;
  venue?: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  resultNote?: string;
  homeTeam: TeamItem;
  awayTeam: TeamItem;
};

export type MatchForm = {
  matchNo: string;
  stage: string;
  groupName?: string;
  kickoffAt: string;
  venue?: string;
  homeTeamId: string;
  awayTeamId: string;
};

export type UpdateResultForm = {
  homeScore: number;
  awayScore: number;
  resultNote?: string;
};

export type OddsForm = {
  market: string;
  selection: string;
  odds: string;
  source?: string;
};

export type AiAnalysis = {
  id: string;
  matchId: string;
  status: string;
  title?: string;
  summary: string;
  tacticalNotes?: string;
  injuryNotes?: string;
  riskLevel: string;
  confidence?: string;
  reviewerNote?: string;
  publishedAt?: string;
};
