export type EloMatchInput = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeRating: number;
  awayRating: number;
  homeScore: number;
  awayScore: number;
  kFactor?: number;
};

export type EloSideResult = {
  teamId: string;
  opponentTeamId: string;
  isHome: boolean;
  scoreFor: number;
  scoreAgainst: number;
  result: number;
  oldRating: number;
  newRating: number;
  ratingDelta: number;
  kFactor: number;
  expectedScore: number;
};

export type EloMatchResult = {
  matchId: string;
  home: EloSideResult;
  away: EloSideResult;
};
