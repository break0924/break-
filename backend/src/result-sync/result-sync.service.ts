import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  MatchStatus,
  Prisma,
  PredictionDirection,
  SyncStatus,
} from '@prisma/client';
import { EloUpdateService } from '../elo';
import {
  ExternalMatchResult,
  FootballDataSourceCode,
} from '../football-data/football-data.types';
import { FootballDataService } from '../football-data/football-data.service';
import { MatchMonitorService } from '../match-monitor/match-monitor.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeSettlementService } from './challenge-settlement.service';
import { PredictionSettlementService } from './prediction-settlement.service';

type SyncMode = 'CURRENT_AND_TODAY' | 'YESTERDAY' | 'DATE';

function resultSyncCron() {
  const cron = (process.env.RESULT_SYNC_CRON || '0 * * * *').trim();
  const parts = cron.split(/\s+/);
  return parts.length === 5 ? `0 ${cron}` : cron;
}

function resultSyncBackfillCron() {
  const cron = (process.env.RESULT_SYNC_BACKFILL_CRON || '0 2 * * *').trim();
  const parts = cron.split(/\s+/);
  return parts.length === 5 ? `0 ${cron}` : cron;
}

@Injectable()
export class ResultSyncService {
  private readonly logger = new Logger(ResultSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly footballDataService: FootballDataService,
    private readonly predictionSettlementService: PredictionSettlementService,
    private readonly challengeSettlementService: ChallengeSettlementService,
    private readonly eloUpdateService: EloUpdateService,
    private readonly matchMonitorService: MatchMonitorService,
  ) {}

  @Cron(resultSyncCron(), {
    timeZone: process.env.RESULT_SYNC_TIMEZONE || process.env.APP_TIMEZONE || 'Asia/Shanghai',
  })
  async syncByCron() {
    if (!this.isEnabled()) {
      return;
    }

    await this.syncHourly('CRON_HOURLY', false);
  }

  @Cron(resultSyncBackfillCron(), {
    timeZone: process.env.RESULT_SYNC_TIMEZONE || process.env.APP_TIMEZONE || 'Asia/Shanghai',
  })
  async backfillYesterdayByCron() {
    if (!this.isEnabled()) {
      return;
    }

    await this.backfillByDate(this.yesterdayDate(), 'CRON_2AM_BACKFILL', false);
  }

  async runManual(options: {
    mode?: SyncMode;
    date?: string;
    forceSettlement?: boolean;
  }) {
    const mode = options.mode || 'CURRENT_AND_TODAY';
    if (mode === 'YESTERDAY') {
      return this.backfillByDate(
        this.yesterdayDate(),
        'ADMIN_MANUAL',
        options.forceSettlement ?? true,
      );
    }

    if (mode === 'DATE') {
      return this.backfillByDate(
        options.date || this.todayDate(),
        'ADMIN_MANUAL',
        options.forceSettlement ?? true,
      );
    }

    return this.syncHourly(
      'ADMIN_MANUAL',
      options.forceSettlement ?? true,
    );
  }

  async getDashboard(date = this.todayDate()) {
    const [logs, matches, providers] = await Promise.all([
      this.listLogs({ limit: 5 }),
      this.listMatchSyncStatus(date),
      this.listDataSources(),
    ]);

    const lastLog = logs.items[0] || null;
    const failedLogs = logs.items.filter((item) => item.status === SyncStatus.FAILED);
    const finishedMatches = matches.items.filter(
      (item) => item.status === MatchStatus.FINISHED,
    );

    return {
      date,
      enabled: this.isEnabled(),
      providerCount: providers.items.length,
      healthyProviderCount: providers.items.filter((item) => item.enabled).length,
      matchCount: matches.items.length,
      liveCount: matches.items.filter((item) => item.status === MatchStatus.LIVE)
        .length,
      finishedCount: finishedMatches.length,
      predictionSettledCount: matches.items.filter(
        (item) => item.predictionSettled,
      ).length,
      challengeSettledCount: matches.items.filter((item) => item.challengeSettled)
        .length,
      lastSyncAt: lastLog?.finishedAt || lastLog?.startedAt || null,
      lastStatus: lastLog?.status || null,
      lastFailureReason: failedLogs[0]?.errorMessage || null,
      lastLog,
    };
  }

