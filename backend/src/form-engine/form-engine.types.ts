export type FormMatchResult = {
  teamId: string;
  opponentTeamId?: string;
  playedAt: Date;
  goalsFor: number;
  goalsAgainst: number;
  isHome?: boolean;
};

export type FormMetrics = {
  sampleSize: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageGoalsFor: number;
  averageGoalsAgainst: number;
  goalDifference: number;
  averageGoalDifference: number;
  formScore: number;
};

export type TeamFormSummary = {
  teamId: string;
  recent5: FormMetrics;
  recent10: FormMetrics;
};
