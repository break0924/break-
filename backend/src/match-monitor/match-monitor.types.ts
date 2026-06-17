import { MatchStatus, TournamentStage } from '@prisma/client';

export type MatchMonitorEventType =
  | 'match.status.changed'
  | 'match.settlement.updated'
  | 'match.result.corrected';

export type MatchMonitorPayload = {
  matchId: string;
  previousStatus?: MatchStatus | null;
  status: MatchStatus;
  stage?: TournamentStage;
  groupName?: string | null;
  kickoffAt?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: {
    id: string;
    name: string;
    fifaCode: string;
    flagUrl?: string | null;
  };
  awayTeam?: {
    id: string;
    name: string;
    fifaCode: string;
    flagUrl?: string | null;
  };
  settlement?: {
    predictionSettled?: boolean;
    challengeSettled?: boolean;
  };
  syncedAt: string;
};

export type MatchMonitorMessage = {
  type: MatchMonitorEventType;
  payload: MatchMonitorPayload;
};