  async listLogs(options: { limit?: number; status?: SyncStatus } = {}) {
    const take = Math.min(Math.max(options.limit || 30, 1), 100);
    const where: Prisma.ResultSyncLogWhereInput = options.status
      ? { status: options.status }
      : {};

    const items = await this.prisma.resultSyncLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceConfig: true,
        targetMatch: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    return { items };
  }

  async listDataSources() {
    const [configs, health] = await Promise.all([
      this.prisma.resultDataSourceConfig.findMany({
        orderBy: [{ isActive: 'desc' }, { priority: 'asc' }],
      }),
      Promise.resolve(this.footballDataService.health()),
    ]);

    const healthByCode = new Map(health.map((item) => [item.code, item]));
    const items = configs.map((config) => ({
      ...config,
      runtime: healthByCode.get(this.normalizeProviderCode(config.provider)) || null,
      enabled:
        config.isActive &&
        Boolean(
          healthByCode.get(this.normalizeProviderCode(config.provider))?.enabled ??
            true,
        ),
    }));

    const configProviders = new Set(
      configs.map((item) => this.normalizeProviderCode(item.provider)),
    );
    for (const item of health) {
      if (!configProviders.has(item.code)) {
        items.push({
          id: item.code,
          code: item.code,
          name: this.providerName(item.code),
          provider: item.code,
          baseUrl: '',
          apiKeyEnv: null,
          isActive: item.enabled,
          priority: 999,
          pollingCron: null,
          requestTimeoutMs: 0,
          config: null,
          createdAt: new Date(0),
          updatedAt: new Date(0),
          runtime: item,
          enabled: item.enabled,
        });
      }
    }

    return { items };
  }

  async listMatchSyncStatus(date = this.todayDate()) {
    const matches = await this.prisma.match.findMany({
      where: {
        kickoffAt: {
          gte: this.startOfDay(date),
          lt: this.endOfDay(date),
        },
      },
      orderBy: { kickoffAt: 'asc' },
      include: {
        homeTeam: true,
        awayTeam: true,
        winnerTeam: true,
        matchResults: {
          orderBy: { syncedAt: 'desc' },
          include: { sourceConfig: true },
        },
        predictionSettlements: {
          select: { id: true },
        },
        matchPredictions: {
          select: { id: true, scoredAt: true },
        },
      },
    });

    return {
      date,
      items: matches.map((match) => {
        const latestResult = match.matchResults[0] || null;
        const challengePredictions = match.matchPredictions;
        const challengeScored = challengePredictions.filter(
          (item) => item.scoredAt,
        ).length;

        return {
          id: match.id,
          externalId: match.externalId,
          stage: match.stage,
          groupName: match.groupName,
          kickoffAt: match.kickoffAt,
          kickoffTime: match.kickoffTime,
          timezone: match.timezone,
          venue: match.venue,
          city: match.city,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          winnerTeam: match.winnerTeam,
          latestResult,
          dataSource: latestResult?.sourceName || null,
          lastSyncedAt: match.lastSyncedAt || latestResult?.syncedAt || null,
          syncFailureReason: null,
          predictionSettled: match.predictionSettlements.length > 0,
          challengeSettled:
            challengePredictions.length > 0 &&
            challengeScored === challengePredictions.length,
          challengeScoredCount: challengeScored,
          challengePredictionCount: challengePredictions.length,
        };
      }),
    };
  }

