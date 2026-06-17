export type ProbabilityTriplet = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type PredictionEngineOutput = {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  recommendationDirection: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  recommendedScore: {
    home: number;
    away: number;
    text: string;
  };
  scoreCandidates: ScoreCandidate[];
  totalGoalsRange: TotalGoalsRange;
  overUnderLean: OverUnderLean;
  totalGoalsDistribution: TotalGoalsDistribution;
  scoreModelMeta?: ScoreModelMeta;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  riskScore: number;
  confidenceBreakdown: ScoreBreakdown;
  riskBreakdown: ScoreBreakdown;
  total: 100;
  modelVersion: string;
  calibration?: CalibrationParameters;
  autoWeighting?: AutoWeightingResult;
  factors: FactorContribution[];
  warnings: string[];
};

export type ScoreBreakdown = {
  score: number;
  parts: Array<{
    key: string;
    label: string;
    value: number;
    reason: string;
  }>;
};

export type ScoreCandidate = {
  home: number;
  away: number;
  text: string;
  probability: number;
  totalGoals: number;
  rank: number;
};

export type TotalGoalsRange = '0-1球' | '2-3球' | '4球以上';

export type OverUnderLean = '偏小' | '均衡' | '偏大';

export type TotalGoalsDistribution = {
  low: number;
  medium: number;
  high: number;
  selectedRange: TotalGoalsRange;
};

export type ScoreModelMeta = {
  dixonColesRho: number;
  lowScoreCorrectionApplied: boolean;
  styleGoalMultiplier: number;
  adjustedHomeExpectedGoals: number;
  adjustedAwayExpectedGoals: number;
};

export type CalibrationParameters = {
  modelBlendWeight?: number;
  oddsBlendWeight?: number;
  dixonColesRho?: number;
  styleGoalMultiplier?: number;
  highConfidenceScoreMin?: number;
  highConfidenceRiskMax?: number;
  cautiousRiskThreshold?: number;
};

export type AutoWeightingResult = {
  modelWeight: number;
  oddsWeight: number;
  oddsReliability: 'LOW' | 'MEDIUM' | 'HIGH';
  modelReliability: 'LOW' | 'MEDIUM' | 'HIGH';
  cautiousRecommended: boolean;
  reason: string;
};

export type FactorContribution = {
  key: PredictionFactorKey;
  label: string;
  weight: number;
  available: boolean;
  probability: ProbabilityTriplet;
  weightedEvidence: ProbabilityTriplet;
  reason: string;
};

export type PredictionFactorKey =
  | 'elo'
  | 'form'
  | 'recent5'
  | 'recent10'
  | 'headToHead'
  | 'venue'
  | 'worldRanking'
  | 'goals'
  | 'attack'
  | 'defense'
  | 'injuries'
  | 'odds'
  | 'aiAdjustment';

export type TeamFormMetrics = {
  sampleSize?: number;
  matchesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  winRate?: number;
  averageGoalsFor?: number;
  averageGoalsAgainst?: number;
  goalDifference?: number;
  averageGoalDifference?: number;
  formScore?: number;
};

export type TeamPredictionMetrics = {
  teamId?: string;
  name: string;
  eloRating?: number;
  worldRanking?: number;
  recent5?: TeamFormMetrics;
  recent10?: TeamFormMetrics;
  attackIndex?: number;
  defenseIndex?: number;
  injuryImpact?: number;
  lineupStability?: number;
  motivationScore?: number;
  travelFatigue?: number;
  tempoIndex?: number;
  directnessIndex?: number;
  defensiveLineRisk?: number;
  setPieceStrength?: number;
};

export type HeadToHeadMetrics = {
  matches?: number;
  matchesPlayed?: number;
  sampleSize?: number;
  homeWins?: number;
  draws?: number;
  awayWins?: number;
  homeGoals?: number;
  awayGoals?: number;
  homeWinRate?: number;
  drawRate?: number;
  awayWinRate?: number;
  h2hScore?: number;
};

export type AiAdjustmentMetrics = {
  homeWinDelta?: number;
  drawDelta?: number;
  awayWinDelta?: number;
  confidence?: number;
  reason?: string;
};

export type OddsSnapshotMetrics = {
  provider?: string;
  capturedAt?: string;
  current: {
    homeWinOdds: number;
    drawOdds: number;
    awayWinOdds: number;
  };
  opening?: {
    homeWinOdds?: number;
    drawOdds?: number;
    awayWinOdds?: number;
  };
  impliedProbability: ProbabilityTriplet;
  normalizedProbability: ProbabilityTriplet;
  movement?: {
    homeWinDelta?: number;
    drawDelta?: number;
    awayWinDelta?: number;
  };
  asianHandicap?: {
    line?: string;
    homeOdds?: number;
    awayOdds?: number;
  };
  overUnder?: {
    line?: number;
    overOdds?: number;
    underOdds?: number;
  };
};

export type PredictionEngineInput = {
  matchId?: string;
  homeTeam: TeamPredictionMetrics;
  awayTeam: TeamPredictionMetrics;
  neutralVenue?: boolean;
  headToHead?: HeadToHeadMetrics;
  oddsSnapshot?: OddsSnapshotMetrics;
  weatherImpact?: number;
  preMatchContext?: {
    dataUpdatedAt?: string | null;
    homeLineupStatus?: unknown;
    awayLineupStatus?: unknown;
    homeInjuryNotes?: unknown;
    awayInjuryNotes?: unknown;
    weatherSnapshot?: unknown;
    travelSnapshot?: unknown;
  };
  aiAdjustment?: AiAdjustmentMetrics;
  calibration?: CalibrationParameters;
  factorWeights?: Partial<Record<PredictionFactorKey, number>>;
};

export type FactorInput = PredictionEngineInput & {
  weight: number;
};

export interface PredictionFactor {
  key: PredictionFactorKey;
  label: string;
  defaultWeight: number;
  evaluate(input: FactorInput): FactorContribution;
}
