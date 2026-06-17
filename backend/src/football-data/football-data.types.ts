import { MatchStatus, PredictionDirection } from '@prisma/client';

export type FootballDataSourceCode = 'API_FOOTBALL' | 'SPORTMONKS' | 'MANUAL';

export type ExternalFootballTeam = {
  externalId?: string | null;
  name: string;
  nameEn?: string | null;
  fifaCode?: string | null;
};

export type ExternalMatchResult = {
  provider: FootballDataSourceCode;
  externalMatchId: string;
  matchId?: string | null;
  homeTeam: ExternalFootballTeam;
  awayTeam: ExternalFootballTeam;
  kickoffAt?: string | null;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  resultDirection?: PredictionDirection | null;
  winnerExternalTeamId?: string | null;
  isFinal: boolean;
  rawPayload: unknown;
};

export type FootballDataProviderRequestOptions = {
  date?: string;
  externalMatchId?: string;
};

export type FootballDataProviderHealth = {
  code: FootballDataSourceCode;
  enabled: boolean;
  priority: number;
};

export type ExternalTeamForm = {
  externalTeamId?: string | null;
  played?: number | null;
  wins?: number | null;
  draws?: number | null;
  losses?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  cleanSheets?: number | null;
  form?: string | null;
  rawPayload?: unknown;
};

export type ExternalLineupPlayer = {
  externalPlayerId?: string | null;
  name: string;
  position?: string | null;
  reason?: string | null;
};

export type ExternalLineupStatus = {
  confirmed: boolean;
  homeMissingPlayers: ExternalLineupPlayer[];
  awayMissingPlayers: ExternalLineupPlayer[];
  homeStartingPlayers?: ExternalLineupPlayer[];
  awayStartingPlayers?: ExternalLineupPlayer[];
  rawPayload?: unknown;
};

export type ExternalOddsSnapshot = {
  provider: FootballDataSourceCode;
  externalMatchId: string;
  capturedAt: string;
  homeWinOdds?: number | null;
  drawOdds?: number | null;
  awayWinOdds?: number | null;
  normalizedHomeProbability?: number | null;
  normalizedDrawProbability?: number | null;
  normalizedAwayProbability?: number | null;
  asianHandicapLine?: string | null;
  overUnderLine?: number | null;
  rawPayload?: unknown;
};

export type ExternalPreMatchContext = {
  provider: FootballDataSourceCode;
  externalMatchId: string;
  homeTeam: ExternalFootballTeam;
  awayTeam: ExternalFootballTeam;
  homeForm?: ExternalTeamForm | null;
  awayForm?: ExternalTeamForm | null;
  lineups?: ExternalLineupStatus | null;
  odds?: ExternalOddsSnapshot | null;
  rawPayload: unknown;
};

export interface FootballDataProvider {
  readonly code: FootballDataSourceCode;
  readonly priority: number;
  isEnabled(): boolean;
  getTodayMatches(): Promise<ExternalMatchResult[]>;
  getMatchesByDate(date: string): Promise<ExternalMatchResult[]>;
  getMatchResult(externalMatchId: string): Promise<ExternalMatchResult | null>;
  getLiveMatches(): Promise<ExternalMatchResult[]>;
  getFinishedMatches(date: string): Promise<ExternalMatchResult[]>;
  getPreMatchContext(externalMatchId: string): Promise<ExternalPreMatchContext | null>;
  health(): FootballDataProviderHealth;
}

export type ProviderRequestConfig = {
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
};