  async syncSingleMatch(matchId: string, forceSettlement = true) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const log = await this.createLog({
      triggerType: 'ADMIN_SINGLE_MATCH',
      syncWindowStart: new Date(match.kickoffAt.getTime() - 12 * 60 * 60 * 1000),
      syncWindowEnd: new Date(match.kickoffAt.getTime() + 36 * 60 * 60 * 1000),
      targetMatchId: match.id,
      matchId: match.id,
    });

    try {
      let results: ExternalMatchResult[] = [];
      if (match.externalId) {
        const result = await this.footballDataService.getMatchResult(match.externalId);
        results = result ? [result] : [];
      }

      if (results.length === 0) {
        const date = match.matchDate
          ? this.toDateOnly(match.matchDate)
          : this.toDateOnly(match.kickoffAt);
        results = [
          ...(await this.footballDataService.getLiveMatches()),
          ...(await this.footballDataService.getFinishedMatches(date)),
        ];
      }

      const relatedResults: ExternalMatchResult[] = [];
      for (const result of this.uniqueResults(results)) {
        const localMatch = await this.resolveLocalMatch(result);
        if (localMatch?.id === match.id) {
          relatedResults.push(result);
        }
      }

      if (relatedResults.length === 0) {
        throw new BadRequestException('No result data matched this match');
      }

      const result = await this.applyResults(relatedResults, log.id, forceSettlement);
      return this.finishLog(log.id, SyncStatus.SUCCEEDED, result);
    } catch (error) {
      return this.failLog(log.id, error);
    }
  }

  async correctMatchResult(
    matchId: string,
    dto: { homeScore: number; awayScore: number; reason?: string },
    correctedByUserId?: string,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const resultDirection = this.directionFromScore(dto.homeScore, dto.awayScore);
    const winnerTeamId =
      resultDirection === PredictionDirection.HOME_WIN
        ? match.homeTeamId
        : resultDirection === PredictionDirection.AWAY_WIN
          ? match.awayTeamId
          : null;

    const log = await this.createLog({
      triggerType: 'ADMIN_SCORE_CORRECTION',
      targetMatchId: match.id,
    });

      const previousStatus = match.status;
      const [updatedMatch, manualResult] = await this.prisma.$transaction([
      this.prisma.match.update({
        where: { id: match.id },
        data: {
          status: MatchStatus.FINISHED,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          winnerTeamId,
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          winnerTeam: true,
        },
      }),
      this.prisma.matchResult.upsert({
        where: {
          matchId_sourceName: {
            matchId: match.id,
            sourceName: 'MANUAL',
          },
        },
        update: {
          syncLogId: log.id,
          status: MatchStatus.FINISHED,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          resultDirection,
          winnerTeamId,
          isFinal: true,
          isManualOverride: true,
          rawPayload: {
            correctedFromAdmin: true,
            reason: dto.reason || null,
          },
          syncedAt: new Date(),
          confirmedAt: new Date(),
          correctedAt: new Date(),
          correctedByUserId,
          correctionReason: dto.reason,
        },
        create: {
          matchId: match.id,
          syncLogId: log.id,
          sourceName: 'MANUAL',
          status: MatchStatus.FINISHED,
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          resultDirection,
          winnerTeamId,
          isFinal: true,
          isManualOverride: true,
          rawPayload: {
            correctedFromAdmin: true,
            reason: dto.reason || null,
          },
          confirmedAt: new Date(),
          correctedAt: new Date(),
          correctedByUserId,
          correctionReason: dto.reason,
        },
      }),
    ]);

    const settlement = await this.reSettleMatch(match.id);
    this.matchMonitorService.publishStatusChange(updatedMatch, previousStatus);
    this.matchMonitorService.publishResultCorrected(updatedMatch);
    this.matchMonitorService.publishSettlementUpdated(updatedMatch, {
      predictionSettled: !settlement.predictionSettlement.skipped,
      challengeSettled: !settlement.challengeSettlement.skipped,
    });
    const finishedLog = await this.finishLog(log.id, SyncStatus.SUCCEEDED, {
      matchedCount: 1,
      updatedCount: 1,
      skippedCount: 0,
      conflictCount: 0,
      responsePayload: {
        manualResultId: manualResult.id,
        settlement,
      },
    });

    return { match: updatedMatch, manualResult, settlement, log: finishedLog };
  }

  async reSettleMatch(matchId: string) {
    const [predictionSettlement, challengeSettlement, eloUpdate] = await Promise.all([
      this.predictionSettlementService.settleMatch(matchId, true),
      this.challengeSettlementService.settleMatch(matchId, true),
      this.eloUpdateService.updateTeamElo({ matchId, force: true }),
    ]);

    return {
      matchId,
      predictionSettlement,
      challengeSettlement,
      eloUpdate,
    };
  }

  settlePredictions(matchId: string) {
    return this.predictionSettlementService.settleMatch(matchId, true);
  }

  settleChallenge(matchId: string) {
    return this.challengeSettlementService.settleMatch(matchId, true);
  }

  private async syncHourly(triggerType: string, forceSettlement: boolean) {
    const log = await this.createLog({
      triggerType,
      syncWindowStart: this.startOfDay(this.todayDate()),
      syncWindowEnd: this.endOfDay(this.todayDate()),
    });

    try {
      const [todayMatches, liveMatches] = await Promise.all([
        this.footballDataService.getMatchesByDate(this.todayDate()),
        this.footballDataService.getLiveMatches(),
      ]);

      const result = await this.applyResults(
        this.uniqueResults([...todayMatches, ...liveMatches]),
        log.id,
        forceSettlement,
      );
      const unsettled = await this.settleUnsettledFinishedMatches(forceSettlement);

      return this.finishLog(log.id, SyncStatus.SUCCEEDED, {
        ...result,
        responsePayload: {
          ...(result.responsePayload as object),
          syncScope: {
            todayMatches: true,
            liveMatches: true,
            finishedUnsettledMatches: true,
          },
          unsettledFinishedMatches: unsettled,
        },
      });
    } catch (error) {
      return this.failLog(log.id, error);
    }
  }

  private async backfillByDate(
    date: string,
    triggerType: string,
    forceSettlement: boolean,
  ) {
    const log = await this.createLog({
      triggerType,
      syncWindowStart: this.startOfDay(date),
      syncWindowEnd: this.endOfDay(date),
    });

    try {
      const results = await this.footballDataService.getMatchesByDate(date);
      const result = await this.applyResults(results, log.id, forceSettlement);
      const unsettled = await this.settleUnsettledFinishedMatches(
        forceSettlement,
        date,
      );

      return this.finishLog(log.id, SyncStatus.SUCCEEDED, {
        ...result,
        responsePayload: {
          ...(result.responsePayload as object),
          unsettledFinishedMatches: unsettled,
        },
      });
    } catch (error) {
      return this.failLog(log.id, error);
    }
  }

  private async applyResults(
    results: ExternalMatchResult[],
    syncLogId: string,
    forceSettlement: boolean,
  ) {
    let matchedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let conflictCount = 0;
    const settledMatches: string[] = [];

    for (const result of results) {
      const match = await this.resolveLocalMatch(result);
      if (!match) {
        skippedCount += 1;
        continue;
      }

      matchedCount += 1;
      const sourceConfig = await this.findSourceConfig(result.provider);
      const winnerTeamId = this.resolveWinnerTeamId(result, match);
      const hasConflict = await this.hasResultConflict(match.id, result);

      if (hasConflict && !forceSettlement) {
        conflictCount += 1;
        await this.saveMatchResult(result, match.id, syncLogId, sourceConfig?.id, {
          winnerTeamId,
          isFinal: result.isFinal,
        });
        continue;
      }

      await this.saveMatchResult(result, match.id, syncLogId, sourceConfig?.id, {
        winnerTeamId,
        isFinal: result.isFinal,
      });

      const matchData = this.matchUpdateData(result, winnerTeamId);
      let updatedMatch:
        | (typeof match & {
            winnerTeam?: unknown;
          })
        | null = null;
      if (Object.keys(matchData).length > 0) {
        updatedMatch = await this.prisma.match.update({
          where: { id: match.id },
          data: matchData,
          include: { homeTeam: true, awayTeam: true },
        });
        this.matchMonitorService.publishStatusChange(updatedMatch, match.status);
        updatedCount += 1;
      }

      if (
        result.status === MatchStatus.FINISHED &&
        result.homeScore !== null &&
        result.homeScore !== undefined &&
        result.awayScore !== null &&
        result.awayScore !== undefined
      ) {
        const predictionSettlement = await this.predictionSettlementService.settleMatch(
          match.id,
          forceSettlement,
        );
        const challengeSettlement = await this.challengeSettlementService.settleMatch(
          match.id,
          forceSettlement,
        );
        const eloUpdate = await this.eloUpdateService.updateTeamElo({
          matchId: match.id,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          force: forceSettlement,
        });
        this.matchMonitorService.publishSettlementUpdated(updatedMatch || match, {
          predictionSettled: !predictionSettlement.skipped,
          challengeSettled: !challengeSettlement.skipped,
        });

        if (
          !predictionSettlement.skipped ||
          !challengeSettlement.skipped ||
          !eloUpdate.skipped ||
          forceSettlement
        ) {
          settledMatches.push(match.id);
        }
      }
    }

    return {
      matchedCount,
      updatedCount,
      skippedCount,
      conflictCount,
      settledCount: new Set(settledMatches).size,
      responsePayload: {
        providerResults: results.length,
        settledMatches: [...new Set(settledMatches)],
      },
    };
  }

  private async resolveLocalMatch(result: ExternalMatchResult) {
    if (result.matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: result.matchId },
        include: { homeTeam: true, awayTeam: true },
      });
      if (match) {
        return match;
      }
    }

    const byExternalId = await this.prisma.match.findFirst({
      where: {
        OR: [
          { externalId: result.externalMatchId },
          {
            matchResults: {
              some: {
                sourceName: result.provider,
                sourceMatchId: result.externalMatchId,
              },
            },
          },
        ],
      },
      include: { homeTeam: true, awayTeam: true },
    });

    if (byExternalId) {
      return byExternalId;
    }

    if (!result.kickoffAt) {
      return null;
    }

    const start = new Date(result.kickoffAt);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return this.prisma.match.findFirst({
      where: {
        kickoffAt: { gte: start, lt: end },
        homeTeam: {
          OR: [
            { fifaCode: result.homeTeam.fifaCode || undefined },
            { name: result.homeTeam.name },
            { nameEn: result.homeTeam.nameEn || undefined },
          ],
        },
        awayTeam: {
          OR: [
            { fifaCode: result.awayTeam.fifaCode || undefined },
            { name: result.awayTeam.name },
            { nameEn: result.awayTeam.nameEn || undefined },
          ],
        },
      },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  private async settleUnsettledFinishedMatches(
    forceSettlement: boolean,
    date?: string,
  ) {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
        ...(date
          ? {
              kickoffAt: {
                gte: this.startOfDay(date),
                lt: this.endOfDay(date),
              },
            }
          : {}),
        OR: [
          {
            predictionArchives: {
              some: {
                status: 'PUBLISHED',
                settlement: null,
              },
            },
          },
          {
            matchPredictions: {
              some: forceSettlement ? {} : { scoredAt: null },
            },
          },
        ],
      },
      select: { id: true },
    });

    const settledMatchIds: string[] = [];
    for (const match of matches) {
      const [predictionSettlement, challengeSettlement, eloUpdate] = await Promise.all([
        this.predictionSettlementService.settleMatch(match.id, forceSettlement),
        this.challengeSettlementService.settleMatch(match.id, forceSettlement),
        this.eloUpdateService.updateTeamElo({
          matchId: match.id,
          force: forceSettlement,
        }),
      ]);

      if (
        !predictionSettlement.skipped ||
        !challengeSettlement.skipped ||
        !eloUpdate.skipped
      ) {
        settledMatchIds.push(match.id);
      }
    }

    return {
      checkedCount: matches.length,
      settledCount: new Set(settledMatchIds).size,
      settledMatchIds: [...new Set(settledMatchIds)],
    };
  }

  private async saveMatchResult(
    result: ExternalMatchResult,
    matchId: string,
    syncLogId: string,
    sourceConfigId: string | undefined,
    options: { winnerTeamId?: string | null; isFinal: boolean },
  ) {
    return this.prisma.matchResult.upsert({
      where: {
        matchId_sourceName: {
          matchId,
          sourceName: result.provider,
        },
      },
      update: {
        sourceConfigId,
        syncLogId,
        sourceMatchId: result.externalMatchId,
        status: result.status,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        resultDirection: result.resultDirection,
        winnerTeamId: options.winnerTeamId,
        isFinal: options.isFinal,
        rawPayload: result.rawPayload as object,
        syncedAt: new Date(),
        confirmedAt: options.isFinal ? new Date() : undefined,
      },
      create: {
        matchId,
        sourceConfigId,
        syncLogId,
        sourceName: result.provider,
        sourceMatchId: result.externalMatchId,
        status: result.status,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        resultDirection: result.resultDirection,
        winnerTeamId: options.winnerTeamId,
        isFinal: options.isFinal,
        rawPayload: result.rawPayload as object,
        confirmedAt: options.isFinal ? new Date() : undefined,
      },
    });
  }

  private matchUpdateData(
    result: ExternalMatchResult,
    winnerTeamId?: string | null,
  ) {
    const data: {
      status?: MatchStatus;
      homeScore?: number | null;
      awayScore?: number | null;
      winnerTeamId?: string | null;
      lastSyncedAt: Date;
    } = {
      lastSyncedAt: new Date(),
    };

    if (result.status === MatchStatus.LIVE) {
      data.status = MatchStatus.LIVE;
    }

    if (result.status === MatchStatus.FINISHED) {
      data.status = MatchStatus.FINISHED;
      data.homeScore = result.homeScore ?? null;
      data.awayScore = result.awayScore ?? null;
      data.winnerTeamId = winnerTeamId ?? null;
    }

    if (result.status === MatchStatus.CANCELLED) {
      data.status = MatchStatus.CANCELLED;
    }

    if (result.status === MatchStatus.POSTPONED) {
      data.status = MatchStatus.POSTPONED;
    }

    return data;
  }

  private async hasResultConflict(matchId: string, result: ExternalMatchResult) {
    const current = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        status: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (!current || current.status !== MatchStatus.FINISHED) {
      return false;
    }

    if (result.status !== MatchStatus.FINISHED) {
      return false;
    }

    return (
      current.homeScore !== result.homeScore ||
      current.awayScore !== result.awayScore
    );
  }

  private resolveWinnerTeamId(
    result: ExternalMatchResult,
    match: {
      homeTeamId: string;
      awayTeamId: string;
      homeTeam: { fifaCode: string };
      awayTeam: { fifaCode: string };
    },
  ) {
    if (result.winnerExternalTeamId) {
      if (
        result.winnerExternalTeamId === match.homeTeamId ||
        result.winnerExternalTeamId === match.homeTeam.fifaCode
      ) {
        return match.homeTeamId;
      }

      if (
        result.winnerExternalTeamId === match.awayTeamId ||
        result.winnerExternalTeamId === match.awayTeam.fifaCode
      ) {
        return match.awayTeamId;
      }
    }

    if (result.resultDirection === PredictionDirection.HOME_WIN) {
      return match.homeTeamId;
    }

    if (result.resultDirection === PredictionDirection.AWAY_WIN) {
      return match.awayTeamId;
    }

    return null;
  }

  private uniqueResults(results: ExternalMatchResult[]) {
    const map = new Map<string, ExternalMatchResult>();
    for (const result of results) {
      map.set(`${result.provider}:${result.externalMatchId}`, result);
    }
    return [...map.values()];
  }

  private async findSourceConfig(provider: FootballDataSourceCode) {
    const codes: Record<FootballDataSourceCode, string[]> = {
      API_FOOTBALL: ['API_FOOTBALL', 'api-football', 'football-data-api'],
      SPORTMONKS: ['SPORTMONKS', 'sportmonks'],
      MANUAL: ['MANUAL', 'manual'],
    };

    return this.prisma.resultDataSourceConfig.findFirst({
      where: { code: { in: codes[provider] } },
    });
  }

  private async createLog(input: {
    triggerType: string;
    syncWindowStart?: Date;
    syncWindowEnd?: Date;
    targetMatchId?: string;
    matchId?: string;
    provider?: string;
    retryCount?: number;
  }) {
    return this.prisma.resultSyncLog.create({
      data: {
        status: SyncStatus.RUNNING,
        syncStatus: SyncStatus.RUNNING,
        triggerType: input.triggerType,
        syncWindowStart: input.syncWindowStart,
        syncWindowEnd: input.syncWindowEnd,
        targetMatchId: input.targetMatchId,
        matchId: input.matchId || input.targetMatchId,
        provider: input.provider,
        retryCount: input.retryCount ?? 0,
        startedAt: new Date(),
      },
    });
  }

  private finishLog(
    id: string,
    status: SyncStatus,
    result: {
      matchedCount: number;
      updatedCount: number;
      skippedCount: number;
      conflictCount: number;
      responsePayload: unknown;
    },
  ) {
    return this.prisma.resultSyncLog.update({
      where: { id },
      data: {
        status,
        syncStatus: status,
        matchedCount: result.matchedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        conflictCount: result.conflictCount,
        responsePayload: result.responsePayload as object,
        rawPayload: result.responsePayload as object,
        syncedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }

  private failLog(id: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Result sync failed: ${message}`);
    return this.prisma.resultSyncLog.update({
      where: { id },
      data: {
        status: SyncStatus.FAILED,
        syncStatus: SyncStatus.FAILED,
        errorMessage: message,
        syncedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }

  private isEnabled() {
    return this.configService.get<string>('RESULT_SYNC_ENABLE', 'true') === 'true';
  }

  private todayDate() {
    return this.toDateOnly(new Date());
  }

  private yesterdayDate() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return this.toDateOnly(date);
  }

  private startOfDay(date: string) {
    return new Date(`${date}T00:00:00.000+08:00`);
  }

  private endOfDay(date: string) {
    return new Date(this.startOfDay(date).getTime() + 24 * 60 * 60 * 1000);
  }

  private toDateOnly(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private directionFromScore(homeScore: number, awayScore: number) {
    if (homeScore > awayScore) {
      return PredictionDirection.HOME_WIN;
    }

    if (awayScore > homeScore) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
  }

  private normalizeProviderCode(provider: string): FootballDataSourceCode {
    const normalized = provider.trim().toUpperCase().replace(/-/g, '_');
    if (normalized === 'SPORTMONKS') {
      return 'SPORTMONKS';
    }
    if (normalized === 'MANUAL') {
      return 'MANUAL';
    }
    return 'API_FOOTBALL';
  }

  private providerName(provider: FootballDataSourceCode) {
    const names: Record<FootballDataSourceCode, string> = {
      API_FOOTBALL: 'API-FOOTBALL',
      SPORTMONKS: 'Sportmonks',
      MANUAL: '手动修正',
    };

    return names[provider];
  }
}
