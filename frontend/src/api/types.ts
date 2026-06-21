export type UserProfile = {
  id: string;
  openId?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  membershipStatus: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'REFUNDED';
  membershipExpireAt?: string | null;
  isMember: boolean;
};

export type LoginResponse = {
  accessToken: string;
  user: UserProfile;
};

export type ChatMessage = {
  id: string;
  nickname: string;
  avatarUrl?: string | null;
  content: string;
  senderType?: 'USER' | 'SYSTEM' | 'TEAM' | string;
  messageType?: 'USER_MESSAGE' | 'TEAM_BLESSING' | string;
  teamName?: string | null;
  teamCode?: string | null;
  flagUrl?: string | null;
  batchKey?: string | null;
  isSpecialBlessing?: boolean;
  createdAt: string;
};

export type SendChatMessageResponse = {
  success: boolean;
  message: ChatMessage | string;
};

export type Team = {
  id: string;
  name: string;
  nameEn?: string | null;
  fifaCode: string;
  countryCode?: string | null;
  groupName?: string | null;
  flagUrl?: string | null;
};

export type TournamentStage =
  | 'GROUP'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

export type Match = {
  id: string;
  stage: TournamentStage;
  groupName?: string | null;
  matchDate?: string | null;
  kickoffTime?: string | null;
  timezone?: string | null;
  kickoffAt: string;
  venue?: string | null;
  city?: string | null;
  roundName?: string | null;
  status: MatchStatus | string;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamId?: string | null;
  homeTeam: Team;
  awayTeam: Team;
  aiReport?: {
    id: string;
    summary: string;
    predictedHome: number;
    predictedAway: number;
    riskIndex: number;
    confidenceIndex: number;
  } | null;
  aiPrediction?: PredictionArchive | null;
};

export type MatchListQuery = {
  date?: string;
  groupName?: string;
  stage?: TournamentStage;
  status?: MatchStatus;
};

export type MatchFilterOptions = {
  dates: string[];
  groups: string[];
  stages: TournamentStage[];
};

export type AiReport = {
  id: string;
  summary: string;
  fullContent: string;
  homeWinProb: string | number;
  drawProb: string | number;
  awayWinProb: string | number;
  predictedHome: number;
  predictedAway: number;
  riskIndex: number;
  confidenceIndex: number;
  locked: boolean;
  unlockHint?: string | null;
  isMember: boolean;
};

export type DailyRecommendation = {
  id: string;
  date?: string | null;
  displayDate?: string | null;
  nextAvailableDate?: string | null;
  source?: 'database' | 'demo' | string;
  title: string;
  intro?: string | null;
  generatedAt?: string | null;
  isMember: boolean;
  matches: Array<{
    id: string;
    recommendationDirection: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    predictedHome: number;
    predictedAway: number;
    homeWinProb: string | number;
    drawProb: string | number;
    awayWinProb: string | number;
    riskIndex: number;
    confidenceIndex: number;
    scoreCandidates?: ScoreCandidate[];
    totalGoalsRange?: string | null;
    overUnderLean?: string | null;
    totalGoalsDistribution?: TotalGoalsDistribution | null;
    freeReason: string;
    memberReason?: string;
    locked: boolean;
    unlockHint?: string | null;
    match: Match;
  }>;
};

