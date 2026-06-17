export type HeadToHeadMatchResult = {
  matchId?: string;
  playedAt: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export type HeadToHeadMetrics = {
  homeTeamId: string;
  awayTeamId: string;
  sampleSize: number;
  matchesPlayed: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinRate: number;
  drawRate: number;
  awayWinRate: number;
  h2hScore: number;
};
