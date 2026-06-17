import { PredictionDirection } from '@prisma/client';

export type AiMatchContext = {
  id: string;
  stage: string;
  groupName?: string | null;
  matchDate?: string | null;
  kickoffTime?: string | null;
  timezone?: string | null;
  kickoffAt: Date;
  venue?: string | null;
  city?: string | null;
  roundName?: string | null;
  homeTeam: {
    name: string;
    nameEn?: string | null;
    fifaCode: string;
    countryCode?: string | null;
    eloRating?: number | null;
  };
  awayTeam: {
    name: string;
    nameEn?: string | null;
    fifaCode: string;
    countryCode?: string | null;
    eloRating?: number | null;
  };
  historyContext?: {
    matchIntro?: string | null;
    groupIntro?: string | null;
    homeTeamIntro?: string | null;
    awayTeamIntro?: string | null;
    facts: string[];
    ragText: string[];
  };
};

export type AiReportResult = {
  summary: string;
  fullContent: string;
  riskDisclaimer?: string;
  aiAdjustment?: {
    homeWinDelta?: number;
    drawDelta?: number;
    awayWinDelta?: number;
    confidence?: number;
    reason?: string;
  };
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedHome: number;
  predictedAway: number;
  riskIndex: number;
  confidenceIndex: number;
};

export type AiDailyPickResult = AiReportResult & {
  matchId: string;
  recommendationDirection: PredictionDirection;
  freeReason: string;
  memberReason: string;
};
