import { Injectable } from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ExternalMatchResult,
  ExternalPreMatchContext,
  FootballDataProvider,
  FootballDataSourceCode,
} from '../football-data.types';

type ManualMatch = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
    matchResults: true;
  };
}>;

@Injectable()
export class ManualProvider implements FootballDataProvider {
  readonly code: FootballDataSourceCode = 'MANUAL';
  readonly priority = 999;

  constructor(private readonly prisma: PrismaService) {}

  isEnabled() {
    return true;
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
    const { start, end } = this.dayRange(date);
    return this.findMatches({ kickoffAt: { gte: start, lt: end } }).then((rows) =>
      rows.map((row) => this.mapMatch(row)),
    );
  }

  async getMatchResult(externalMatchId: string) {
    const rows = await this.findMatches({
      OR: [{ externalId: externalMatchId }, { id: externalMatchId }],
    });

    return rows[0] ? this.mapMatch(rows[0]) : null;
  }

  getLiveMatches() {
    return this.findMatches({ status: MatchStatus.LIVE }).then((rows) =>
      rows.map((row) => this.mapMatch(row)),
    );
  }

  getFinishedMatches(date: string) {
    const { start, end } = this.dayRange(date);
    return this.findMatches({
      status: MatchStatus.FINISHED,
      kickoffAt: { gte: start, lt: end },
    }).then((rows) => rows.map((row) => this.mapMatch(row)));
  }

  async getPreMatchContext(externalMatchId: string): Promise<ExternalPreMatchContext | null> {
    const rows = await this.findMatches({
      OR: [{ externalId: externalMatchId }, { id: externalMatchId }],
    });
    const match = rows[0];
    if (!match) return null;

    return {
      provider: this.code,
      externalMatchId: match.externalId || match.id,
      homeTeam: {
        externalId: match.homeTeam.id,
        name: match.homeTeam.name,
        nameEn: match.homeTeam.nameEn,
        fifaCode: match.homeTeam.fifaCode,
      },
      awayTeam: {
        externalId: match.awayTeam.id,
        name: match.awayTeam.name,
        nameEn: match.awayTeam.nameEn,
        fifaCode: match.awayTeam.fifaCode,
      },
      homeForm: null,
      awayForm: null,
      lineups: null,
      odds: null,
      rawPayload: {
        source: 'manual-local-match',
        matchId: match.id,
        note: 'Manual provider does not fetch external team statistics.',
      },
    };
  }

  private findMatches(where: Prisma.MatchWhereInput) {
    return this.prisma.match.findMany({
      where,
      orderBy: { kickoffAt: 'asc' },
      include: {
        homeTeam: true,
        awayTeam: true,
        matchResults: {
          orderBy: [{ isManualOverride: 'desc' }, { syncedAt: 'desc' }],
          take: 1,
        },
      },
    });
  }

  private mapMatch(match: ManualMatch): ExternalMatchResult {
    const result = match.matchResults[0];
    const homeScore = result?.homeScore ?? match.homeScore ?? null;
    const awayScore = result?.awayScore ?? match.awayScore ?? null;

    return {
      provider: this.code,
      externalMatchId: match.externalId || match.id,
      matchId: match.id,
      homeTeam: {
        externalId: match.homeTeam.id,
        name: match.homeTeam.name,
        nameEn: match.homeTeam.nameEn,
        fifaCode: match.homeTeam.fifaCode,
      },
      awayTeam: {
        externalId: match.awayTeam.id,
        name: match.awayTeam.name,
        nameEn: match.awayTeam.nameEn,
        fifaCode: match.awayTeam.fifaCode,
      },
      kickoffAt: match.kickoffAt.toISOString(),
      status: result?.status ?? match.status,
      homeScore,
      awayScore,
      resultDirection: result?.resultDirection ?? this.direction(homeScore, awayScore),
      winnerExternalTeamId: result?.winnerTeamId ?? match.winnerTeamId,
      isFinal: result?.isFinal ?? match.status === MatchStatus.FINISHED,
      rawPayload: result?.rawPayload ?? {
        source: 'manual-local-match',
        externalId: match.externalId,
      },
    };
  }

  private direction(homeScore?: number | null, awayScore?: number | null) {
    if (homeScore === null || homeScore === undefined) {
      return null;
    }

    if (awayScore === null || awayScore === undefined) {
      return null;
    }

    if (homeScore > awayScore) {
      return 'HOME_WIN' as const;
    }

    if (homeScore < awayScore) {
      return 'AWAY_WIN' as const;
    }

    return 'DRAW' as const;
  }

  private dayRange(date: string) {
    const start = new Date(`${date}T00:00:00.000+08:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return { start, end };
  }

  private toDateOnly(value = new Date()) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
