import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus } from '@prisma/client';
import {
  ExternalMatchResult,
  ExternalPreMatchContext,
  FootballDataProvider,
  FootballDataSourceCode,
} from '../football-data.types';
import { BaseFootballDataProvider } from './base-football-data.provider';

type SportmonksFixture = {
  id?: number;
  starting_at?: string;
  state?: {
    short_name?: string;
    name?: string;
  };
  participants?: Array<{
    id?: number;
    name?: string;
    short_code?: string;
    meta?: {
      location?: 'home' | 'away';
      winner?: boolean;
    };
  }>;
  scores?: Array<{
    score?: {
      goals?: number;
      participant?: 'home' | 'away';
    };
    description?: string;
  }>;
};

type SportmonksResponse = {
  data?: SportmonksFixture[] | SportmonksFixture;
};

@Injectable()
export class SportmonksProvider
  extends BaseFootballDataProvider
  implements FootballDataProvider
{
  readonly code: FootballDataSourceCode = 'SPORTMONKS';
  readonly priority: number;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly worldCupLeagueId?: string;
  private readonly seasonId?: string;

  constructor(configService: ConfigService) {
    super(configService);
    this.priority = configService.get<number>('SPORTMONKS_PRIORITY', 200);
    this.baseUrl = configService.get<string>(
      'SPORTMONKS_BASE_URL',
      'https://api.sportmonks.com/v3/football',
    );
    this.apiKey = configService.get<string>('SPORTMONKS_API_KEY');
    this.worldCupLeagueId = configService.get<string>('SPORTMONKS_WORLD_CUP_LEAGUE_ID');
    this.seasonId = configService.get<string>('SPORTMONKS_SEASON_ID');
  }

  isEnabled() {
    return Boolean(this.apiKey && (this.worldCupLeagueId || this.seasonId));
  }

  health() {
    return {
      code: this.code,
      enabled: this.isEnabled(),
      priority: this.priority,
    };
  }

  getTodayMatches() {
    return this.getMatchesByDate(this.toDateOnly());
  }

  getMatchesByDate(date: string) {
    return this.getMatchesByDateInternal(date);
  }

  async getMatchResult(externalMatchId: string) {
    if (!this.isEnabled()) {
      throw new Error('SPORTMONKS provider is not configured');
    }

    const url = `${this.baseUrl}/fixtures/${externalMatchId}?${this.commonParams()}`;
    const data = await this.requestJson<SportmonksResponse>(
      url,
      { method: 'GET' },
      this.requestConfig('SPORTMONKS'),
    );
    const fixture = Array.isArray(data.data) ? data.data[0] : data.data;
    return fixture ? this.mapFixture(fixture) : null;
  }

  getLiveMatches() {
    return this.getMatchesByQuery({ filter: 'live' });
  }

  getFinishedMatches(date: string) {
    return this.getMatchesByDateInternal(date, true);
  }

  async getPreMatchContext(externalMatchId: string): Promise<ExternalPreMatchContext | null> {
    const result = await this.getMatchResult(externalMatchId);
    if (!result) return null;

    return {
      provider: this.code,
      externalMatchId,
      homeTeam: result.homeTeam,
      awayTeam: result.awayTeam,
      homeForm: null,
      awayForm: null,
      lineups: null,
      odds: null,
      rawPayload: {
        fixture: result.rawPayload,
        note: 'Sportmonks pre-match statistics mapping can be enabled after confirming include fields for the chosen plan.',
      },
    };
  }

  private getMatchesByDateInternal(date: string, finishedOnly = false) {
    return this.getMatchesByQuery({
      'filter[starts_between]': `${date},${date}`,
      ...(finishedOnly ? { 'filter[state]': 'FT,AET,PEN' } : {}),
    });
  }

  private async getMatchesByQuery(query: Record<string, string>) {
    if (!this.isEnabled()) {
      throw new Error('SPORTMONKS provider is not configured');
    }

    const params = new URLSearchParams({
      ...Object.fromEntries(new URLSearchParams(this.commonParams())),
      ...query,
    });
    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.requestJson<SportmonksResponse>(
      url,
      { method: 'GET' },
      this.requestConfig('SPORTMONKS'),
    );
    const rows = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];

    return rows.map((fixture) => this.mapFixture(fixture));
  }

  private commonParams() {
    const params = new URLSearchParams({
      api_token: this.apiKey || '',
      include: 'participants;scores;state',
    });

    if (this.seasonId) {
      params.set('filter[seasonIds]', this.seasonId);
    } else if (this.worldCupLeagueId) {
      params.set('filter[leagueIds]', this.worldCupLeagueId);
    }

    return params.toString();
  }

  private mapFixture(fixture: SportmonksFixture): ExternalMatchResult {
    const home = this.participant(fixture, 'home');
    const away = this.participant(fixture, 'away');
    const homeScore = this.score(fixture, 'home');
    const awayScore = this.score(fixture, 'away');
    const status = this.mapStatus(fixture.state?.short_name);

    return {
      provider: this.code,
      externalMatchId: String(fixture.id || ''),
      homeTeam: {
        externalId: home?.id ? String(home.id) : null,
        name: home?.name || 'Home Team',
        fifaCode: home?.short_code || null,
      },
      awayTeam: {
        externalId: away?.id ? String(away.id) : null,
        name: away?.name || 'Away Team',
        fifaCode: away?.short_code || null,
      },
      kickoffAt: fixture.starting_at || null,
      status,
      homeScore,
      awayScore,
      resultDirection: this.direction(homeScore, awayScore),
      winnerExternalTeamId: this.winnerExternalTeamId(fixture),
      isFinal: this.isFinalStatus(status),
      rawPayload: fixture,
    };
  }

  private participant(fixture: SportmonksFixture, location: 'home' | 'away') {
    return fixture.participants?.find(
      (participant) => participant.meta?.location === location,
    );
  }

  private score(fixture: SportmonksFixture, location: 'home' | 'away') {
    const score = fixture.scores?.find(
      (item) =>
        item.score?.participant === location &&
        (item.description === 'CURRENT' || item.description === 'FT'),
    );

    return score?.score?.goals ?? null;
  }

  private winnerExternalTeamId(fixture: SportmonksFixture) {
    const winner = fixture.participants?.find((item) => item.meta?.winner);
    return winner?.id ? String(winner.id) : null;
  }

  private mapStatus(status?: string) {
    const finished = new Set(['FT', 'AET', 'PEN']);
    const live = new Set(['LIVE', 'HT', '1ST', '2ND', 'ET']);
    const postponed = new Set(['POSTP', 'SUSP']);
    const cancelled = new Set(['CANC', 'ABD']);

    if (status && finished.has(status)) {
      return MatchStatus.FINISHED;
    }

    if (status && live.has(status)) {
      return MatchStatus.LIVE;
    }

    if (status && postponed.has(status)) {
      return MatchStatus.POSTPONED;
    }

    if (status && cancelled.has(status)) {
      return MatchStatus.CANCELLED;
    }

    return MatchStatus.SCHEDULED;
  }
}