export type PredictionArchive = {
  id: string;
  matchId: string;
  status: 'DRAFT' | 'PUBLISHED';
  predictionStage?: 'DRAFT' | 'PUBLISHED' | 'FINAL' | 'LOCKED' | string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  publishedAt?: string | null;
  generatedAt?: string | null;
  lockedAt?: string | null;
  recommendationDirection: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  homeWinProb: string | number;
  drawProb: string | number;
  awayWinProb: string | number;
  homeWinProbability?: string | number;
  drawProbability?: string | number;
  awayWinProbability?: string | number;
  predictedHome: number;
  predictedAway: number;
  predictedScore?: string | null;
  scoreCandidates?: ScoreCandidate[];
  totalGoalsPrediction: number;
  predictedTotalGoals?: number;
  totalGoalsRange?: string | null;
  overUnderLean?: string | null;
  totalGoalsDistribution?: TotalGoalsDistribution | null;
  scoreModelMeta?: ScoreModelMeta | null;
  calibration?: CalibrationParameters | null;
  autoWeighting?: AutoWeightingResult | null;
  oddsSnapshot?: OddsSnapshot | null;
  oddsCalibrationTag?: string | null;
  confidenceIndex: number;
  riskIndex: number;
  confidenceLevel?: string | number | null;
  riskLevel?: string | number | null;
  isHighConfidence?: boolean;
  isCautious?: boolean;
  confidenceTag?: string;
  riskTag?: string;
  modelReadinessTag?: string;
  recommendationReason: string;
  riskTip: string;
  shortAnalysis?: string | null;
  fullAnalysis?: string | null;
  analysisDetails?: string | null;
  scoreCandidateNote?: string | null;
  analysisContext?: MatchAnalysisContext | null;
  disclaimer?: string | null;
  correctionNote?: string | null;
  model: string;
  modelVersion?: string | null;
  promptVersion: string;
  isMemberContent: boolean;
  isPublic: boolean;
  contentHash: string;
  archiveLabel?: string;
  resultStatus?: 'SETTLED' | 'PENDING_RESULT';
  resultText?: string;
  match?: Match;
  settlement?: {
    homeScore: number;
    awayScore: number;
    resultDirection: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    hitResult: boolean;
    hitScore: boolean;
    hitTotalGoals: boolean;
    hitUnbeaten?: boolean;
    hitScoreCandidate?: boolean;
    hitScoreReference?: boolean;
    settledAt: string;
  } | null;
  corrections?: Array<{
    id: string;
    correctionNote: string;
    createdAt: string;
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

export type TeamAnalysisProfile = {
  tags: string[];
  strengths: string[];
  risks: string[];
  styleSummary: string;
};

export type MatchAnalysisContext = {
  homeProfile: TeamAnalysisProfile;
  awayProfile: TeamAnalysisProfile;
  tempoLean: string;
  strongSideEdge: string;
  underdogThreat: string;
  mainRisk: string;
  directionExplanation: string;
  scoreExplanation: string;
};

export type TotalGoalsDistribution = {
  low: number;
  medium: number;
  high: number;
  selectedRange: string;
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

export type OddsSnapshot = {
  provider?: string;
  capturedAt?: string;
  current?: {
    homeWinOdds: number;
    drawOdds: number;
    awayWinOdds: number;
  };
  opening?: {
    homeWinOdds?: number;
    drawOdds?: number;
    awayWinOdds?: number;
  };
  impliedProbability?: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  normalizedProbability?: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
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

export type PredictionArchiveResponse = {
  source?: 'database' | 'demo';
  date?: string;
  predictions: PredictionArchive[];
};

export type PredictionStats = {
  source?: 'database' | 'demo';
  totalPredictions: number;
  settledPredictions: number;
  archivedMatchCount?: number;
  last7DaysHitRate: number;
  last30MatchesHitRate: number;
  resultHitRate: number;
  unbeatenHitRate?: number;
  scoreHitRate: number;
  scoreCandidateHitRate?: number;
  scoreReferenceHitRate?: number;
  highConfidenceHitRate?: number;
  highConfidenceSettledCount?: number;
  totalGoalsHitRate: number;
  totalGoalsRangeHitRate?: number;
  currentHitStreak: number;
  bestHitStreak: number;
  highConfidenceStats?: PredictionSegmentStats;
  cautiousStats?: PredictionSegmentStats;
  backtest?: {
    generatedAt: string;
    totalSettled: number;
    last30Count: number;
    resultHitRate: number;
    scoreHitRate: number;
    scoreCandidateHitRate?: number;
    totalGoalsHitRate: number;
    totalGoalsRangeHitRate?: number;
    oddsReliability?: {
      count: number;
      oddsHitRate: number;
      modelHitRate: number;
      oddsMoreReliable: boolean;
      modelMoreReliable: boolean;
    };
    last30ResultHitRate: number;
    highConfidence: PredictionSegmentStats;
    cautious: PredictionSegmentStats;
    brierScore: number;
    recentMisses: Array<Record<string, unknown>>;
  };
  recentPredictions: PredictionArchive[];
};

export type PredictionSegmentStats = {
  count: number;
  resultHitRate: number;
  scoreHitRate: number;
  scoreCandidateHitRate?: number;
};

export type InviteStatus = {
  inviteCode: string;
  inviterId?: string | null;
  invitedCount: number;
  invitedPaidCount: number;
};

export type CloudHomeData = {
  date: string;
  isMember: boolean;
  predictions: PredictionArchive[];
  matches: Match[];
  stats: PredictionStats;
  membership: MembershipStatus;
  invite: InviteStatus;
};

export type AdminGeneratePredictionsResult = {
  date: string;
  matchCount: number;
  generatedCount: number;
  skippedCount: number;
  generatedIds: string[];
};

export type AdminPublishPredictionsResult = {
  date: string;
  publishedCount: number;
  skippedCount: number;
};

export type AdminSyncMatchResult = {
  matchId: string;
  provider: 'MANUAL_ADMIN';
  syncStatus: 'SUCCESS' | 'FAILED';
  rawPayload: {
    homeScore: number;
    awayScore: number;
    status: string;
  };
  syncedAt: string;
  errorMessage: string;
  retryCount: number;
  settlement: {
    settledCount: number;
    skippedCount: number;
  };
};

export type AdminInviteStats = {
  totalInvitedCount: number;
  totalInvitedPaidCount: number;
  rows: Array<{
    userId: string;
    inviteCode: string;
    invitedCount: number;
    invitedPaidCount: number;
  }>;
};

export type MissingPredictionCheckResult = {
  scope: 'MATCH' | 'DATE';
  results: Array<{
    status: 'EXISTS' | 'GENERATED' | 'NOT_INCLUDED' | string;
    matchId: string;
    reason?: string;
    prediction?: PredictionArchive;
  }>;
};

export type MembershipStatus = {
  userId: string;
  membershipStatus: UserProfile['membershipStatus'];
  membershipExpireAt?: string | null;
  isMember: boolean;
  benefits: string[];
};

export type MembershipPlan = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  durationDays: number;
  benefits: string[];
};

export type MembershipPaymentOrder = {
  order: {
    id: string;
    orderNo: string;
    amountCents: number;
    status: 'PENDING' | 'PAID' | 'CLOSED' | 'FAILED' | 'REFUNDED';
    paidAt?: string | null;
  };
  payParams: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  };
  mock: boolean;
};

export type MembershipOrderStatus = {
  id: string;
  orderNo: string;
  amountCents: number;
  status: MembershipPaymentOrder['order']['status'];
  paidAt?: string | null;
  createdAt: string;
  plan: {
    name: string;
    durationDays: number;
  };
};

export type ChallengeHome = {
  season: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  } | null;
  myScore: {
    points: number;
    title?: string | null;
    rank?: number | null;
  } | null;
};

export type MyChallengeScore = {
  season: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
  score: {
    points: number;
    title?: string | null;
    rank?: number | null;
  };
};

export type LeaderboardItem = {
  id: string;
  points: number;
  title?: string | null;
  rank?: number | null;
  user: {
    id: string;
    nickname?: string | null;
    avatarUrl?: string | null;
  };
};
