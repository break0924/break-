import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { MatchStatus, Prisma, TournamentStage } from '@prisma/client';
import { ChallengeService } from '../challenge/challenge.service';
import { FootballDataService } from '../football-data/football-data.service';
import { ExternalMatchResult } from '../football-data/football-data.types';
import { PredictionsService } from '../predictions/predictions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResultSyncService } from '../result-sync/result-sync.service';
import { seedMatches } from '../../prisma/seedMatches';

type JobTrigger =
  | 'CRON_0010'
  | 'CRON_0600'
  | 'CRON_HOURLY'
  | 'ADMIN_MANUAL';

type JobRunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';

type JobRunSummary = {
  status: JobRunStatus;
  trigger: JobTrigger;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
  refreshedMatches: number;
  generatedPredictions: number;
  skippedPredictions: number;
  settledMatches: number;
  statsCalculated: boolean;
};

type SeedMatch = (typeof seedMatches)[number];

const DEFAULT_TIMEZONE = 'Asia/Shanghai';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeCron(value: string, fallback: string) {
  const cron = (value || fallback).trim();
  return cron.split(/\s+/).length === 5 ? `0 ${cron}` : cron;
}

function dailyRefreshCron() {
  return normalizeCron(process.env.JOBS_DAILY_REFRESH_CRON || '', '10 0 * * *');
}

function dailySupplementCron() {
  return normalizeCron(
    process.env.JOBS_DAILY_REFRESH_SUPPLEMENT_CRON || '',
    '0 6 * * *',
  );
}

