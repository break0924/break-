import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus } from '@prisma/client';
import {
  ExternalMatchResult,
  ExternalOddsSnapshot,
  ExternalPreMatchContext,
  ExternalTeamForm,
  FootballDataProvider,
  FootballDataSourceCode,
} from '../football-data.types';
import { BaseFootballDataProvider } from './base-football-data.provider';

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
    };
  };
  teams?: {
    home?: { id?: number; name?: string; code?: string; winner?: boolean };
    away?: { id?: number; name?: string; code?: string; winner?: boolean };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

type ApiFootballResponse = {
  response?: ApiFootballFixture[];
};

type ApiFootballGenericResponse<T> = {
  response?: T[];
};

type ApiFootballTeamStatistics = {
  fixtures?: {
    played?: { total?: number };
    wins?: { total?: number };
    draws?: { total?: number };
    loses?: { total?: number };
  };
  goals?: {
    for?: { total?: { total?: number } };
    against?: { total?: { total?: number } };
  };
  clean_sheet?: { total?: number };
  form?: string;
};

type ApiFootballLineup = {
  team?: { id?: number; name?: string };
  startXI?: Array<{ player?: { id?: number; name?: string; pos?: string } }>;
};

type ApiFootballInjury = {
  team?: { id?: number; name?: string };
  player?: { id?: number; name?: string };
  type?: string;
  reason?: string;
};

type ApiFootballOdds = {
  fixture?: { id?: number };
  bookmakers?: Array<{
    bets?: Array<{
      name?: string;
      values?: Array<{ value?: string; odd?: string }>;
    }>;
  }>;
};

@Injectable()
export class ApiFootballProvider
  extends BaseFootballDataProvider
  implements FootballDataProvider
{
  readonly code: FootballDataSourceCode = 'API_FOOTBALL';
  readonly priority: number;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly leagueId?: string;
  private readonly season: string;

  constructor(configService: ConfigService) {
    super(configService);
    this.priority = configService.get<number>('API_FOOTBALL_PRIORITY', 100);
    this.baseUrl = configService.get<string>(
      'API_FOOTBALL_BASE_URL',
      'https://v3.football.api-sports.io',
    );
    this.apiKey = configService.get<string>('API_FOOTBALL_KEY');
    this.leagueId = configService.get<string>('API_FOOTBALL_WORLD_CUP_LEAGUE_ID');
    this.season = configService.get<string>('API_FOOTBALL_SEASON', '2026');
  }

  isEnabled() {
    return Boolean(this.apiKey && this.leagueId);
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
    return this.getMatchesByQuery({ date });
  }

  async getMatchResult(externalMatchId: string) {
    const matches = await this.getMatchesByQuery({ id: externalMatchId });
    return matches[0] || null;
  }

  getLiveMatches() {
    return this.getMatchesByQuery({ live: 'all' });
  }

  getFinishedMatches(date: string) {
    return this.getMatchesByQuery({ date, status: 'FT-AET-PEN' });
  }

  async getPreMatchContext(externalMatchId: string): Promise<ExternalPreMatchContext | null> {
    const fixture = await this.getApiFixture(externalMatchId);
    if (!fixture) return null;

    const homeExternalId = fixture.teams?.home?.id ? String(fixture.teams.home.id) : null;
    const awayExternalId = fixture.teams?.away?.id ? String(fixture.teams.away.id) : null;
    const [homeForm, awayForm, lineups, odds] = await Promise.all([
      homeExternalId ? this.getTeamStatistics(homeExternalId) : Promise.resolve(null),
      awayExternalId ? this.getTeamStatistics(awayExternalId) : Promise.resolve(null),
      this.getLineupStatus(externalMatchId, homeExternalId, awayExternalId),
      this.getOddsSnapshot(externalMatchId),
    ]);

    return {
      provider: this.code,
      externalMatchId,
      homeTeam: {
        externalId: homeExternalId,
        name: fixture.teams?.home?.name || 'Home Team',
        fifaCode: fixture.teams?.home?.code || null,
      },
      awayTeam: {
        externalId: awayExternalId,
        name: fixture.teams?.away?.name || 'Away Team',
        fifaCode: fixture.teams?.away?.code || null,
      },
      homeForm,
      awayForm,
      lineups,
      odds,
      rawPayload: { fixture, homeForm, awayForm, lineups, odds },
    };
  }

  private async getMatchesByQuery(query: Record<string, string>) {
    if (!this.isEnabled()) {
      throw new Error('API_FOOTBALL provider is not configured');
    }

    const params = new URLSearchParams({
      season: this.season,
      league: this.leagueId!,
      ...query,
    });
    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.requestJson<ApiFootballResponse>(
      url,
      {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey!,
        },
      },
      this.requestConfig('API_FOOTBALL'),
    );

    return (data.response || []).map((fixture) => this.mapFixture(fixture));
  }

  private async getApiFixture(externalMatchId: string) {
    if (!this.isEnabled()) {
      throw new Error('API_FOOTBALL provider is not configured');
    }

    const params = new URLSearchParams({
      id: externalMatchId,
    });
    const url = `${this.baseUrl}/fixtures?${params.toString()}`;
    const data = await this.requestJson<ApiFootballResponse>(
      url,
      {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey!,
        },
      },
      this.requestConfig('API_FOOTBALL'),
    );

    return data.response?.[0] || null;
  }

  private async getTeamStatistics(externalTeamId: string): Promise<ExternalTeamForm | null> {
    if (!this.leagueId) return null;

    const params = new URLSearchParams({
      league: this.leagueId,
      season: this.season,
      team: externalTeamId,
    });
    const url = `${this.baseUrl}/teams/statistics?${params.toString()}`;
    const data = await this.requestJson<{ response?: ApiFootballTeamStatistics }>(
      url,
      {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey!,
        },
      },
      this.requestConfig('API_FOOTBALL'),
    );
    const stats = data.response;
    if (!stats) return null;

    return {
      externalTeamId,
      played: stats.fixtures?.played?.total ?? null,
      wins: stats.fixtures?.wins?.total ?? null,
      draws: stats.fixtures?.draws?.total ?? null,
      losses: stats.fixtures?.loses?.total ?? null,
      goalsFor: stats.goals?.for?.total?.total ?? null,
      goalsAgainst: stats.goals?.against?.total?.total ?? null,
      cleanSheets: stats.clean_sheet?.total ?? null,
      form: stats.form ?? null,
      rawPayload: stats,
    };
  }

  private async getLineupStatus(
    externalMatchId: string,
    homeExternalId: string | null,
    awayExternalId: string | null,
  ) {
    const [lineupsData, injuriesData] = await Promise.all([
      this.requestOptional<ApiFootballGenericResponse<ApiFootballLineup>>(
        `${this.baseUrl}/fixtures/lineups?${new URLSearchParams({ fixture: externalMatchId }).toString()}`,
      ),
      this.requestOptional<ApiFootballGenericResponse<ApiFootballInjury>>(
        `${this.baseUrl}/injuries?${new URLSearchParams({
          fixture: externalMatchId,
        }).toString()}`,
      ),
    ]);

    const lineups = lineupsData?.response || [];
    const injuries = injuriesData?.response || [];

    return {
      confirmed: lineups.length > 0,
      homeStartingPlayers: this.mapStartingPlayers(lineups, homeExternalId),
      awayStartingPlayers: this.mapStartingPlayers(lineups, awayExternalId),
      homeMissingPlayers: this.mapInjuries(injuries, homeExternalId),
      awayMissingPlayers: this.mapInjuries(injuries, awayExternalId),
      rawPayload: { lineups, injuries },
    };
  }

  private async getOddsSnapshot(externalMatchId: string): Promise<ExternalOddsSnapshot | null> {
    const params = new URLSearchParams({
      fixture: externalMatchId,
    });
    if (this.leagueId) params.set('league', this.leagueId);
    if (this.season) params.set('season', this.season);

    const data = await this.requestOptional<ApiFootballGenericResponse<ApiFootballOdds>>(
      `${this.baseUrl}/odds?${params.toString()}`,
    );
    const odds = data?.response?.[0];
    if (!odds) return null;

    const matchWinner = odds.bookmakers
      ?.flatMap((bookmaker) => bookmaker.bets || [])
      .find((bet) => ['Match Winner', 'Winner'].includes(bet.name || ''));
    const values = matchWinner?.values || [];
    const homeWinOdds = this.oddsValue(values, ['Home', '1']);
    const drawOdds = this.oddsValue(values, ['Draw', 'X']);
    const awayWinOdds = this.oddsValue(values, ['Away', '2']);
    const normalized = this.normalizeOdds(homeWinOdds, drawOdds, awayWinOdds);

    const goalsBet = odds.bookmakers
      ?.flatMap((bookmaker) => bookmaker.bets || [])
      .find((bet) => ['Goals Over/Under', 'Over/Under'].includes(bet.name || ''));
    const overUnderLine = this.extractOverUnderLine(goalsBet?.values || []);

    return {
      provider: this.code,
      externalMatchId,
      capturedAt: new Date().toISOString(),
      homeWinOdds,
      drawOdds,
      awayWinOdds,
      normalizedHomeProbability: normalized?.home ?? null,
      normalizedDrawProbability: normalized?.draw ?? null,
      normalizedAwayProbability: normalized?.away ?? null,
      overUnderLine,
      rawPayload: odds,
    };
  }

  private async requestOptional<T>(url: string): Promise<T | null> {
    try {
      return await this.requestJson<T>(
        url,
        {
          method: 'GET',
          headers: {
            'x-apisports-key': this.apiKey!,
          },
        },
        this.requestConfig('API_FOOTBALL'),
      );
    } catch (error) {
      this.logger.warn(
        `Optional API_FOOTBALL request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private mapStartingPlayers(lineups: ApiFootballLineup[], externalTeamId: string | null) {
    const lineup = lineups.find((item) => String(item.team?.id || '') === String(externalTeamId || ''));
    return (lineup?.startXI || []).map((item) => ({
      externalPlayerId: item.player?.id ? String(item.player.id) : null,
      name: item.player?.name || 'Unknown Player',
      position: item.player?.pos || null,
    }));
  }

  private mapInjuries(injuries: ApiFootballInjury[], externalTeamId: string | null) {
    return injuries
      .filter((item) => String(item.team?.id || '') === String(externalTeamId || ''))
      .map((item) => ({
        externalPlayerId: item.player?.id ? String(item.player.id) : null,
        name: item.player?.name || 'Unknown Player',
        reason: item.reason || item.type || null,
      }));
  }

  private oddsValue(values: Array<{ value?: string; odd?: string }>, labels: string[]) {
    const row = values.find((item) => labels.includes(item.value || ''));
    const value = Number(row?.odd);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private normalizeOdds(
    homeWinOdds: number | null,
    drawOdds: number | null,
    awayWinOdds: number | null,
  ) {
    if (!homeWinOdds || !drawOdds || !awayWinOdds) return null;
    const home = 1 / homeWinOdds;
    const draw = 1 / drawOdds;
    const away = 1 / awayWinOdds;
    const total = home + draw + away;
    return {
      home: Number(((home / total) * 100).toFixed(2)),
      draw: Number(((draw / total) * 100).toFixed(2)),
      away: Number(((away / total) * 100).toFixed(2)),
    };
  }

  private extractOverUnderLine(values: Array<{ value?: string; odd?: string }>) {
    const row = values.find((item) => /over\\s+\\d/i.test(item.value || ''));
    const match = row?.value?.match(/(\\d+(?:\\.\\d+)?)/);
    return match ? Number(match[1]) : null;
  }

  private mapFixture(fixture: ApiFootballFixture): ExternalMatchResult {
    const homeScore = fixture.goals?.home ?? null;
    const awayScore = fixture.goals?.away ?? null;
    const status = this.mapStatus(fixture.fixture?.status?.short);

    return {
      provider: this.code,
      externalMatchId: String(fixture.fixture?.id || ''),
      homeTeam: {
        externalId: fixture.teams?.home?.id
          ? String(fixture.teams.home.id)
          : null,
        name: fixture.teams?.home?.name || 'Home Team',
        fifaCode: fixture.teams?.home?.code || null,
      },
      awayTeam: {
        externalId: fixture.teams?.away?.id
          ? String(fixture.teams.away.id)
          : null,
        name: fixture.teams?.away?.name || 'Away Team',
        fifaCode: fixture.teams?.away?.code || null,
      },
      kickoffAt: fixture.fixture?.date || null,
      status,
      homeScore,
      awayScore,
      resultDirection: this.direction(homeScore, awayScore),
      winnerExternalTeamId: this.winnerExternalTeamId(fixture),
      isFinal: this.isFinalStatus(status),
      rawPayload: fixture,
    };
  }

  private mapStatus(status?: string) {
    const finished = new Set(['FT', 'AET', 'PEN']);
    const live = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P']);
    const postponed = new Set(['PST']);
    const cancelled = new Set(['CANC', 'ABD', 'AWD', 'WO']);

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

  private winnerExternalTeamId(fixture: ApiFootballFixture) {
    if (fixture.teams?.home?.winner) {
      return fixture.teams.home.id ? String(fixture.teams.home.id) : null;
    }

    if (fixture.teams?.away?.winner) {
      return fixture.teams.away.id ? String(fixture.teams.away.id) : null;
    }

    return null;
  }
}