function hourlyStatusCron() {
  return normalizeCron(process.env.JOBS_HOURLY_STATUS_CRON || '', '0 * * * *');
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private lastRun: JobRunSummary | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly footballDataService: FootballDataService,
    private readonly predictionsService: PredictionsService,
    private readonly resultSyncService: ResultSyncService,
    private readonly challengeService: ChallengeService,
  ) {}

  @Cron(dailyRefreshCron(), {
    timeZone: process.env.APP_TIMEZONE || DEFAULT_TIMEZONE,
  })
  async refreshByMidnightCron() {
    if (!this.isEnabled()) {
      return;
    }

    await this.runDailyRefresh('CRON_0010');
  }

  @Cron(dailySupplementCron(), {
    timeZone: process.env.APP_TIMEZONE || DEFAULT_TIMEZONE,
  })
  async refreshByMorningCron() {
    if (!this.isEnabled()) {
      return;
    }

    await this.runDailyRefresh('CRON_0600');
  }

  @Cron(hourlyStatusCron(), {
    timeZone: process.env.APP_TIMEZONE || DEFAULT_TIMEZONE,
  })
  async refreshStatusByHourlyCron() {
    if (!this.isEnabled()) {
      return;
    }

    await this.runHourlyStatusRefresh('CRON_HOURLY');
  }

  async runDailyRefresh(trigger: JobTrigger = 'ADMIN_MANUAL') {
    const summary = this.createSummary(trigger);
    this.lastRun = summary;

    try {
      const refreshedMatches = await this.refreshUpcomingMatches(14);
      const statusUpdates = await this.updateDynamicMatchStatuses();
      const predictionResult = await this.generateUpcomingPredictions();
      const settlement = await this.settleFinishedMatches();
      await this.predictionsService.getStats();

      const finished = {
        ...summary,
        status: 'SUCCESS' as const,
        finishedAt: new Date().toISOString(),
        refreshedMatches: refreshedMatches + statusUpdates.updatedCount,
        generatedPredictions: predictionResult.generatedCount,
        skippedPredictions: predictionResult.skippedCount,
        settledMatches: settlement.settledCount,
        statsCalculated: true,
      };
      this.lastRun = finished;
      return finished;
    } catch (error) {
      const failed = {
        ...summary,
        status: 'FAILED' as const,
        finishedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      this.lastRun = failed;
      this.logger.error(`daily-refresh failed: ${failed.errorMessage}`);
      return failed;
    }
  }

  async runHourlyStatusRefresh(trigger: JobTrigger = 'CRON_HOURLY') {
    const summary = this.createSummary(trigger);
    this.lastRun = summary;

    try {
      const statusUpdates = await this.updateDynamicMatchStatuses();
      const providerSync = await this.resultSyncService
        .runManual({ mode: 'CURRENT_AND_TODAY', forceSettlement: false })
        .catch((error) => ({
          skipped: true,
          errorMessage: error instanceof Error ? error.message : String(error),
        }));
      const settlement = await this.settleFinishedMatches();
      await this.predictionsService.getStats();

      const finished = {
        ...summary,
        status: 'SUCCESS' as const,
        finishedAt: new Date().toISOString(),
        refreshedMatches: statusUpdates.updatedCount,
        generatedPredictions: 0,
        skippedPredictions: 0,
        settledMatches: settlement.settledCount,
        statsCalculated: true,
        providerSync,
      };
      this.lastRun = finished;
      return finished;
    } catch (error) {
      const failed = {
        ...summary,
        status: 'FAILED' as const,
        finishedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      this.lastRun = failed;
      this.logger.error(`hourly status refresh failed: ${failed.errorMessage}`);
      return failed;
    }
  }

  async getStatus() {
    const today = this.toBeijingDateString(new Date());
    const [providerHealth, resultSyncDashboard] = await Promise.all([
      Promise.resolve(this.footballDataService.health()).catch(() => []),
      this.resultSyncService.getDashboard(today).catch((error) => ({
        errorMessage: error instanceof Error ? error.message : String(error),
      })),
    ]);

    return {
      enabled: this.isEnabled(),
      timezone: this.timezone(),
      cron: {
        dailyRefresh: this.configService.get<string>(
          'JOBS_DAILY_REFRESH_CRON',
          '10 0 * * *',
        ),
        dailySupplement: this.configService.get<string>(
          'JOBS_DAILY_REFRESH_SUPPLEMENT_CRON',
          '0 6 * * *',
        ),
        hourlyStatus: this.configService.get<string>(
          'JOBS_HOURLY_STATUS_CRON',
          '0 * * * *',
        ),
      },
      lastRun: this.lastRun,
      providers: providerHealth,
      resultSync: resultSyncDashboard,
    };
  }

  private async refreshUpcomingMatches(days: number) {
    const dates = Array.from({ length: days }, (_, index) =>
      this.addBeijingDays(new Date(), index),
    );
    let upserted = 0;

    for (const date of dates) {
      const externalMatches = await this.footballDataService
        .getMatchesByDate(date)
        .catch((error) => {
          this.logger.warn(
            `football provider schedule failed for ${date}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          return [];
        });

      if (externalMatches.length > 0) {
        for (const match of externalMatches) {
          if (await this.upsertExternalMatch(match)) {
            upserted += 1;
          }
        }
        continue;
      }

      upserted += await this.upsertFallbackMatchesForDate(date);
    }

    return upserted;
  }

  private async generateUpcomingPredictions() {
    const dates = this.nextPredictionDates();
    let generatedCount = 0;
    let skippedCount = 0;

    for (const date of dates) {
      const result = await this.predictionsService
        .generateByDate({ date, publish: true })
        .catch((error) => ({
          count: 0,
          skippedCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        }));

      generatedCount += 'count' in result ? result.count || 0 : 0;
      skippedCount += 'skippedCount' in result ? result.skippedCount || 0 : 0;
    }

    return { generatedCount, skippedCount };
  }

  private async updateDynamicMatchStatuses() {
    const now = new Date();
    const matches = await this.prisma.match.findMany({
      where: {
        status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] },
        kickoffAt: { lte: new Date(now.getTime() + 14 * ONE_DAY_MS) },
      },
      select: {
        id: true,
        status: true,
        kickoffAt: true,
        homeScore: true,
        awayScore: true,
      },
    });

    let updatedCount = 0;
    for (const match of matches) {
      const nextStatus = this.statusFromKickoff(
        match.kickoffAt,
        match.homeScore,
        match.awayScore,
        now,
      );

      if (nextStatus !== match.status) {
        await this.prisma.match.update({
          where: { id: match.id },
          data: { status: nextStatus, lastSyncedAt: now },
        });
        updatedCount += 1;
      }
    }

    return { checkedCount: matches.length, updatedCount };
  }

  private async settleFinishedMatches() {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeScore: { not: null },
        awayScore: { not: null },
      },
      select: { id: true },
    });

    let settledCount = 0;
    for (const match of matches) {
      const [prediction, challenge] = await Promise.all([
        this.predictionsService.settleMatch(match.id, undefined, false).catch(() => ({
          skipped: true,
        })),
        this.challengeService.settleMatchPoints(match.id, false).catch(() => ({
          skipped: true,
        })),
      ]);

      if (!prediction.skipped || !challenge.skipped) {
        settledCount += 1;
      }
    }

    return { checkedCount: matches.length, settledCount };
  }

  private async upsertExternalMatch(match: ExternalMatchResult) {
    const [homeTeam, awayTeam] = await Promise.all([
      this.findTeam(match.homeTeam),
      this.findTeam(match.awayTeam),
    ]);

    if (!homeTeam || !awayTeam) {
      return false;
    }

    const kickoffAt = match.kickoffAt ? new Date(match.kickoffAt) : null;
    if (!kickoffAt || Number.isNaN(kickoffAt.getTime())) {
      return false;
    }

    const existing = await this.findExistingMatch(
      match.externalMatchId,
      this.toBeijingDateString(kickoffAt),
      homeTeam.id,
      awayTeam.id,
    );
    const status = this.statusFromKickoff(
      kickoffAt,
      match.homeScore,
      match.awayScore,
    );
    const data: Prisma.MatchUncheckedCreateInput = {
      id: existing?.id || this.matchIdFromExternal(match.externalMatchId),
      externalId: match.externalMatchId,
      stage: existing?.stage || TournamentStage.GROUP,
      groupId: existing?.groupId ?? null,
      groupName: existing?.groupName || homeTeam.groupName || null,
      matchDate: this.startOfBeijingDay(this.toBeijingDateString(kickoffAt)),
      kickoffTime: this.beijingTimeString(kickoffAt),
      timezone: this.timezone(),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      kickoffAt,
      venue: existing?.venue ?? null,
      city: existing?.city ?? null,
      roundName: existing?.roundName || '小组赛',
      status,
      homeScore: match.homeScore ?? existing?.homeScore ?? null,
      awayScore: match.awayScore ?? existing?.awayScore ?? null,
      winnerTeamId: existing?.winnerTeamId ?? null,
      lockAt: existing?.lockAt ?? kickoffAt,
      predictionLockAt:
        existing?.predictionLockAt ??
        new Date(kickoffAt.getTime() - this.predictionLockMinutes() * 60_000),
      lastSyncedAt: new Date(),
    };

    if (existing) {
      await this.prisma.match.update({
        where: { id: existing.id },
        data: {
          externalId: data.externalId,
          matchDate: data.matchDate,
          kickoffTime: data.kickoffTime,
          timezone: data.timezone,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          kickoffAt: data.kickoffAt,
          groupName: data.groupName,
          status: data.status,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          lastSyncedAt: data.lastSyncedAt,
        },
      });
      return true;
    }

    await this.prisma.match.create({ data });
    return true;
  }

  private async upsertFallbackMatchesForDate(date: string) {
    if (!this.demoFallbackEnabled()) {
      return 0;
    }

    const seededMatches = this.seedMatchesForDate(date);
    let upserted = 0;
    for (const [index, match] of seededMatches.entries()) {
      if (await this.upsertSeedMatch(date, match, index)) {
        upserted += 1;
      }
    }

    return upserted;
  }

  private async upsertSeedMatch(date: string, match: SeedMatch, index: number) {
    const [homeTeam, awayTeam] = await Promise.all([
      this.findTeam({ name: match.homeTeam }),
      this.findTeam({ name: match.awayTeam }),
    ]);

    if (!homeTeam || !awayTeam) {
      return false;
    }

    const kickoffAt = this.kickoffAt(date, match.kickoffTime);
    const externalId = match.matchDate === date
      ? `WC2026-GS-${date.replace(/-/g, '')}-${String(match.matchNoOfDay).padStart(2, '0')}`
      : `AUTO-DEMO-${date.replace(/-/g, '')}-${String(index + 1).padStart(2, '0')}`;
    const existing = await this.findExistingMatch(
      externalId,
      date,
      homeTeam.id,
      awayTeam.id,
    );
    const status = this.statusFromKickoff(
      kickoffAt,
      existing?.homeScore ?? null,
      existing?.awayScore ?? null,
    );

    const data = {
      externalId,
      stage: TournamentStage.GROUP,
      groupName: match.groupName,
      matchDate: this.startOfBeijingDay(date),
      kickoffTime: match.kickoffTime,
      timezone: this.timezone(),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      kickoffAt,
      roundName: '小组赛',
      status,
      lockAt: existing?.lockAt ?? kickoffAt,
      predictionLockAt:
        existing?.predictionLockAt ??
        new Date(kickoffAt.getTime() - this.predictionLockMinutes() * 60_000),
      lastSyncedAt: new Date(),
    };

    if (existing) {
      await this.prisma.match.update({
        where: { id: existing.id },
        data,
      });
      return true;
    }

    await this.prisma.match.create({
      data: {
        id: `match_${externalId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        ...data,
      },
    });
    return true;
  }

  private seedMatchesForDate(date: string) {
    const exact = seedMatches.filter((match) => match.matchDate === date);
    if (exact.length > 0) {
      return exact;
    }

    const ordered = [...seedMatches].sort((a, b) =>
      `${a.matchDate} ${a.kickoffTime}`.localeCompare(
        `${b.matchDate} ${b.kickoffTime}`,
      ),
    );
    const dateIndex =
      Math.floor(this.startOfBeijingDay(date).getTime() / ONE_DAY_MS) %
      ordered.length;

    return Array.from({ length: 4 }, (_, index) =>
      ordered[(dateIndex + index) % ordered.length],
    );
  }

  private async findTeam(team: {
    name?: string | null;
    nameEn?: string | null;
    fifaCode?: string | null;
  }) {
    const or: Prisma.TeamWhereInput[] = [];
    if (team.fifaCode) {
      or.push({ fifaCode: team.fifaCode });
    }
    if (team.name) {
      or.push({ name: team.name });
    }
    if (team.nameEn) {
      or.push({ nameEn: team.nameEn });
    }

    if (or.length === 0) {
      return null;
    }

    return this.prisma.team.findFirst({ where: { OR: or } });
  }

  private async findExistingMatch(
    externalId: string,
    date: string,
    homeTeamId: string,
    awayTeamId: string,
  ) {
    return this.prisma.match.findFirst({
      where: {
        OR: [
          { externalId },
          {
            matchDate: this.startOfBeijingDay(date),
            homeTeamId,
            awayTeamId,
          },
        ],
      },
    });
  }

  private nextPredictionDates() {
    const today = this.toBeijingDateString(new Date());
    const dates = Array.from({ length: 4 }, (_, index) =>
      this.addBeijingDays(new Date(), index),
    );

    return Array.from(new Set([today, ...dates]));
  }

  private statusFromKickoff(
    kickoffAt: Date,
    homeScore?: number | null,
    awayScore?: number | null,
    now = new Date(),
  ) {
    if (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined) {
      return MatchStatus.FINISHED;
    }

    if (now.getTime() < kickoffAt.getTime()) {
      return MatchStatus.SCHEDULED;
    }

    if (now.getTime() < kickoffAt.getTime() + 120 * 60_000) {
      return MatchStatus.LIVE;
    }

    return MatchStatus.FINISHED;
  }

  private kickoffAt(date: string, kickoffTime: string) {
    return new Date(`${date}T${kickoffTime}:00+08:00`);
  }

  private startOfBeijingDay(date: string) {
    return new Date(`${date}T00:00:00+08:00`);
  }

  private addBeijingDays(date: Date, days: number) {
    return this.toBeijingDateString(new Date(date.getTime() + days * ONE_DAY_MS));
  }

  private toBeijingDateString(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private beijingTimeString(date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: this.timezone(),
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  private matchIdFromExternal(externalId: string) {
    return `match_${externalId.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  }

  private predictionLockMinutes() {
    return Number(this.configService.get('PREDICTION_LOCK_MINUTES', 30));
  }

  private demoFallbackEnabled() {
    return this.configService.get<string>('JOBS_DEMO_FALLBACK_ENABLE', 'true') !== 'false';
  }

  private isEnabled() {
    return this.configService.get<string>('JOBS_ENABLE', 'true') !== 'false';
  }

  private timezone() {
    return this.configService.get<string>('APP_TIMEZONE', DEFAULT_TIMEZONE);
  }

  private createSummary(trigger: JobTrigger): JobRunSummary {
    return {
      status: 'RUNNING',
      trigger,
      startedAt: new Date().toISOString(),
      refreshedMatches: 0,
      generatedPredictions: 0,
      skippedPredictions: 0,
      settledMatches: 0,
      statsCalculated: false,
    };
  }
}
