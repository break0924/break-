import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  AiJobStatus,
  MatchStatus,
  PredictionArchiveStatus,
  PredictionDirection,
  PredictionHitStatus,
  PredictionVersionType,
  Prisma,
} from '@prisma/client';
import { createHash } from 'crypto';
import { AiService } from '../ai/ai.service';
import { AiMatchContext } from '../ai/ai.types';
import { demoPredictionArchives } from '../demo/demo-data';
import { FormEngineService } from '../form-engine';
import { HeadToHeadEngineService } from '../head-to-head-engine';
import {
  CalibrationParameters,
  PredictionEngineInput,
  PredictionEngineOutput,
  PredictionEngineService,
} from '../prediction-engine';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateDailyPredictionsDto } from './dto/generate-daily-predictions.dto';
import {
  getPredictionScheduleConfig,
  predictionDueScanCron,
  predictionGenerateCron,
  predictionLockScanCron,
  predictionPublishCron,
  predictionTimeZone,
  type PredictionScheduleConfig,
} from './prediction-schedule.config';
import { PublishPredictionsDto } from './dto/publish-predictions.dto';
import { RecordMatchResultDto } from './dto/record-match-result.dto';

type MatchWithTeams = Prisma.MatchGetPayload<{
  include: { homeTeam: true; awayTeam: true };
}>;

type ArchivePredictionStage = 'DRAFT' | 'PUBLISHED' | 'FINAL' | 'LOCKED';

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
    private readonly predictionEngineService: PredictionEngineService,
    private readonly formEngineService: FormEngineService,
    private readonly headToHeadEngineService: HeadToHeadEngineService,
  ) {}

  @Cron(predictionGenerateCron(), { timeZone: predictionTimeZone() })
  async generateTomorrowDraftsByCron() {
    try {
      const targetDate = this.addBeijingDays(new Date(), 1);
      await this.runLoggedTask(
        'PREDICTION_NEXT_DAY_GENERATE',
        targetDate,
        () => this.generateDailyDrafts({ date: targetDate }),
      );
    } catch (error) {
      this.logger.error('Next-day prediction archive generation failed', error);
    }
  }

  @Cron(predictionPublishCron(), { timeZone: predictionTimeZone() })
  async publishTomorrowByCron() {
    try {
      const targetDate = this.addBeijingDays(new Date(), 1);
      await this.runLoggedTask('PREDICTION_NEXT_DAY_PUBLISH', targetDate, () =>
        this.publishPredictions({ date: targetDate }),
      );
    } catch (error) {
      this.logger.error('Next-day prediction archive publish failed', error);
    }
  }

  @Cron(predictionDueScanCron(), { timeZone: predictionTimeZone() })
  async generateDueRefreshVersionsByCron() {
    try {
      await this.runLoggedTask('PREDICTION_DUE_REFRESH_SCAN', null, () =>
        this.generateDueRefreshVersions(),
      );
    } catch (error) {
      this.logger.error('Due prediction refresh generation failed', error);
    }
  }

  @Cron(predictionLockScanCron(), { timeZone: predictionTimeZone() })
  async lockDuePredictionsByCron() {
    try {
      await this.runLoggedTask('PREDICTION_LOCK_SCAN', null, () =>
        this.lockDuePredictions(),
      );
    } catch (error) {
      this.logger.error('Prediction lock scan failed', error);
    }
  }

  async generateDailyDrafts(dto: GenerateDailyPredictionsDto) {
    const window = this.predictionWindow(dto.date);
    const matches = await this.findMatchesInWindow(window.start, window.end);

    if (matches.length === 0) {
      return {
        date: window.businessDate,
        windowStart: window.start,
        windowEnd: window.end,
        source: 'database',
        status: 'NO_MATCHES',
        count: 0,
        predictions: [],
      };
    }

    const records = [];
    const skipped = [];
    for (const match of matches) {
      if (this.isMatchLockedForPrediction(match)) {
        skipped.push({
          matchId: match.id,
          reason: 'PREDICTION_LOCKED',
        });
        continue;
      }

      const context = await this.buildAiMatchContext(match);
      const report = await this.aiService.generateMatchReport(context);

      records.push(
        await this.saveDraftFromReport(match, report, context, {
          isMemberContent: dto.isMemberContent ?? false,
          isPublic: dto.isPublic ?? true,
        }),
      );
    }

    return {
      date: window.businessDate,
      windowStart: window.start,
      windowEnd: window.end,
      status: 'DRAFT_SAVED',
      count: records.length,
      skippedCount: skipped.length,
      predictions: records,
      skipped,
    };
  }

  async generateByDate(dto: GenerateDailyPredictionsDto) {
    if (!dto.date) {
      throw new BadRequestException('date is required');
    }

    const result = await this.generateDailyDrafts(dto);

    if (!dto.publish || result.count === 0) {
      return result;
    }

    const published = await this.publishPredictions({ date: dto.date });

    return {
      ...result,
      published,
    };
  }

  async generateByMatch(matchId: string) {
    const match = await this.getMatchForPrediction(matchId);
    return this.repairMissingPredictionForMatch(match);
  }

  async checkMissingPredictions(input: { matchId?: string; date?: string }) {
    if (input.matchId) {
      const match = await this.getMatchForPrediction(input.matchId);
      return {
        scope: 'MATCH',
        results: [await this.repairMissingPredictionForMatch(match)],
      };
    }

    const window = this.predictionWindow(
      input.date || this.toBeijingDateString(new Date()),
    );
    const matches = await this.findMatchesInWindow(window.start, window.end);
    const results = [];

    for (const match of matches) {
      results.push(await this.repairMissingPredictionForMatch(match));
    }

    return {
      scope: 'DATE',
      date: window.businessDate,
      checkedCount: matches.length,
      generatedCount: results.filter((item) => item.status === 'GENERATED').length,
      skippedCount: results.filter((item) => item.status !== 'GENERATED').length,
      results,
    };
  }

  async generateNextDay() {
    const date = this.addBeijingDays(new Date(), 1);
    return this.generateDailyDrafts({ date });
  }

  async publishNextDay() {
    const date = this.addBeijingDays(new Date(), 1);
    return this.publishPredictions({ date });
  }

  async refreshMatchPrediction(matchId: string) {
    const match = await this.getMatchForPrediction(matchId);
    if (this.isMatchLockedForPrediction(match)) {
      return {
        status: 'SKIPPED',
        reason: 'PREDICTION_LOCKED',
        matchId,
      };
    }

    return this.createArchiveForMatch(match, 'PUBLISHED', 'PRE_MATCH_6H');
  }

  async finalizeMatchPrediction(matchId: string) {
    const match = await this.getMatchForPrediction(matchId);
    if (this.isMatchLockedForPrediction(match)) {
      return {
        status: 'SKIPPED',
        reason: 'PREDICTION_LOCKED',
        matchId,
      };
    }

    return this.createArchiveForMatch(match, 'FINAL', 'PRE_MATCH_90M');
  }

  async lockMatchPrediction(matchId: string) {
    const now = new Date();
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const predictionLockAt = this.predictionLockAt(match.kickoffAt);
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        predictionLockAt,
        predictionLockedAt: match.predictionLockedAt ?? now,
      },
    });

    const [archives, versions] = await Promise.all([
      this.prisma.predictionArchive.updateMany({
        where: {
          matchId,
          lockedAt: null,
        },
        data: {
          lockedAt: now,
          predictionStage: 'LOCKED',
        },
      }),
      this.prisma.predictionVersion.updateMany({
        where: {
          matchId,
          lockedAt: null,
        },
        data: { lockedAt: now },
      }),
    ]);

    return {
      status: 'LOCKED',
      matchId,
      predictionLockAt,
      lockedAt: now,
      lockedArchives: archives.count,
      lockedVersions: versions.count,
    };
  }

  async publishPredictions(dto: PublishPredictionsDto) {
    const where: Prisma.PredictionArchiveWhereInput = {
      status: PredictionArchiveStatus.DRAFT,
    };

    if (dto.ids?.length) {
      where.id = { in: dto.ids };
    } else {
      const { start, end } = this.predictionWindow(dto.date);
      where.kickoffAt = { gte: start, lt: end };
    }

    const drafts = await this.prisma.predictionArchive
      .findMany({
        where,
        orderBy: { kickoffAt: 'asc' },
        include: this.archiveInclude(),
      })
      .catch(() => null);

    if (!drafts) {
      throw new BadRequestException('Prediction archive database unavailable');
    }

    if (drafts.length === 0) {
      return {
        status: 'NO_DRAFTS',
        count: 0,
        predictions: [],
      };
    }

    const published = [];
    for (const draft of drafts) {
      published.push(
        await this.prisma.predictionArchive.update({
          where: { id: draft.id },
          data: {
            status: PredictionArchiveStatus.PUBLISHED,
            predictionStage: 'PUBLISHED',
            publishedAt: new Date(),
          },
          include: this.archiveInclude(),
        }),
      );
    }

    return {
      status: 'PUBLISHED',
      count: published.length,
      predictions: published.map((item) => this.presentArchive(item)),
    };
  }

  async getToday(date?: string) {
    const window = this.predictionWindow(
      date || this.toBeijingDateString(new Date()),
    );
    const archives = await this.prisma.predictionArchive
      .findMany({
        where: {
          status: PredictionArchiveStatus.PUBLISHED,
          isPublic: true,
          kickoffAt: { gte: window.start, lt: window.end },
        },
        orderBy: { kickoffAt: 'asc' },
        include: this.archiveInclude(),
      })
      .catch(() => []);

    if (archives.length === 0) {
      return {
        date: window.businessDate,
        source: 'demo',
        predictions: this.filterDemoArchives({
          date: window.businessDate,
        }),
      };
    }

    return {
      date: window.businessDate,
      source: 'database',
      predictions: archives.map((item) => this.presentArchive(item)),
    };
  }

  async getArchive(query: { date?: string; hit?: 'hit' | 'miss' | 'pending' }) {
    const where: Prisma.PredictionArchiveWhereInput = {
      status: PredictionArchiveStatus.PUBLISHED,
      isPublic: true,
    };

    if (query.date) {
      const day = this.toBeijingDateOnly(new Date(query.date));
      const { start, end } = this.dayRange(day);
      where.kickoffAt = { gte: start, lt: end };
    }

    if (query.hit === 'pending') {
      where.settlement = null;
    } else if (query.hit === 'hit') {
      where.settlement = { hitResult: true };
    } else if (query.hit === 'miss') {
      where.settlement = { hitResult: false };
    }

    const archives = await this.prisma.predictionArchive
      .findMany({
        where,
        orderBy: [{ kickoffAt: 'desc' }, { publishedAt: 'desc' }],
        include: this.archiveInclude(),
        take: 200,
      })
      .catch(() => []);

    if (archives.length === 0) {
      return {
        source: 'demo',
        predictions: this.filterDemoArchives(query),
      };
    }

    return {
      source: 'database',
      predictions: archives.map((item) => this.presentArchive(item)),
    };
  }

  async getByMatchId(matchId: string) {
    const archive = await this.prisma.predictionArchive
      .findFirst({
        where: {
          matchId,
          status: PredictionArchiveStatus.PUBLISHED,
          isPublic: true,
        },
        orderBy: [{ publishedAt: 'desc' }, { predictionTime: 'desc' }],
        include: this.archiveInclude(),
      })
      .catch(() => null);

    if (!archive) {
      const demo = demoPredictionArchives.find((item) => item.matchId === matchId);
      if (demo) {
        return this.presentArchive(demo);
      }

      throw new NotFoundException('Prediction archive not found');
    }

    return this.presentArchive(archive);
  }

  async getStats() {
    try {
      const [totalPredictions, settled, recentArchives] = await Promise.all([
        this.prisma.predictionArchive.count({
          where: {
            status: PredictionArchiveStatus.PUBLISHED,
            isPublic: true,
          },
        }),
        this.prisma.predictionSettlement.findMany({
          where: {
            predictionArchive: {
              status: PredictionArchiveStatus.PUBLISHED,
              isPublic: true,
            },
          },
          orderBy: { settledAt: 'desc' },
          include: {
            predictionArchive: {
              include: {
                featureSnapshot: true,
                match: {
                  include: { homeTeam: true, awayTeam: true },
                },
                corrections: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        }),
        this.prisma.predictionArchive.findMany({
          where: {
            status: PredictionArchiveStatus.PUBLISHED,
            isPublic: true,
          },
          orderBy: [{ publishedAt: 'desc' }, { kickoffAt: 'desc' }],
          take: 10,
          include: this.archiveInclude(),
        }),
      ]);

      if (totalPredictions === 0 && settled.length === 0) {
        return this.emptyStats();
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const last7Settled = settled.filter(
        (item) => item.settledAt.getTime() >= sevenDaysAgo.getTime(),
      );
      const last30Settled = settled.slice(0, 30);
      const backtest = this.buildBacktestSummary(settled);

      return {
        totalPredictions,
        settledPredictions: settled.length,
        last7DaysHitRate: this.rate(last7Settled, 'hitResult'),
        last30MatchesHitRate: this.rate(last30Settled, 'hitResult'),
        resultHitRate: this.rate(settled, 'hitResult'),
        scoreHitRate: this.rate(settled, 'hitScore'),
        scoreCandidateHitRate: this.scoreCandidateHitRate(settled),
        totalGoalsHitRate: this.rate(settled, 'hitTotalGoals'),
        totalGoalsRangeHitRate: this.totalGoalsRangeHitRate(settled),
        currentHitStreak: this.currentStreak(settled),
        bestHitStreak: this.bestStreak(settled),
        backtest,
        highConfidenceStats: backtest.highConfidence,
        cautiousStats: backtest.cautious,
        recentPredictions: recentArchives.map((item) =>
          this.presentArchive(item),
        ),
      };
    } catch {
      return this.demoStats();
    }
  }

  async recordMatchResult(matchId: string, dto: RecordMatchResultDto) {
    const match = await this.prisma.match
      .update({
        where: { id: matchId },
        data: {
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          status: MatchStatus.FINISHED,
        },
        include: { homeTeam: true, awayTeam: true },
      })
      .catch(() => null);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const settlement = await this.settleMatch(matchId, undefined, true);

    return {
      match,
      settlement,
    };
  }

  async updateMatchPreMatchContext(
    matchId: string,
    dto: {
      homeInjuryImpact?: number;
      awayInjuryImpact?: number;
      homeInjuryNotes?: unknown;
      awayInjuryNotes?: unknown;
      homeLineupStatus?: unknown;
      awayLineupStatus?: unknown;
      homeLineupStability?: number;
      awayLineupStability?: number;
      homeMotivationScore?: number;
      awayMotivationScore?: number;
      weatherImpact?: number;
      weatherSnapshot?: unknown;
      homeTravelFatigue?: number;
      awayTravelFatigue?: number;
      travelSnapshot?: unknown;
    },
  ) {
    const data: Prisma.MatchUpdateInput = {};

    if (dto.homeInjuryImpact !== undefined) {
      data.homeInjuryImpact = this.clampNumber(
        dto.homeInjuryImpact,
        -20,
        20,
        0,
      );
    }
    if (dto.awayInjuryImpact !== undefined) {
      data.awayInjuryImpact = this.clampNumber(
        dto.awayInjuryImpact,
        -20,
        20,
        0,
      );
    }
    if (dto.homeInjuryNotes !== undefined) {
      data.homeInjuryNotes = dto.homeInjuryNotes as Prisma.InputJsonValue;
    }
    if (dto.awayInjuryNotes !== undefined) {
      data.awayInjuryNotes = dto.awayInjuryNotes as Prisma.InputJsonValue;
    }
    if (dto.homeLineupStatus !== undefined) {
      data.homeLineupStatus = dto.homeLineupStatus as Prisma.InputJsonValue;
    }
    if (dto.awayLineupStatus !== undefined) {
      data.awayLineupStatus = dto.awayLineupStatus as Prisma.InputJsonValue;
    }
    if (dto.homeLineupStability !== undefined) {
      data.homeLineupStability = this.clampNumber(
        dto.homeLineupStability,
        0,
        100,
        60,
      );
    }
    if (dto.awayLineupStability !== undefined) {
      data.awayLineupStability = this.clampNumber(
        dto.awayLineupStability,
        0,
        100,
        60,
      );
    }
    if (dto.homeMotivationScore !== undefined) {
      data.homeMotivationScore = this.clampNumber(
        dto.homeMotivationScore,
        0,
        100,
        50,
      );
    }
    if (dto.awayMotivationScore !== undefined) {
      data.awayMotivationScore = this.clampNumber(
        dto.awayMotivationScore,
        0,
        100,
        50,
      );
    }
    if (dto.weatherImpact !== undefined) {
      data.weatherImpact = this.clampNumber(dto.weatherImpact, 0, 20, 0);
    }
    if (dto.weatherSnapshot !== undefined) {
      data.weatherSnapshot = dto.weatherSnapshot as Prisma.InputJsonValue;
    }
    if (dto.homeTravelFatigue !== undefined) {
      data.homeTravelFatigue = this.clampNumber(
        dto.homeTravelFatigue,
        0,
        20,
        0,
      );
    }
    if (dto.awayTravelFatigue !== undefined) {
      data.awayTravelFatigue = this.clampNumber(
        dto.awayTravelFatigue,
        0,
        20,
        0,
      );
    }
    if (dto.travelSnapshot !== undefined) {
      data.travelSnapshot = dto.travelSnapshot as Prisma.InputJsonValue;
    }

    if (Object.keys(data).length > 0) {
      data.preMatchDataUpdatedAt = new Date();
    }

    const match = await this.prisma.match
      .update({
        where: { id: matchId },
        data,
        include: { homeTeam: true, awayTeam: true },
      })
      .catch(() => null);

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return {
      status: 'UPDATED',
      matchId,
      preMatchDataUpdatedAt: match.preMatchDataUpdatedAt,
      v2PreMatchContext: this.matchPreMatchContext(match),
    };
  }

  async createMatchOddsSnapshot(
    matchId: string,
    dto: {
      provider?: string;
      capturedAt?: string;
      openingHomeOdds?: number;
      openingDrawOdds?: number;
      openingAwayOdds?: number;
      currentHomeOdds: number;
      currentDrawOdds: number;
      currentAwayOdds: number;
      asianHandicapLine?: string;
      asianHandicapHomeOdds?: number;
      asianHandicapAwayOdds?: number;
      overUnderLine?: number;
      overOdds?: number;
      underOdds?: number;
      rawPayload?: unknown;
    },
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const current = {
      home: this.positiveDecimal(dto.currentHomeOdds, 'currentHomeOdds'),
      draw: this.positiveDecimal(dto.currentDrawOdds, 'currentDrawOdds'),
      away: this.positiveDecimal(dto.currentAwayOdds, 'currentAwayOdds'),
    };
    const implied = this.impliedProbabilities(current.home, current.draw, current.away);
    const normalized = this.normalizedProbabilities(implied);
    const opening = {
      home:
        dto.openingHomeOdds !== undefined
          ? this.positiveDecimal(dto.openingHomeOdds, 'openingHomeOdds')
          : undefined,
      draw:
        dto.openingDrawOdds !== undefined
          ? this.positiveDecimal(dto.openingDrawOdds, 'openingDrawOdds')
          : undefined,
      away:
        dto.openingAwayOdds !== undefined
          ? this.positiveDecimal(dto.openingAwayOdds, 'openingAwayOdds')
          : undefined,
    };

    const snapshot = await this.prisma.matchOddsSnapshot.create({
      data: {
        matchId,
        provider: dto.provider || 'MANUAL',
        capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : new Date(),
        openingHomeOdds:
          opening.home !== undefined ? new Prisma.Decimal(opening.home) : undefined,
        openingDrawOdds:
          opening.draw !== undefined ? new Prisma.Decimal(opening.draw) : undefined,
        openingAwayOdds:
          opening.away !== undefined ? new Prisma.Decimal(opening.away) : undefined,
        currentHomeOdds: new Prisma.Decimal(current.home),
        currentDrawOdds: new Prisma.Decimal(current.draw),
        currentAwayOdds: new Prisma.Decimal(current.away),
        impliedHomeProbability: new Prisma.Decimal(implied.homeWin),
        impliedDrawProbability: new Prisma.Decimal(implied.draw),
        impliedAwayProbability: new Prisma.Decimal(implied.awayWin),
        normalizedHomeProbability: new Prisma.Decimal(normalized.homeWin),
        normalizedDrawProbability: new Prisma.Decimal(normalized.draw),
        normalizedAwayProbability: new Prisma.Decimal(normalized.awayWin),
        homeOddsMovement:
          opening.home !== undefined
            ? new Prisma.Decimal(Number((current.home - opening.home).toFixed(3)))
            : undefined,
        drawOddsMovement:
          opening.draw !== undefined
            ? new Prisma.Decimal(Number((current.draw - opening.draw).toFixed(3)))
            : undefined,
        awayOddsMovement:
          opening.away !== undefined
            ? new Prisma.Decimal(Number((current.away - opening.away).toFixed(3)))
            : undefined,
        asianHandicapLine: dto.asianHandicapLine,
        asianHandicapHomeOdds:
          dto.asianHandicapHomeOdds !== undefined
            ? new Prisma.Decimal(
                this.positiveDecimal(
                  dto.asianHandicapHomeOdds,
                  'asianHandicapHomeOdds',
                ),
              )
            : undefined,
        asianHandicapAwayOdds:
          dto.asianHandicapAwayOdds !== undefined
            ? new Prisma.Decimal(
                this.positiveDecimal(
                  dto.asianHandicapAwayOdds,
                  'asianHandicapAwayOdds',
                ),
              )
            : undefined,
        overUnderLine:
          dto.overUnderLine !== undefined
            ? new Prisma.Decimal(this.clampNumber(dto.overUnderLine, 0, 10, 2.5))
            : undefined,
        overOdds:
          dto.overOdds !== undefined
            ? new Prisma.Decimal(this.positiveDecimal(dto.overOdds, 'overOdds'))
            : undefined,
        underOdds:
          dto.underOdds !== undefined
            ? new Prisma.Decimal(this.positiveDecimal(dto.underOdds, 'underOdds'))
            : undefined,
        rawPayload:
          dto.rawPayload !== undefined
            ? (dto.rawPayload as Prisma.InputJsonValue)
            : undefined,
      },
    });

    return {
      status: 'CREATED',
      matchId,
      oddsSnapshot: this.presentOddsSnapshot(snapshot),
    };
  }

  async settleMatch(matchId: string, settledByUserId?: string, force = false) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.homeScore === null || match.awayScore === null) {
      throw new BadRequestException('Match score is required before settlement');
    }

    const archives = await this.prisma.predictionArchive.findMany({
      where: {
        matchId,
        status: PredictionArchiveStatus.PUBLISHED,
        ...(force ? {} : { settlement: null }),
      },
      include: this.archiveInclude(),
    });

    const resultDirection = this.directionFromScore(
      match.homeScore,
      match.awayScore,
    );

    const settlements = [];
    for (const archive of archives) {
      settlements.push(
        await this.prisma.predictionSettlement.upsert({
          where: { predictionArchiveId: archive.id },
          update: {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            resultDirection,
            hitResult: archive.recommendationDirection === resultDirection,
            hitScore:
              archive.predictedHome === match.homeScore &&
              archive.predictedAway === match.awayScore,
            hitTotalGoals:
              archive.totalGoalsPrediction === match.homeScore + match.awayScore,
            settledAt: new Date(),
            settledByUserId,
          },
          create: {
            predictionArchiveId: archive.id,
            matchId,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            resultDirection,
            hitResult: archive.recommendationDirection === resultDirection,
            hitScore:
              archive.predictedHome === match.homeScore &&
              archive.predictedAway === match.awayScore,
            hitTotalGoals:
              archive.totalGoalsPrediction === match.homeScore + match.awayScore,
            settledByUserId,
          },
          include: {
            predictionArchive: true,
          },
        }),
      );
    }

    const versionSettlement = await this.settlePredictionVersions(match, force);
    const backtest = await this.runBacktest();

    return {
      matchId,
      resultDirection,
      settledCount: settlements.length,
      skipped: settlements.length === 0,
      predictionVersionSettlement: versionSettlement,
      backtest,
      force,
      settlements,
    };
  }

  async runBacktest() {
    const settlements = await this.prisma.predictionSettlement.findMany({
      where: {
        predictionArchive: {
          status: PredictionArchiveStatus.PUBLISHED,
          isPublic: true,
        },
      },
      orderBy: { settledAt: 'desc' },
      include: {
        predictionArchive: {
          include: {
            featureSnapshot: true,
            match: {
              include: { homeTeam: true, awayTeam: true },
            },
          },
        },
      },
    });

    return this.buildBacktestSummary(settlements);
  }

  async getModelCalibration() {
    const calibration = await this.prisma.predictionModelCalibration.findFirst({
      where: {
        modelVersion: this.predictionEngineService.getModelVersion(),
        scope: 'GLOBAL',
      },
      orderBy: { trainedAt: 'desc' },
    });

    return {
      modelVersion: this.predictionEngineService.getModelVersion(),
      calibration,
      backtest: await this.runBacktest(),
    };
  }

  async trainModelCalibration() {
    const settlements = await this.prisma.predictionSettlement.findMany({
      where: {
        predictionArchive: {
          status: PredictionArchiveStatus.PUBLISHED,
          isPublic: true,
        },
      },
      orderBy: { settledAt: 'desc' },
      include: {
        predictionArchive: {
          include: {
            featureSnapshot: true,
            match: {
              include: { homeTeam: true, awayTeam: true },
            },
          },
        },
      },
    });
    const backtest = this.buildBacktestSummary(settlements);
    const oddsStats = this.oddsReliabilityStats(settlements);
    const resultHitRate = Number(backtest.resultHitRate || 0);
    const scoreCandidateHitRate = Number(backtest.scoreCandidateHitRate || 0);
    const totalGoalsRangeHitRate = Number(backtest.totalGoalsRangeHitRate || 0);
    const oddsBlendWeight =
      oddsStats.count >= 10 && oddsStats.oddsHitRate > resultHitRate + 3
        ? 0.16
        : oddsStats.count >= 5 && oddsStats.oddsHitRate >= resultHitRate
          ? 0.12
          : 0.08;
    const parameters: CalibrationParameters = {
      modelBlendWeight: Number((1 - oddsBlendWeight).toFixed(2)),
      oddsBlendWeight,
      dixonColesRho: scoreCandidateHitRate < 18 ? -0.1 : -0.07,
      styleGoalMultiplier:
        totalGoalsRangeHitRate < 45
          ? 0.98
          : totalGoalsRangeHitRate > 58
            ? 1.02
            : 1,
      highConfidenceScoreMin: resultHitRate >= 58 ? 70 : 74,
      highConfidenceRiskMax: resultHitRate >= 58 ? 52 : 48,
      cautiousRiskThreshold: resultHitRate >= 55 ? 66 : 62,
    };

    const calibration = await this.prisma.predictionModelCalibration.upsert({
      where: {
        modelVersion_scope: {
          modelVersion: this.predictionEngineService.getModelVersion(),
          scope: 'GLOBAL',
        },
      },
      update: {
        sampleSize: settlements.length,
        brierScore: backtest.brierScore,
        resultHitRate,
        scoreCandidateHitRate,
        totalGoalsRangeHitRate,
        oddsAgreementHitRate: oddsStats.oddsHitRate,
        modelAgreementHitRate: oddsStats.modelHitRate,
        parameters: parameters as Prisma.JsonObject,
        trainedAt: new Date(),
      },
      create: {
        modelVersion: this.predictionEngineService.getModelVersion(),
        scope: 'GLOBAL',
        sampleSize: settlements.length,
        brierScore: backtest.brierScore,
        resultHitRate,
        scoreCandidateHitRate,
        totalGoalsRangeHitRate,
        oddsAgreementHitRate: oddsStats.oddsHitRate,
        modelAgreementHitRate: oddsStats.modelHitRate,
        parameters: parameters as Prisma.JsonObject,
      },
    });

    return {
      status: 'TRAINED',
      modelVersion: this.predictionEngineService.getModelVersion(),
      calibration,
      parameters,
      backtest,
      oddsStats,
    };
  }

  async generatePredictionVersions(
    predictionType: PredictionVersionType,
    date?: string,
  ) {
    if (predictionType === PredictionVersionType.PRE_MATCH) {
      return this.generateDueRefreshVersions();
    }

    const day = this.toBeijingDateOnly(
      date ? new Date(`${date}T00:00:00.000+08:00`) : new Date(),
    );
    const { start, end } = this.dayRange(day);
    const now = new Date();
    const matches = await this.prisma.match.findMany({
      where: {
        kickoffAt: { gte: start, lt: end, gt: now },
        status: MatchStatus.SCHEDULED,
      },
      orderBy: { kickoffAt: 'asc' },
      include: { homeTeam: true, awayTeam: true },
    });

    return this.generateVersionsForMatches(
      matches,
      predictionType,
      predictionType,
    );
  }

  async generateDuePreMatchPredictionVersions() {
    return this.generateDueRefreshVersions();
  }

  async generateDueRefreshVersions() {
    const config = this.scheduleConfig();
    const now = new Date();
    const sixHourStage = `PRE_MATCH_${config.refreshHoursBefore}H`;
    const finalStage = `PRE_MATCH_${config.finalRefreshMinutesBefore}M`;

    const [sixHourMatches, finalMatches] = await Promise.all([
      this.findDueRefreshMatches(
        now,
        config.refreshHoursBefore * 60,
        sixHourStage,
      ),
      this.findDueRefreshMatches(
        now,
        config.finalRefreshMinutesBefore,
        finalStage,
      ),
    ]);

    const sixHour = await this.generateVersionsForMatches(
      sixHourMatches,
      PredictionVersionType.PRE_MATCH,
      sixHourStage,
    );
    const final = await this.generateVersionsForMatches(
      finalMatches,
      PredictionVersionType.PRE_MATCH,
      finalStage,
    );

    return {
      status: 'DUE_REFRESH_DONE',
      timezone: config.timezone,
      stages: {
        [sixHourStage]: sixHour,
        [finalStage]: final,
      },
    };
  }

  async lockDuePredictions() {
    const config = this.scheduleConfig();
    const now = new Date();
    const dueBefore = new Date(now.getTime() + config.lockMinutes * 60 * 1000);
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        predictionLockedAt: null,
        kickoffAt: {
          gt: now,
          lte: dueBefore,
        },
      },
      orderBy: { kickoffAt: 'asc' },
      select: {
        id: true,
        kickoffAt: true,
      },
    });

    let lockedMatches = 0;
    let lockedArchives = 0;
    let lockedVersions = 0;

    for (const match of matches) {
      const predictionLockAt = this.predictionLockAt(match.kickoffAt);
      await this.prisma.match.update({
        where: { id: match.id },
        data: {
          predictionLockAt,
          predictionLockedAt: now,
        },
      });
      lockedMatches += 1;

      const archives = await this.prisma.predictionArchive.updateMany({
        where: {
          matchId: match.id,
          lockedAt: null,
        },
        data: {
          lockedAt: now,
        },
      });
      lockedArchives += archives.count;

      const versions = await this.prisma.predictionVersion.updateMany({
        where: {
          matchId: match.id,
          lockedAt: null,
        },
        data: {
          lockedAt: now,
        },
      });
      lockedVersions += versions.count;
    }

    return {
      status: 'LOCK_SCAN_DONE',
      timezone: config.timezone,
      lockMinutes: config.lockMinutes,
      lockedMatches,
      lockedArchives,
      lockedVersions,
    };
  }

  async getPredictionVersions(query: { matchId?: string; type?: string }) {
    const where: Prisma.PredictionVersionWhereInput = {};

    if (query.matchId) {
      where.matchId = query.matchId;
    }

    if (
      query.type &&
      Object.values(PredictionVersionType).includes(
        query.type as PredictionVersionType,
      )
    ) {
      where.predictionType = query.type as PredictionVersionType;
    }

    return this.prisma.predictionVersion.findMany({
      where,
      orderBy: [{ predictionTime: 'desc' }],
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      take: 200,
    });
  }

  private async generateVersionsForMatches(
    matches: MatchWithTeams[],
    predictionType: PredictionVersionType,
    refreshStage: PredictionVersionType | string,
  ) {
    const records = [];
    const skipped = [];

    for (const match of matches) {
      if (this.isMatchLockedForPrediction(match)) {
        skipped.push({
          matchId: match.id,
          reason: 'MATCH_STARTED_OR_LOCKED',
        });
        continue;
      }

      try {
        const stage = String(refreshStage);
        const version = await this.createPredictionVersion(
          match,
          predictionType,
          stage,
        );
        const archive =
          predictionType === PredictionVersionType.PRE_MATCH
            ? await this.createArchiveForMatch(
                match,
                stage.endsWith('M') ? 'FINAL' : 'PUBLISHED',
                stage,
              )
            : null;
        records.push({ version, archive });
      } catch (error) {
        skipped.push({
          matchId: match.id,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      predictionType,
      generatedCount: records.length,
      skippedCount: skipped.length,
      records,
      skipped,
    };
  }

  private async createPredictionVersion(
    match: MatchWithTeams,
    predictionType: PredictionVersionType,
    refreshStage: string,
  ) {
    if (this.isMatchLockedForPrediction(match)) {
      throw new BadRequestException('Match has started, prediction is locked');
    }

    const existing = await this.prisma.predictionVersion.findUnique({
      where: {
        matchId_predictionType_refreshStage: {
          matchId: match.id,
          predictionType,
          refreshStage,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const context = this.withPredictionRefreshContext(
      await this.buildAiMatchContext(match),
      predictionType,
      refreshStage,
    );
    const report = await this.aiService.generateMatchReport(context);
    const recommendationDirection = this.directionFromProbabilities(
      report.homeWinProb,
      report.drawProb,
      report.awayWinProb,
    );
    const predictionTime = new Date();
    const totalGoalsPrediction = report.predictedHome + report.predictedAway;
    const originalContent = {
      ...this.buildOriginalContent(match, report, context, {
        recommendationDirection,
        isMemberContent: false,
        isPublic: true,
      }),
      predictionTime: predictionTime.toISOString(),
      predictionType,
      refreshStage,
      versionPolicy: 'append_only',
      updateFocus: this.predictionTypeFocus(predictionType, refreshStage),
    };

    const data = {
      matchId: match.id,
      predictionTime,
      predictionType,
      refreshStage,
      scheduledFor: match.kickoffAt,
      recommendationDirection,
      winDrawLossProbability: {
        homeWin: report.homeWinProb,
        draw: report.drawProb,
        awayWin: report.awayWinProb,
      },
      scorePrediction: `${report.predictedHome}-${report.predictedAway}`,
      predictedHome: report.predictedHome,
      predictedAway: report.predictedAway,
      overUnderPrediction: this.overUnderText(totalGoalsPrediction),
      totalGoalsPrediction,
      confidenceScore: report.confidenceIndex,
      riskIndex: report.riskIndex,
      recommendationReason: report.summary,
      riskTip: this.extractRiskTip(report.fullContent),
      model: this.aiService.model,
      promptVersion: this.aiService.promptVersion,
      originalContent,
      contentHash: this.hashContent(originalContent),
    };

    try {
      return await this.prisma.predictionVersion.create({
        data,
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.prisma.predictionVersion.findUniqueOrThrow({
          where: {
            matchId_predictionType_refreshStage: {
              matchId: match.id,
              predictionType,
              refreshStage,
            },
          },
        });
      }

      throw error;
    }
  }

  private async settlePredictionVersions(match: MatchWithTeams, force: boolean) {
    if (match.homeScore === null || match.awayScore === null) {
      return {
        settledCount: 0,
        skipped: true,
        reason: 'MATCH_SCORE_REQUIRED',
      };
    }

    const resultDirection = this.directionFromScore(
      match.homeScore,
      match.awayScore,
    );
    const actualResult = `${match.homeScore}-${match.awayScore}`;

    const versions = await this.prisma.predictionVersion.findMany({
      where: {
        matchId: match.id,
        ...(force ? {} : { hitStatus: PredictionHitStatus.PENDING }),
      },
    });

    const updates = [];
    for (const version of versions) {
      const hitResult = version.recommendationDirection === resultDirection;
      const hitScore =
        version.predictedHome === match.homeScore &&
        version.predictedAway === match.awayScore;
      const hitTotalGoals =
        version.totalGoalsPrediction === match.homeScore + match.awayScore;

      updates.push(
        await this.prisma.predictionVersion.update({
          where: { id: version.id },
          data: {
            actualResult,
            hitStatus: hitResult
              ? PredictionHitStatus.HIT
              : PredictionHitStatus.MISS,
            hitResult,
            hitScore,
            hitTotalGoals,
            settledAt: new Date(),
          },
        }),
      );
    }

    return {
      settledCount: updates.length,
      resultDirection,
      actualResult,
    };
  }

  private async saveDraftFromReport(
    match: MatchWithTeams,
    report: {
      summary: string;
      fullContent: string;
      homeWinProb: number;
      drawProb: number;
      awayWinProb: number;
      predictedHome: number;
      predictedAway: number;
      riskIndex: number;
      confidenceIndex: number;
      aiAdjustment?: {
        homeWinDelta?: number;
        drawDelta?: number;
        awayWinDelta?: number;
        confidence?: number;
        reason?: string;
      };
    },
    context: AiMatchContext,
    options: {
      isMemberContent: boolean;
      isPublic: boolean;
      predictionStage?: ArchivePredictionStage;
      refreshStage?: string;
    },
  ) {
    const predictionStage = options.predictionStage ?? 'DRAFT';
    const promptVersion = this.stagePromptVersion(
      this.aiService.promptVersion,
      predictionStage,
      options.refreshStage,
    );
    const existing = await this.prisma.predictionArchive.findUnique({
      where: {
        matchId_promptVersion_engineModelVersion_isMemberContent_predictionStage: {
          matchId: match.id,
          promptVersion,
          engineModelVersion: this.predictionEngineService.getModelVersion(),
          isMemberContent: options.isMemberContent,
          predictionStage,
        },
      },
      include: this.archiveInclude(),
    });

    if (existing?.status === PredictionArchiveStatus.PUBLISHED || existing?.lockedAt) {
      return this.presentArchive(existing);
    }

    const engineInput = await this.buildPredictionEngineInput(match, report);
    const enginePrediction = this.predictionEngineService.predict(engineInput);
    const recommendationDirection =
      enginePrediction.recommendationDirection as PredictionDirection;
    const predictionTime = new Date();
    const engineArchiveSnapshot = this.buildEngineArchiveSnapshot(
      enginePrediction,
    );
    const originalContent = {
      ...this.buildOriginalContent(match, report, context, {
      recommendationDirection,
      isMemberContent: options.isMemberContent,
      isPublic: options.isPublic,
      }),
      predictionTime: predictionTime.toISOString(),
      predictionStage,
      refreshStage: options.refreshStage ?? null,
      predictionEngine: engineArchiveSnapshot,
    };
    const contentHash = this.hashContent(originalContent);

    const data = {
      homeTeamName: match.homeTeam.name,
      awayTeamName: match.awayTeam.name,
      kickoffAt: match.kickoffAt,
      predictionTime,
      generatedAt: predictionTime,
      recommendationDirection,
      homeWinProb: new Prisma.Decimal(enginePrediction.homeWinProbability),
      drawProb: new Prisma.Decimal(enginePrediction.drawProbability),
      awayWinProb: new Prisma.Decimal(enginePrediction.awayWinProbability),
      predictedHome: enginePrediction.recommendedScore.home,
      predictedAway: enginePrediction.recommendedScore.away,
      totalGoalsPrediction:
        enginePrediction.recommendedScore.home +
        enginePrediction.recommendedScore.away,
      confidenceIndex: enginePrediction.confidenceScore,
      riskIndex: enginePrediction.riskScore,
      recommendationReason: report.summary,
      riskTip: this.extractRiskTip(report.fullContent),
      model: this.aiService.model,
      promptVersion,
      engineModelVersion: enginePrediction.modelVersion,
      modelVersion: enginePrediction.modelVersion,
      predictionStage,
      engineWeightConfig: engineArchiveSnapshot.weightConfig,
      engineFactorScores: engineArchiveSnapshot.factorScores,
      finalProbability: engineArchiveSnapshot.finalProbability,
      predictedScore: `${enginePrediction.recommendedScore.home}-${enginePrediction.recommendedScore.away}`,
      confidenceLevel: enginePrediction.confidenceLevel,
      riskLevel: enginePrediction.riskLevel,
      shortAnalysis: report.summary,
      fullAnalysis: report.fullContent,
      disclaimer: this.extractRiskTip(report.fullContent),
      isMemberContent: options.isMemberContent,
      isPublic: options.isPublic,
      originalContent,
      contentHash,
      lockedAt: this.isMatchLockedForPrediction(match) ? new Date() : null,
    };

    if (existing) {
      const archive = await this.prisma.predictionArchive.update({
        where: { id: existing.id },
        data,
        include: this.archiveInclude(),
      });
      await this.saveFeatureSnapshot({
        archiveId: archive.id,
        match,
        context,
        report,
        engineInput,
        enginePrediction,
        engineArchiveSnapshot,
        predictionTime,
        promptVersion,
      });

      return archive;
    }

    const archive = await this.prisma.predictionArchive.create({
      data: {
        matchId: match.id,
        ...data,
      },
      include: this.archiveInclude(),
    });
    await this.saveFeatureSnapshot({
      archiveId: archive.id,
      match,
      context,
      report,
      engineInput,
      enginePrediction,
      engineArchiveSnapshot,
      predictionTime,
      promptVersion,
    });

    return archive;
  }

  private async saveFeatureSnapshot(input: {
    archiveId: string;
    match: MatchWithTeams;
    context: AiMatchContext;
    report: {
      summary: string;
      fullContent: string;
      aiAdjustment?: {
        homeWinDelta?: number;
        drawDelta?: number;
        awayWinDelta?: number;
        confidence?: number;
        reason?: string;
      };
    };
    engineInput: PredictionEngineInput;
    enginePrediction: PredictionEngineOutput;
    engineArchiveSnapshot: {
      weightConfig: Record<string, number>;
      factorScores: Array<Record<string, unknown>>;
      finalProbability: Record<string, unknown>;
    };
    predictionTime: Date;
    promptVersion: string;
  }) {
    const featureInputs = this.buildFeatureInputs(
      input.match,
      input.report,
      input.context,
      input.engineInput,
    );
    const dataQuality = this.buildSnapshotDataQuality(featureInputs);
    const productLabels = this.buildPredictionProductLabelsFromEngine(
      input.enginePrediction,
    );
    const modelOutput = {
      recommendationDirection: input.enginePrediction.recommendationDirection,
      homeWinProbability: input.enginePrediction.homeWinProbability,
      drawProbability: input.enginePrediction.drawProbability,
      awayWinProbability: input.enginePrediction.awayWinProbability,
      recommendedScore: input.enginePrediction.recommendedScore,
      predictedTotalGoals:
        input.enginePrediction.recommendedScore.home +
        input.enginePrediction.recommendedScore.away,
      scoreCandidates: input.enginePrediction.scoreCandidates,
      totalGoalsRange: input.enginePrediction.totalGoalsRange,
      overUnderLean: input.enginePrediction.overUnderLean,
      totalGoalsDistribution: input.enginePrediction.totalGoalsDistribution,
      riskLevel: input.enginePrediction.riskLevel,
      riskScore: input.enginePrediction.riskScore,
      confidenceLevel: input.enginePrediction.confidenceLevel,
      confidenceScore: input.enginePrediction.confidenceScore,
      riskBreakdown: input.enginePrediction.riskBreakdown,
      confidenceBreakdown: input.enginePrediction.confidenceBreakdown,
      isHighConfidence: productLabels.isHighConfidence,
      isCautious: productLabels.isCautious,
      confidenceTag: productLabels.confidenceTag,
      riskTag: productLabels.riskTag,
      modelReadinessTag: productLabels.modelReadinessTag,
      warnings: input.enginePrediction.warnings,
    };

    await this.prisma.predictionFeatureSnapshot.upsert({
      where: { archiveId: input.archiveId },
      update: {
        matchId: input.match.id,
        snapshotAt: input.predictionTime,
        modelVersion: input.enginePrediction.modelVersion,
        dataVersion: 'prediction-feature-snapshot-v2',
        promptVersion: input.promptVersion,
        featureInputs,
        rawInputs: {
          matchContext: input.context,
          aiReport: {
            summary: input.report.summary,
            aiAdjustment: this.safeAiAdjustment(input.report.aiAdjustment),
          },
        },
        factorScores:
          input.engineArchiveSnapshot.factorScores as Prisma.InputJsonValue,
        weightConfig: input.engineArchiveSnapshot.weightConfig,
        modelOutput,
        dataQuality,
      },
      create: {
        matchId: input.match.id,
        archiveId: input.archiveId,
        snapshotAt: input.predictionTime,
        modelVersion: input.enginePrediction.modelVersion,
        dataVersion: 'prediction-feature-snapshot-v2',
        promptVersion: input.promptVersion,
        featureInputs,
        rawInputs: {
          matchContext: input.context,
          aiReport: {
            summary: input.report.summary,
            aiAdjustment: this.safeAiAdjustment(input.report.aiAdjustment),
          },
        },
        factorScores:
          input.engineArchiveSnapshot.factorScores as Prisma.InputJsonValue,
        weightConfig: input.engineArchiveSnapshot.weightConfig,
        modelOutput,
        dataQuality,
      },
    });
  }

  private async createArchiveForMatch(
    match: MatchWithTeams,
    predictionStage: ArchivePredictionStage,
    refreshStage: string,
  ) {
    const context = this.withPredictionRefreshContext(
      await this.buildAiMatchContext(match),
      PredictionVersionType.PRE_MATCH,
      refreshStage,
    );
    const report = await this.aiService.generateMatchReport(context);
    const archive = await this.saveDraftFromReport(match, report, context, {
      isMemberContent: false,
      isPublic: true,
      predictionStage,
      refreshStage,
    });

    if (predictionStage === 'FINAL') {
      return this.prisma.predictionArchive.update({
        where: { id: archive.id },
        data: {
          status: PredictionArchiveStatus.PUBLISHED,
          publishedAt: archive.publishedAt ?? new Date(),
        },
        include: this.archiveInclude(),
      });
    }

    if (predictionStage === 'PUBLISHED') {
      return this.prisma.predictionArchive.update({
        where: { id: archive.id },
        data: {
          status: PredictionArchiveStatus.PUBLISHED,
          publishedAt: archive.publishedAt ?? new Date(),
        },
        include: this.archiveInclude(),
      });
    }

    return archive;
  }

  private async getMatchForPrediction(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  private async repairMissingPredictionForMatch(match: MatchWithTeams) {
    const existing = await this.prisma.predictionArchive.findFirst({
      where: {
        matchId: match.id,
        status: PredictionArchiveStatus.PUBLISHED,
        isPublic: true,
      },
      orderBy: [{ predictionStage: 'desc' }, { publishedAt: 'desc' }],
      include: this.archiveInclude(),
    });

    if (existing) {
      return {
        status: 'EXISTS',
        matchId: match.id,
        prediction: this.presentArchive(existing),
      };
    }

    if (this.predictionLockAt(match.kickoffAt) <= new Date()) {
      return {
        status: 'NOT_INCLUDED',
        matchId: match.id,
        reason: '本场未纳入预测',
        kickoffAt: match.kickoffAt,
      };
    }

    const archive = await this.createArchiveForMatch(
      match,
      'PUBLISHED',
      'MISSING_REPAIR',
    );

    return {
      status: 'GENERATED',
      matchId: match.id,
      prediction: this.presentArchive(archive),
    };
  }

  private async findMatchesInWindow(start: Date, end: Date) {
    return this.prisma.match.findMany({
      where: {
        kickoffAt: { gte: start, lt: end },
        status: {
          in: [MatchStatus.SCHEDULED, MatchStatus.LIVE],
        },
      },
      orderBy: { kickoffAt: 'asc' },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  private async findDueRefreshMatches(
    now: Date,
    minutesBeforeKickoff: number,
    refreshStage: string,
  ) {
    const dueBefore = new Date(now.getTime() + minutesBeforeKickoff * 60 * 1000);

    return this.prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        predictionLockedAt: null,
        kickoffAt: {
          gt: now,
          lte: dueBefore,
        },
        predictionVersions: {
          none: {
            predictionType: PredictionVersionType.PRE_MATCH,
            refreshStage,
          },
        },
      },
      orderBy: { kickoffAt: 'asc' },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  private async buildPredictionEngineInput(
    match: MatchWithTeams,
    report: {
      homeWinProb: number;
      drawProb: number;
      awayWinProb: number;
      predictedHome: number;
      predictedAway: number;
      confidenceIndex: number;
      aiAdjustment?: {
        homeWinDelta?: number;
        drawDelta?: number;
        awayWinDelta?: number;
        confidence?: number;
        reason?: string;
      };
    },
  ): Promise<PredictionEngineInput> {
    const aiAdjustment = this.safeAiAdjustment(report.aiAdjustment);
    const preMatchContext = this.matchPreMatchContext(match);
    const [homeForm, awayForm, headToHead, oddsSnapshot, calibration] =
      await Promise.all([
      this.formEngineService.getTeamForm(match.homeTeam.id, match.kickoffAt),
      this.formEngineService.getTeamForm(match.awayTeam.id, match.kickoffAt),
      this.headToHeadEngineService.getHeadToHead({
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        beforeDate: match.kickoffAt,
        sampleSize: 10,
      }),
      this.latestOddsSnapshot(match.id),
      this.latestModelCalibration(),
    ]);

    return {
      matchId: match.id,
      neutralVenue: true,
      homeTeam: {
        teamId: match.homeTeam.id,
        name: match.homeTeam.name,
        eloRating: match.homeTeam.eloRating,
        recent5: homeForm.recent5,
        recent10: homeForm.recent10,
        attackIndex: this.attackIndex(homeForm),
        defenseIndex: this.defenseIndex(homeForm),
        injuryImpact: preMatchContext.home.injuryImpact,
        lineupStability: preMatchContext.home.lineupStability,
        motivationScore: preMatchContext.home.motivationScore,
        travelFatigue: preMatchContext.home.travelFatigue,
        tempoIndex: this.teamTempoIndex(homeForm),
        directnessIndex: this.teamDirectnessIndex(homeForm),
        defensiveLineRisk: this.teamDefensiveLineRisk(homeForm),
        setPieceStrength: this.teamSetPieceStrength(homeForm),
      },
      awayTeam: {
        teamId: match.awayTeam.id,
        name: match.awayTeam.name,
        eloRating: match.awayTeam.eloRating,
        recent5: awayForm.recent5,
        recent10: awayForm.recent10,
        attackIndex: this.attackIndex(awayForm),
        defenseIndex: this.defenseIndex(awayForm),
        injuryImpact: preMatchContext.away.injuryImpact,
        lineupStability: preMatchContext.away.lineupStability,
        motivationScore: preMatchContext.away.motivationScore,
        travelFatigue: preMatchContext.away.travelFatigue,
        tempoIndex: this.teamTempoIndex(awayForm),
        directnessIndex: this.teamDirectnessIndex(awayForm),
        defensiveLineRisk: this.teamDefensiveLineRisk(awayForm),
        setPieceStrength: this.teamSetPieceStrength(awayForm),
      },
      headToHead,
      oddsSnapshot,
      weatherImpact: preMatchContext.weatherImpact,
      preMatchContext: {
        dataUpdatedAt: preMatchContext.dataUpdatedAt,
        homeLineupStatus: preMatchContext.home.lineupStatus,
        awayLineupStatus: preMatchContext.away.lineupStatus,
        homeInjuryNotes: preMatchContext.home.injuryNotes,
        awayInjuryNotes: preMatchContext.away.injuryNotes,
        weatherSnapshot: preMatchContext.weatherSnapshot,
        travelSnapshot: preMatchContext.travelSnapshot,
      },
      calibration,
      aiAdjustment: {
        homeWinDelta: aiAdjustment.homeWinDelta,
        drawDelta: aiAdjustment.drawDelta,
        awayWinDelta: aiAdjustment.awayWinDelta,
        confidence: aiAdjustment.confidence,
        reason: aiAdjustment.reason,
      },
    };
  }

  private async latestOddsSnapshot(matchId: string) {
    const snapshot = await this.prisma.matchOddsSnapshot.findFirst({
      where: { matchId },
      orderBy: { capturedAt: 'desc' },
    });

    return snapshot ? this.presentOddsSnapshot(snapshot) : undefined;
  }

  private async latestModelCalibration(): Promise<CalibrationParameters | undefined> {
    const calibration = await this.prisma.predictionModelCalibration.findFirst({
      where: {
        modelVersion: this.predictionEngineService.getModelVersion(),
        scope: 'GLOBAL',
      },
      orderBy: { trainedAt: 'desc' },
    });

    return this.normalizeCalibrationParameters(calibration?.parameters);
  }

  private normalizeCalibrationParameters(
    parameters: Prisma.JsonValue | undefined,
  ): CalibrationParameters | undefined {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
      return undefined;
    }

    const item = parameters as Record<string, unknown>;
    return {
      modelBlendWeight: this.optionalNumber(item.modelBlendWeight),
      oddsBlendWeight: this.optionalNumber(item.oddsBlendWeight),
      dixonColesRho: this.optionalNumber(item.dixonColesRho),
      styleGoalMultiplier: this.optionalNumber(item.styleGoalMultiplier),
      highConfidenceScoreMin: this.optionalNumber(item.highConfidenceScoreMin),
      highConfidenceRiskMax: this.optionalNumber(item.highConfidenceRiskMax),
      cautiousRiskThreshold: this.optionalNumber(item.cautiousRiskThreshold),
    };
  }

  private matchPreMatchContext(match: MatchWithTeams) {
    const item = match as MatchWithTeams & {
      homeInjuryImpact?: number | null;
      awayInjuryImpact?: number | null;
      homeInjuryNotes?: Prisma.JsonValue | null;
      awayInjuryNotes?: Prisma.JsonValue | null;
      homeLineupStatus?: Prisma.JsonValue | null;
      awayLineupStatus?: Prisma.JsonValue | null;
      homeLineupStability?: number | null;
      awayLineupStability?: number | null;
      homeMotivationScore?: number | null;
      awayMotivationScore?: number | null;
      weatherImpact?: number | null;
      weatherSnapshot?: Prisma.JsonValue | null;
      homeTravelFatigue?: number | null;
      awayTravelFatigue?: number | null;
      travelSnapshot?: Prisma.JsonValue | null;
      preMatchDataUpdatedAt?: Date | null;
    };

    return {
      dataUpdatedAt: item.preMatchDataUpdatedAt?.toISOString() ?? null,
      home: {
        injuryImpact: this.clampNumber(item.homeInjuryImpact ?? 0, -20, 20, 0),
        injuryNotes: item.homeInjuryNotes ?? null,
        lineupStatus: item.homeLineupStatus ?? null,
        lineupStability: this.clampNumber(
          item.homeLineupStability ?? 60,
          0,
          100,
          60,
        ),
        motivationScore: this.clampNumber(
          item.homeMotivationScore ?? 50,
          0,
          100,
          50,
        ),
        travelFatigue: this.clampNumber(
          item.homeTravelFatigue ?? 0,
          0,
          20,
          0,
        ),
      },
      away: {
        injuryImpact: this.clampNumber(item.awayInjuryImpact ?? 0, -20, 20, 0),
        injuryNotes: item.awayInjuryNotes ?? null,
        lineupStatus: item.awayLineupStatus ?? null,
        lineupStability: this.clampNumber(
          item.awayLineupStability ?? 60,
          0,
          100,
          60,
        ),
        motivationScore: this.clampNumber(
          item.awayMotivationScore ?? 50,
          0,
          100,
          50,
        ),
        travelFatigue: this.clampNumber(
          item.awayTravelFatigue ?? 0,
          0,
          20,
          0,
        ),
      },
      weatherImpact: this.clampNumber(item.weatherImpact ?? 0, 0, 20, 0),
      weatherSnapshot: item.weatherSnapshot ?? null,
      travelSnapshot: item.travelSnapshot ?? null,
    };
  }

  private presentOddsSnapshot(snapshot: {
    provider: string;
    capturedAt: Date;
    openingHomeOdds?: unknown;
    openingDrawOdds?: unknown;
    openingAwayOdds?: unknown;
    currentHomeOdds: unknown;
    currentDrawOdds: unknown;
    currentAwayOdds: unknown;
    impliedHomeProbability: unknown;
    impliedDrawProbability: unknown;
    impliedAwayProbability: unknown;
    normalizedHomeProbability: unknown;
    normalizedDrawProbability: unknown;
    normalizedAwayProbability: unknown;
    homeOddsMovement?: unknown;
    drawOddsMovement?: unknown;
    awayOddsMovement?: unknown;
    asianHandicapLine?: string | null;
    asianHandicapHomeOdds?: unknown;
    asianHandicapAwayOdds?: unknown;
    overUnderLine?: unknown;
    overOdds?: unknown;
    underOdds?: unknown;
  }) {
    return {
      provider: snapshot.provider,
      capturedAt: snapshot.capturedAt.toISOString(),
      current: {
        homeWinOdds: this.decimalNumber(snapshot.currentHomeOdds),
        drawOdds: this.decimalNumber(snapshot.currentDrawOdds),
        awayWinOdds: this.decimalNumber(snapshot.currentAwayOdds),
      },
      opening: {
        homeWinOdds: this.optionalDecimalNumber(snapshot.openingHomeOdds),
        drawOdds: this.optionalDecimalNumber(snapshot.openingDrawOdds),
        awayWinOdds: this.optionalDecimalNumber(snapshot.openingAwayOdds),
      },
      impliedProbability: {
        homeWin: this.decimalNumber(snapshot.impliedHomeProbability),
        draw: this.decimalNumber(snapshot.impliedDrawProbability),
        awayWin: this.decimalNumber(snapshot.impliedAwayProbability),
      },
      normalizedProbability: {
        homeWin: this.decimalNumber(snapshot.normalizedHomeProbability),
        draw: this.decimalNumber(snapshot.normalizedDrawProbability),
        awayWin: this.decimalNumber(snapshot.normalizedAwayProbability),
      },
      movement: {
        homeWinDelta: this.optionalDecimalNumber(snapshot.homeOddsMovement),
        drawDelta: this.optionalDecimalNumber(snapshot.drawOddsMovement),
        awayWinDelta: this.optionalDecimalNumber(snapshot.awayOddsMovement),
      },
      asianHandicap: {
        line: snapshot.asianHandicapLine ?? undefined,
        homeOdds: this.optionalDecimalNumber(snapshot.asianHandicapHomeOdds),
        awayOdds: this.optionalDecimalNumber(snapshot.asianHandicapAwayOdds),
      },
      overUnder: {
        line: this.optionalDecimalNumber(snapshot.overUnderLine),
        overOdds: this.optionalDecimalNumber(snapshot.overOdds),
        underOdds: this.optionalDecimalNumber(snapshot.underOdds),
      },
    };
  }

  private positiveDecimal(value: number, field: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 1) {
      throw new BadRequestException(`${field} must be greater than 1`);
    }

    return Number(numeric.toFixed(3));
  }

  private impliedProbabilities(homeOdds: number, drawOdds: number, awayOdds: number) {
    return {
      homeWin: Number(((1 / homeOdds) * 100).toFixed(2)),
      draw: Number(((1 / drawOdds) * 100).toFixed(2)),
      awayWin: Number(((1 / awayOdds) * 100).toFixed(2)),
    };
  }

  private normalizedProbabilities(probability: {
    homeWin: number;
    draw: number;
    awayWin: number;
  }) {
    const total = probability.homeWin + probability.draw + probability.awayWin;
    if (total <= 0) {
      return { homeWin: 34, draw: 32, awayWin: 34 };
    }

    return {
      homeWin: Number(((probability.homeWin / total) * 100).toFixed(2)),
      draw: Number(((probability.draw / total) * 100).toFixed(2)),
      awayWin: Number(((probability.awayWin / total) * 100).toFixed(2)),
    };
  }

  private safeAiAdjustment(adjustment?: {
    homeWinDelta?: number;
    drawDelta?: number;
    awayWinDelta?: number;
    confidence?: number;
    reason?: string;
  }) {
    return {
      homeWinDelta: this.clampNumber(adjustment?.homeWinDelta, -5, 5, 0),
      drawDelta: this.clampNumber(adjustment?.drawDelta, -5, 5, 0),
      awayWinDelta: this.clampNumber(adjustment?.awayWinDelta, -5, 5, 0),
      confidence: this.clampNumber(adjustment?.confidence, 1, 100, 50),
      reason:
        adjustment?.reason ||
        'AI仅提供赛前信息解读，未对模型概率做额外修正。',
    };
  }

  private attackIndex(form: {
    recent5: { averageGoalsFor: number; formScore: number };
    recent10: { averageGoalsFor: number; formScore: number };
  }) {
    const goalsScore = Math.min(
      100,
      Math.max(
        0,
        ((form.recent5.averageGoalsFor * 0.6 +
          form.recent10.averageGoalsFor * 0.4) /
          2.5) *
          100,
      ),
    );

    return Math.round(goalsScore * 0.72 + form.recent5.formScore * 0.28);
  }

  private defenseIndex(form: {
    recent5: { averageGoalsAgainst: number; formScore: number };
    recent10: { averageGoalsAgainst: number; formScore: number };
  }) {
    const conceded =
      form.recent5.averageGoalsAgainst * 0.6 +
      form.recent10.averageGoalsAgainst * 0.4;
    const concededScore = Math.min(100, Math.max(0, (1 - conceded / 2.5) * 100));

    return Math.round(concededScore * 0.72 + form.recent5.formScore * 0.28);
  }

  private teamTempoIndex(form: {
    recent5: {
      averageGoalsFor: number;
      averageGoalsAgainst: number;
      formScore: number;
    };
    recent10: {
      averageGoalsFor: number;
      averageGoalsAgainst: number;
      formScore: number;
    };
  }) {
    const recentGoals =
      form.recent5.averageGoalsFor + form.recent5.averageGoalsAgainst;
    const longerGoals =
      form.recent10.averageGoalsFor + form.recent10.averageGoalsAgainst;
    return Math.round(
      this.clampNumber((recentGoals * 0.65 + longerGoals * 0.35) * 18, 20, 85, 50),
    );
  }

  private teamDirectnessIndex(form: {
    recent5: { averageGoalsFor: number; goalDifference: number };
    recent10: { averageGoalsFor: number; goalDifference: number };
  }) {
    const scoring =
      form.recent5.averageGoalsFor * 0.7 + form.recent10.averageGoalsFor * 0.3;
    const goalDiff =
      form.recent5.goalDifference * 0.6 + form.recent10.goalDifference * 0.4;
    return Math.round(
      this.clampNumber(scoring * 24 + Math.max(-8, goalDiff) * 1.5, 20, 85, 50),
    );
  }

  private teamDefensiveLineRisk(form: {
    recent5: { averageGoalsAgainst: number };
    recent10: { averageGoalsAgainst: number };
  }) {
    const conceded =
      form.recent5.averageGoalsAgainst * 0.7 +
      form.recent10.averageGoalsAgainst * 0.3;
    return Math.round(this.clampNumber(conceded * 28, 10, 90, 50));
  }

  private teamSetPieceStrength(form: {
    recent5: { averageGoalsFor: number; formScore: number };
    recent10: { averageGoalsFor: number; formScore: number };
  }) {
    const scoring =
      form.recent5.averageGoalsFor * 0.55 + form.recent10.averageGoalsFor * 0.45;
    const formScore = form.recent5.formScore * 0.6 + form.recent10.formScore * 0.4;
    return Math.round(
      this.clampNumber(scoring * 18 + formScore * 0.35, 20, 85, 50),
    );
  }

  private buildFeatureInputs(
    match: MatchWithTeams,
    report: {
      aiAdjustment?: {
        homeWinDelta?: number;
        drawDelta?: number;
        awayWinDelta?: number;
        confidence?: number;
        reason?: string;
      };
    },
    context: AiMatchContext,
    engineInput: PredictionEngineInput,
  ) {
    const preMatchContext = this.matchPreMatchContext(match);
    return {
      match: {
        id: match.id,
        stage: match.stage,
        groupName: match.groupName,
        kickoffAt: match.kickoffAt.toISOString(),
        matchDate: match.matchDate ? this.toDateOnly(match.matchDate) : null,
        kickoffTime: match.kickoffTime,
        timezone: match.timezone,
        venue: match.venue,
        city: match.city,
        roundName: match.roundName,
        neutralVenue: true,
        preMatchDataUpdatedAt: preMatchContext.dataUpdatedAt,
      },
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        fifaCode: match.homeTeam.fifaCode,
        countryCode: match.homeTeam.countryCode,
        groupName: match.homeTeam.groupName,
        eloRating: match.homeTeam.eloRating,
        recent5: engineInput.homeTeam.recent5,
        recent10: engineInput.homeTeam.recent10,
        attackIndex: engineInput.homeTeam.attackIndex,
        defenseIndex: engineInput.homeTeam.defenseIndex,
        injuryImpact: engineInput.homeTeam.injuryImpact,
        injuryNotes: preMatchContext.home.injuryNotes,
        lineupStatus: preMatchContext.home.lineupStatus,
        lineupStability: engineInput.homeTeam.lineupStability,
        motivationScore: engineInput.homeTeam.motivationScore,
        travelFatigue: engineInput.homeTeam.travelFatigue,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        fifaCode: match.awayTeam.fifaCode,
        countryCode: match.awayTeam.countryCode,
        groupName: match.awayTeam.groupName,
        eloRating: match.awayTeam.eloRating,
        recent5: engineInput.awayTeam.recent5,
        recent10: engineInput.awayTeam.recent10,
        attackIndex: engineInput.awayTeam.attackIndex,
        defenseIndex: engineInput.awayTeam.defenseIndex,
        injuryImpact: engineInput.awayTeam.injuryImpact,
        injuryNotes: preMatchContext.away.injuryNotes,
        lineupStatus: preMatchContext.away.lineupStatus,
        lineupStability: engineInput.awayTeam.lineupStability,
        motivationScore: engineInput.awayTeam.motivationScore,
        travelFatigue: engineInput.awayTeam.travelFatigue,
      },
      headToHead: engineInput.headToHead,
      oddsSnapshot: engineInput.oddsSnapshot,
      v2PreMatch: {
        dataUpdatedAt: preMatchContext.dataUpdatedAt,
        weatherImpact: engineInput.weatherImpact,
        weatherSnapshot: preMatchContext.weatherSnapshot,
        travelSnapshot: preMatchContext.travelSnapshot,
      },
      aiAdjustment: this.safeAiAdjustment(report.aiAdjustment),
      historyContext: {
        hasMatchIntro: Boolean(context.historyContext?.matchIntro),
        hasGroupIntro: Boolean(context.historyContext?.groupIntro),
        hasHomeTeamIntro: Boolean(context.historyContext?.homeTeamIntro),
        hasAwayTeamIntro: Boolean(context.historyContext?.awayTeamIntro),
        factsCount: context.historyContext?.facts?.length ?? 0,
        ragTextCount: context.historyContext?.ragText?.length ?? 0,
      },
    };
  }

  private buildSnapshotDataQuality(featureInputs: {
    homeTeam: {
      eloRating?: number | null;
      recent5?: { matchesPlayed?: number };
      recent10?: { matchesPlayed?: number };
      attackIndex?: number;
      defenseIndex?: number;
      injuryImpact?: number;
      lineupStability?: number;
      motivationScore?: number;
      travelFatigue?: number;
    };
    awayTeam: {
      eloRating?: number | null;
      recent5?: { matchesPlayed?: number };
      recent10?: { matchesPlayed?: number };
      attackIndex?: number;
      defenseIndex?: number;
      injuryImpact?: number;
      lineupStability?: number;
      motivationScore?: number;
      travelFatigue?: number;
    };
    headToHead?: { matchesPlayed?: number };
    v2PreMatch?: {
      dataUpdatedAt?: string | null;
      weatherImpact?: number;
      weatherSnapshot?: unknown;
      travelSnapshot?: unknown;
    };
    oddsSnapshot?: unknown;
    match: {
      kickoffAt?: string | null;
      groupName?: string | null;
      venue?: string | null;
      city?: string | null;
    };
    historyContext: {
      hasMatchIntro: boolean;
      hasGroupIntro: boolean;
      hasHomeTeamIntro: boolean;
      hasAwayTeamIntro: boolean;
      factsCount: number;
      ragTextCount: number;
    };
  }) {
    const checks = [
      Boolean(featureInputs.homeTeam.eloRating),
      Boolean(featureInputs.awayTeam.eloRating),
      Boolean(featureInputs.homeTeam.recent5?.matchesPlayed),
      Boolean(featureInputs.awayTeam.recent5?.matchesPlayed),
      Boolean(featureInputs.homeTeam.recent10?.matchesPlayed),
      Boolean(featureInputs.awayTeam.recent10?.matchesPlayed),
      Boolean(featureInputs.homeTeam.attackIndex),
      Boolean(featureInputs.awayTeam.attackIndex),
      Boolean(featureInputs.homeTeam.defenseIndex),
      Boolean(featureInputs.awayTeam.defenseIndex),
      featureInputs.homeTeam.injuryImpact !== undefined,
      featureInputs.awayTeam.injuryImpact !== undefined,
      featureInputs.homeTeam.lineupStability !== undefined,
      featureInputs.awayTeam.lineupStability !== undefined,
      featureInputs.homeTeam.motivationScore !== undefined,
      featureInputs.awayTeam.motivationScore !== undefined,
      featureInputs.homeTeam.travelFatigue !== undefined,
      featureInputs.awayTeam.travelFatigue !== undefined,
      featureInputs.v2PreMatch?.weatherImpact !== undefined,
      Boolean(featureInputs.v2PreMatch?.dataUpdatedAt),
      Boolean(featureInputs.oddsSnapshot),
      Boolean(featureInputs.headToHead?.matchesPlayed),
      Boolean(featureInputs.match.kickoffAt),
      Boolean(featureInputs.match.groupName),
      Boolean(featureInputs.match.venue),
      Boolean(featureInputs.match.city),
      featureInputs.historyContext.hasMatchIntro,
      featureInputs.historyContext.hasGroupIntro,
      featureInputs.historyContext.hasHomeTeamIntro,
      featureInputs.historyContext.hasAwayTeamIntro,
      featureInputs.historyContext.factsCount > 0,
      featureInputs.historyContext.ragTextCount > 0,
    ];
    const availableCount = checks.filter(Boolean).length;
    const completenessScore = Math.round((availableCount / checks.length) * 100);

    return {
      dataVersion: 'prediction-feature-snapshot-v2',
      completenessScore,
      availableCount,
      totalChecks: checks.length,
      missing: {
        homeElo: !featureInputs.homeTeam.eloRating,
        awayElo: !featureInputs.awayTeam.eloRating,
        homeRecent5: !featureInputs.homeTeam.recent5?.matchesPlayed,
        awayRecent5: !featureInputs.awayTeam.recent5?.matchesPlayed,
        homeRecent10: !featureInputs.homeTeam.recent10?.matchesPlayed,
        awayRecent10: !featureInputs.awayTeam.recent10?.matchesPlayed,
        homeInjuryImpact: featureInputs.homeTeam.injuryImpact === undefined,
        awayInjuryImpact: featureInputs.awayTeam.injuryImpact === undefined,
        homeLineupStability:
          featureInputs.homeTeam.lineupStability === undefined,
        awayLineupStability:
          featureInputs.awayTeam.lineupStability === undefined,
        homeMotivationScore:
          featureInputs.homeTeam.motivationScore === undefined,
        awayMotivationScore:
          featureInputs.awayTeam.motivationScore === undefined,
        homeTravelFatigue:
          featureInputs.homeTeam.travelFatigue === undefined,
        awayTravelFatigue:
          featureInputs.awayTeam.travelFatigue === undefined,
        weatherImpact: featureInputs.v2PreMatch?.weatherImpact === undefined,
        preMatchDataUpdatedAt: !featureInputs.v2PreMatch?.dataUpdatedAt,
        oddsSnapshot: !featureInputs.oddsSnapshot,
        headToHead: !featureInputs.headToHead?.matchesPlayed,
        groupName: !featureInputs.match.groupName,
        venue: !featureInputs.match.venue,
        city: !featureInputs.match.city,
        matchIntro: !featureInputs.historyContext.hasMatchIntro,
        groupIntro: !featureInputs.historyContext.hasGroupIntro,
        homeTeamIntro: !featureInputs.historyContext.hasHomeTeamIntro,
        awayTeamIntro: !featureInputs.historyContext.hasAwayTeamIntro,
        facts: featureInputs.historyContext.factsCount <= 0,
        ragText: featureInputs.historyContext.ragTextCount <= 0,
      },
    };
  }

  private clampNumber(
    value: number | undefined,
    min: number,
    max: number,
    fallback: number,
  ) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, numeric));
  }

  private buildEngineArchiveSnapshot(enginePrediction: PredictionEngineOutput) {
    const productLabels =
      this.buildPredictionProductLabelsFromEngine(enginePrediction);

    return {
      modelVersion: enginePrediction.modelVersion,
      weightConfig: this.predictionEngineService.getWeightConfig(),
      finalProbability: {
        homeWinProbability: enginePrediction.homeWinProbability,
        drawProbability: enginePrediction.drawProbability,
        awayWinProbability: enginePrediction.awayWinProbability,
        total: enginePrediction.total,
      },
      recommendationDirection: enginePrediction.recommendationDirection,
      recommendedScore: enginePrediction.recommendedScore,
      scoreCandidates: enginePrediction.scoreCandidates,
      totalGoalsRange: enginePrediction.totalGoalsRange,
      overUnderLean: enginePrediction.overUnderLean,
      totalGoalsDistribution: enginePrediction.totalGoalsDistribution,
      scoreModelMeta: enginePrediction.scoreModelMeta,
      calibration: enginePrediction.calibration,
      autoWeighting: enginePrediction.autoWeighting,
      riskLevel: enginePrediction.riskLevel,
      confidenceLevel: enginePrediction.confidenceLevel,
      confidenceScore: enginePrediction.confidenceScore,
      riskScore: enginePrediction.riskScore,
      riskBreakdown: enginePrediction.riskBreakdown,
      confidenceBreakdown: enginePrediction.confidenceBreakdown,
      isHighConfidence: productLabels.isHighConfidence,
      isCautious: productLabels.isCautious,
      confidenceTag: productLabels.confidenceTag,
      riskTag: productLabels.riskTag,
      modelReadinessTag: productLabels.modelReadinessTag,
      factorScores: enginePrediction.factors.map((factor) => ({
        key: factor.key,
        label: factor.label,
        weight: factor.weight,
        available: factor.available,
        probability: factor.probability,
        weightedEvidence: factor.weightedEvidence,
        reason: factor.reason,
      })),
      warnings: enginePrediction.warnings,
    };
  }

  private buildPredictionProductLabelsFromEngine(
    enginePrediction: PredictionEngineOutput,
  ) {
    const totalFactors = enginePrediction.factors.length;
    const availableFactors = enginePrediction.factors.filter(
      (factor) => factor.available,
    ).length;

    return this.buildPredictionProductLabels({
      confidenceScore: enginePrediction.confidenceScore,
      riskScore: enginePrediction.riskScore,
      confidenceLevel: enginePrediction.confidenceLevel,
      riskLevel: enginePrediction.riskLevel,
      availableFactorRatio: totalFactors > 0 ? availableFactors / totalFactors : 0,
    });
  }

  private buildPredictionProductLabels(input: {
    confidenceScore?: number;
    riskScore?: number;
    confidenceLevel?: string | null;
    riskLevel?: string | null;
    availableFactorRatio?: number;
  }) {
    const confidenceScore = this.clampNumber(
      input.confidenceScore,
      0,
      100,
      50,
    );
    const riskScore = this.clampNumber(input.riskScore, 0, 100, 50);
    const confidenceLevel = input.confidenceLevel || 'MEDIUM';
    const riskLevel = input.riskLevel || 'MEDIUM';
    const availableFactorRatio = this.clampNumber(
      input.availableFactorRatio,
      0,
      1,
      0,
    );
    const isHighConfidence =
      (confidenceLevel === 'HIGH' || confidenceScore >= 70) &&
      riskLevel !== 'HIGH' &&
      riskScore <= 55;
    const isCautious =
      confidenceLevel === 'LOW' ||
      riskLevel === 'HIGH' ||
      confidenceScore < 50 ||
      riskScore >= 65;

    return {
      isHighConfidence,
      isCautious,
      confidenceTag: isHighConfidence
        ? '模型一致性较高'
        : isCautious
          ? '建议谨慎参考'
          : confidenceScore >= 60
            ? '具备一定参考价值'
            : '信息仍需观察',
      riskTag:
        riskLevel === 'LOW' && riskScore < 45
          ? '风险较低'
          : riskLevel === 'HIGH' || riskScore >= 65
            ? '双方差距较小或信息波动较高'
            : '存在一定波动',
      modelReadinessTag:
        availableFactorRatio >= 0.8
          ? '赛前数据较完整'
          : availableFactorRatio >= 0.5
            ? '赛前数据基本可用'
            : '赛前数据待补充',
    };
  }

  private getFactorAvailabilityRatio(factorScores: unknown) {
    if (!Array.isArray(factorScores) || factorScores.length === 0) {
      return 0;
    }

    const availableCount = factorScores.filter((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      return Boolean((item as { available?: unknown }).available);
    }).length;

    return availableCount / factorScores.length;
  }

  private buildOriginalContent(
    match: MatchWithTeams,
    report: {
      summary: string;
      fullContent: string;
      homeWinProb: number;
      drawProb: number;
      awayWinProb: number;
      predictedHome: number;
      predictedAway: number;
      riskIndex: number;
      confidenceIndex: number;
      aiAdjustment?: {
        homeWinDelta?: number;
        drawDelta?: number;
        awayWinDelta?: number;
        confidence?: number;
        reason?: string;
      };
    },
    context: AiMatchContext,
    meta: {
      recommendationDirection: PredictionDirection;
      isMemberContent: boolean;
      isPublic: boolean;
    },
  ) {
    return {
      matchId: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      groupName: match.groupName,
      stage: match.stage,
      matchDate: match.matchDate ? this.toDateOnly(match.matchDate) : null,
      kickoffTime: match.kickoffTime,
      timezone: match.timezone,
      kickoffAt: match.kickoffAt.toISOString(),
      venue: match.venue,
      city: match.city,
      roundName: match.roundName,
      historyContext: context.historyContext,
      recommendationDirection: meta.recommendationDirection,
      aiAdjustment: this.safeAiAdjustment(report.aiAdjustment),
      recommendationReason: report.summary,
      riskTip: this.extractRiskTip(report.fullContent),
      fullContent: report.fullContent,
      model: this.aiService.model,
      promptVersion: this.aiService.promptVersion,
      isMemberContent: meta.isMemberContent,
      isPublic: meta.isPublic,
    };
  }

  private presentArchive<T extends { settlement?: unknown; corrections?: unknown[] }>(
    archive: T,
  ) {
    const item = archive as T & {
      lockedAt?: Date | string | null;
      predictionStage?: string | null;
      recommendationReason?: string;
      fullAnalysis?: string | null;
      shortAnalysis?: string | null;
      riskTip?: string;
      disclaimer?: string | null;
      predictedHome?: number;
      predictedAway?: number;
      totalGoalsPrediction?: number;
      confidenceIndex?: number;
      riskIndex?: number;
      modelVersion?: string | null;
      engineModelVersion?: string | null;
      homeWinProb?: unknown;
      drawProb?: unknown;
      awayWinProb?: unknown;
      confidenceLevel?: string | null;
      riskLevel?: string | null;
      engineFactorScores?: unknown;
      originalContent?: unknown;
      featureSnapshot?: {
        featureInputs?: unknown;
        modelOutput?: unknown;
      } | null;
    };
    const stage = item.lockedAt
      ? 'LOCKED'
      : item.predictionStage || ('status' in item ? String(item.status) : 'PUBLISHED');
    const productLabels = this.buildPredictionProductLabels({
      confidenceScore: item.confidenceIndex,
      riskScore: item.riskIndex,
      confidenceLevel: item.confidenceLevel,
      riskLevel: item.riskLevel,
      availableFactorRatio: this.getFactorAvailabilityRatio(
        item.engineFactorScores,
      ),
    });
    const scoreModel = this.scoreModelOutputFromArchive(item);
    const oddsSnapshot = this.oddsSnapshotOutputFromArchive(item);

    return {
      ...archive,
      predictionStage: stage,
      archiveLabel: stage === 'FINAL' ? '最终版预测' : '预测已归档',
      resultStatus: archive.settlement ? 'SETTLED' : 'PENDING_RESULT',
      resultText: archive.settlement ? undefined : '待赛果',
      modelVersion: item.modelVersion || item.engineModelVersion,
      homeWinProbability: item.homeWinProb,
      drawProbability: item.drawProb,
      awayWinProbability: item.awayWinProb,
      predictedScore:
        item.predictedHome !== undefined && item.predictedAway !== undefined
          ? `${item.predictedHome}-${item.predictedAway}`
          : undefined,
      predictedTotalGoals: item.totalGoalsPrediction,
      scoreCandidates: scoreModel.scoreCandidates,
      totalGoalsRange: scoreModel.totalGoalsRange,
      overUnderLean: scoreModel.overUnderLean,
      totalGoalsDistribution: scoreModel.totalGoalsDistribution,
      scoreModelMeta: scoreModel.scoreModelMeta,
      calibration: scoreModel.calibration,
      autoWeighting: scoreModel.autoWeighting,
      oddsSnapshot,
      oddsCalibrationTag: oddsSnapshot
        ? '已接入最新赔率校准'
        : '暂无赔率校准快照',
      confidenceLevel: item.confidenceIndex,
      riskLevel: item.riskIndex,
      isHighConfidence: productLabels.isHighConfidence,
      isCautious: productLabels.isCautious,
      confidenceTag: productLabels.confidenceTag,
      riskTag: productLabels.riskTag,
      modelReadinessTag: productLabels.modelReadinessTag,
      shortAnalysis: item.shortAnalysis || item.recommendationReason,
      fullAnalysis:
        item.fullAnalysis ||
        [item.recommendationReason, item.riskTip].filter(Boolean).join('\n\n'),
      disclaimer: item.disclaimer || item.riskTip,
    };
  }

  private scoreModelOutputFromArchive(item: {
    originalContent?: unknown;
    featureSnapshot?: { modelOutput?: unknown } | null;
  }) {
    const modelOutput =
      this.objectValue(item.featureSnapshot?.modelOutput) ||
      this.objectValue(
        this.objectValue(item.originalContent)?.predictionEngine,
      );

    return {
      scoreCandidates: Array.isArray(modelOutput?.scoreCandidates)
        ? modelOutput.scoreCandidates
        : [],
      totalGoalsRange:
        typeof modelOutput?.totalGoalsRange === 'string'
          ? modelOutput.totalGoalsRange
          : null,
      overUnderLean:
        typeof modelOutput?.overUnderLean === 'string'
          ? modelOutput.overUnderLean
          : null,
      totalGoalsDistribution:
        modelOutput?.totalGoalsDistribution &&
        typeof modelOutput.totalGoalsDistribution === 'object'
          ? modelOutput.totalGoalsDistribution
          : null,
      scoreModelMeta:
        modelOutput?.scoreModelMeta && typeof modelOutput.scoreModelMeta === 'object'
          ? modelOutput.scoreModelMeta
          : null,
      calibration:
        modelOutput?.calibration && typeof modelOutput.calibration === 'object'
          ? modelOutput.calibration
          : null,
      autoWeighting:
        modelOutput?.autoWeighting && typeof modelOutput.autoWeighting === 'object'
          ? modelOutput.autoWeighting
          : null,
    };
  }

  private oddsSnapshotOutputFromArchive(item: {
    featureSnapshot?: { featureInputs?: unknown } | null;
  }) {
    const featureInputs = this.objectValue(item.featureSnapshot?.featureInputs);
    const oddsSnapshot = featureInputs?.oddsSnapshot;
    if (!oddsSnapshot || typeof oddsSnapshot !== 'object') {
      return null;
    }

    return oddsSnapshot;
  }

  private objectValue(value: unknown): Record<string, any> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, any>;
  }

  private filterDemoArchives(query: {
    date?: string;
    hit?: 'hit' | 'miss' | 'pending';
  }) {
    return demoPredictionArchives
      .filter((item) => {
        if (query.date && this.toBeijingDateString(item.kickoffAt) !== query.date) {
          return false;
        }

        if (query.hit === 'pending') {
          return !item.settlement;
        }

        if (query.hit === 'hit') {
          return item.settlement?.hitResult === true;
        }

        if (query.hit === 'miss') {
          return item.settlement?.hitResult === false;
        }

        return true;
      })
      .map((item) => this.presentArchive(item));
  }

  private demoStats() {
    const settled = demoPredictionArchives
      .map((item) => item.settlement)
      .filter(Boolean) as Array<{
      hitResult: boolean;
      hitScore: boolean;
      hitTotalGoals: boolean;
    }>;

    return {
      source: 'demo',
      totalPredictions: demoPredictionArchives.length,
      settledPredictions: settled.length,
      last7DaysHitRate: this.rate(settled, 'hitResult'),
      last30MatchesHitRate: this.rate(settled, 'hitResult'),
      resultHitRate: this.rate(settled, 'hitResult'),
      scoreHitRate: this.rate(settled, 'hitScore'),
      scoreCandidateHitRate: 0,
      totalGoalsHitRate: this.rate(settled, 'hitTotalGoals'),
      totalGoalsRangeHitRate: 0,
      currentHitStreak: this.currentStreak(settled),
      bestHitStreak: this.bestStreak(settled),
      highConfidenceStats: {
        count: 0,
        resultHitRate: 0,
        scoreHitRate: 0,
      },
      cautiousStats: {
        count: 0,
        resultHitRate: 0,
        scoreHitRate: 0,
      },
      recentPredictions: demoPredictionArchives.map((item) =>
        this.presentArchive(item),
      ),
    };
  }

  private archiveInclude() {
    return {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
      settlement: true,
      featureSnapshot: true,
      corrections: {
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private directionFromProbabilities(
    homeWinProb: number,
    drawProb: number,
    awayWinProb: number,
  ) {
    if (homeWinProb >= drawProb && homeWinProb >= awayWinProb) {
      return PredictionDirection.HOME_WIN;
    }

    if (awayWinProb >= homeWinProb && awayWinProb >= drawProb) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
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

  private extractRiskTip(content: string) {
    const risk = content
      .split(/\n+/)
      .find((line) => line.includes('风险提示'));

    return (
      risk?.trim() ||
      '风险提示：足球比赛受临场状态、阵容变化和天气等因素影响，本内容仅供足球分析与数据参考。'
    );
  }

  private isMatchLockedForPrediction(match: {
    kickoffAt: Date;
    status: MatchStatus;
    predictionLockedAt?: Date | null;
  }) {
    if (match.status !== MatchStatus.SCHEDULED) {
      return true;
    }

    if (match.predictionLockedAt) {
      return true;
    }

    return this.predictionLockAt(match.kickoffAt) <= new Date();
  }

  private overUnderText(totalGoalsPrediction: number) {
    return totalGoalsPrediction >= 3 ? '预计总进球偏高' : '预计总进球偏低';
  }

  private predictionTypeFocus(
    predictionType: PredictionVersionType,
    refreshStage = String(predictionType),
  ) {
    if (predictionType === PredictionVersionType.EVENING) {
      return '重点复核伤停、赔率、新闻和积分榜变化。';
    }

    if (refreshStage.endsWith('M')) {
      return '重点复核首发名单、临场伤停、天气和赛前90分钟信息。';
    }

    if (predictionType === PredictionVersionType.PRE_MATCH) {
      return '重点复核开赛前6小时内的伤停、新闻、阵容倾向和比赛环境。';
    }

    return '基于当天赛程生成基础赛前预测。';
  }

  private hashContent(content: unknown) {
    return createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex');
  }

  private rate<T extends Record<string, unknown>>(
    items: T[],
    field: keyof T,
  ) {
    if (items.length === 0) {
      return 0;
    }

    const hits = items.filter((item) => item[field] === true).length;
    return Number(((hits / items.length) * 100).toFixed(2));
  }

  private oddsReliabilityStats(
    settlements: Array<{
      resultDirection: PredictionDirection;
      predictionArchive: {
        recommendationDirection: PredictionDirection;
        featureSnapshot?: {
          featureInputs?: unknown;
        } | null;
      };
    }>,
  ) {
    const items = settlements
      .map((settlement) => {
        const featureInputs = this.objectValue(
          settlement.predictionArchive.featureSnapshot?.featureInputs,
        );
        const oddsSnapshot = this.objectValue(featureInputs?.oddsSnapshot);
        const normalizedProbability = this.objectValue(
          oddsSnapshot?.normalizedProbability,
        );
        const oddsDirection = normalizedProbability
          ? this.directionFromProbability({
              homeWin: Number(normalizedProbability.homeWin || 0),
              draw: Number(normalizedProbability.draw || 0),
              awayWin: Number(normalizedProbability.awayWin || 0),
            })
          : null;

        return oddsDirection
          ? {
              oddsDirection,
              modelDirection: settlement.predictionArchive.recommendationDirection,
              actualDirection: settlement.resultDirection,
            }
          : null;
      })
      .filter(Boolean) as Array<{
      oddsDirection: PredictionDirection;
      modelDirection: PredictionDirection;
      actualDirection: PredictionDirection;
    }>;

    if (items.length === 0) {
      return {
        count: 0,
        oddsHitRate: 0,
        modelHitRate: 0,
        oddsMoreReliable: false,
        modelMoreReliable: false,
      };
    }

    const oddsHits = items.filter(
      (item) => item.oddsDirection === item.actualDirection,
    ).length;
    const modelHits = items.filter(
      (item) => item.modelDirection === item.actualDirection,
    ).length;
    const oddsHitRate = Number(((oddsHits / items.length) * 100).toFixed(2));
    const modelHitRate = Number(((modelHits / items.length) * 100).toFixed(2));

    return {
      count: items.length,
      oddsHitRate,
      modelHitRate,
      oddsMoreReliable: oddsHitRate > modelHitRate + 3,
      modelMoreReliable: modelHitRate > oddsHitRate + 3,
    };
  }

  private directionFromProbability(probability: {
    homeWin: number;
    draw: number;
    awayWin: number;
  }): PredictionDirection {
    if (
      probability.homeWin >= probability.draw &&
      probability.homeWin >= probability.awayWin
    ) {
      return PredictionDirection.HOME_WIN;
    }

    if (
      probability.awayWin >= probability.homeWin &&
      probability.awayWin >= probability.draw
    ) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
  }

  private buildBacktestSummary(
    settlements: Array<{
      hitResult: boolean;
      hitScore: boolean;
      hitTotalGoals: boolean;
      homeScore: number;
      awayScore: number;
      resultDirection: PredictionDirection;
      settledAt: Date;
      predictionArchive: {
        id: string;
        matchId: string;
        homeWinProb?: unknown;
        drawProb?: unknown;
        awayWinProb?: unknown;
        confidenceIndex?: number;
        riskIndex?: number;
        confidenceLevel?: string | null;
        riskLevel?: string | null;
        recommendationDirection: PredictionDirection;
        predictedHome: number;
        predictedAway: number;
        totalGoalsPrediction: number;
        originalContent?: unknown;
        featureSnapshot?: {
          dataQuality?: unknown;
          featureInputs?: unknown;
          modelOutput?: unknown;
        } | null;
        match?: {
          homeTeam?: { name: string } | null;
          awayTeam?: { name: string } | null;
        };
      };
    }>,
  ) {
    const last30 = settlements.slice(0, 30);
    const highConfidence = settlements.filter((item) =>
      this.isHighConfidenceSettlement(item),
    );
    const cautious = settlements.filter((item) =>
      this.isCautiousSettlement(item),
    );
    const oddsReliability = this.oddsReliabilityStats(settlements);

    return {
      generatedAt: new Date().toISOString(),
      totalSettled: settlements.length,
      last30Count: last30.length,
      resultHitRate: this.rate(settlements, 'hitResult'),
      scoreHitRate: this.rate(settlements, 'hitScore'),
      scoreCandidateHitRate: this.scoreCandidateHitRate(settlements),
      totalGoalsHitRate: this.rate(settlements, 'hitTotalGoals'),
      totalGoalsRangeHitRate: this.totalGoalsRangeHitRate(settlements),
      oddsReliability,
      last30ResultHitRate: this.rate(last30, 'hitResult'),
      highConfidence: {
        count: highConfidence.length,
        resultHitRate: this.rate(highConfidence, 'hitResult'),
        scoreHitRate: this.rate(highConfidence, 'hitScore'),
      },
      cautious: {
        count: cautious.length,
        resultHitRate: this.rate(cautious, 'hitResult'),
        scoreHitRate: this.rate(cautious, 'hitScore'),
      },
      brierScore: this.brierScore(settlements),
      recentMisses: settlements
        .filter((item) => !item.hitResult)
        .slice(0, 5)
        .map((item) => ({
          archiveId: item.predictionArchive.id,
          matchId: item.predictionArchive.matchId,
          match:
            item.predictionArchive.match?.homeTeam &&
            item.predictionArchive.match?.awayTeam
              ? `${item.predictionArchive.match.homeTeam.name} vs ${item.predictionArchive.match.awayTeam.name}`
              : undefined,
          predictedDirection: item.predictionArchive.recommendationDirection,
          actualDirection: item.resultDirection,
          predictedScore: `${item.predictionArchive.predictedHome}-${item.predictionArchive.predictedAway}`,
          confidenceIndex: item.predictionArchive.confidenceIndex,
          riskIndex: item.predictionArchive.riskIndex,
        })),
    };
  }

  private isHighConfidenceSettlement(item: {
    predictionArchive: {
      confidenceIndex?: number;
      riskIndex?: number;
      confidenceLevel?: string | null;
      riskLevel?: string | null;
    };
  }) {
    const archive = item.predictionArchive;
    return (
      archive.confidenceLevel === 'HIGH' ||
      Number(archive.confidenceIndex || 0) >= 70
    ) && archive.riskLevel !== 'HIGH' &&
      Number(archive.riskIndex || 100) <= 55;
  }

  private isCautiousSettlement(item: {
    predictionArchive: {
      confidenceIndex?: number;
      riskIndex?: number;
      confidenceLevel?: string | null;
      riskLevel?: string | null;
    };
  }) {
    const archive = item.predictionArchive;
    return (
      archive.confidenceLevel === 'LOW' ||
      archive.riskLevel === 'HIGH' ||
      Number(archive.confidenceIndex || 100) < 50 ||
      Number(archive.riskIndex || 0) >= 65
    );
  }

  private scoreCandidateHitRate(
    settlements: Array<{
      homeScore: number;
      awayScore: number;
      predictionArchive: {
        originalContent?: unknown;
        featureSnapshot?: { modelOutput?: unknown } | null;
      };
    }>,
  ) {
    if (settlements.length === 0) {
      return 0;
    }

    const hits = settlements.filter((item) => {
      const scoreModel = this.scoreModelOutputFromArchive(item.predictionArchive);
      return scoreModel.scoreCandidates.some((candidate: any) => {
        return (
          Number(candidate?.home) === item.homeScore &&
          Number(candidate?.away) === item.awayScore
        );
      });
    });

    return Math.round((hits.length / settlements.length) * 100);
  }

  private totalGoalsRangeHitRate(
    settlements: Array<{
      homeScore: number;
      awayScore: number;
      predictionArchive: {
        originalContent?: unknown;
        featureSnapshot?: { modelOutput?: unknown } | null;
      };
    }>,
  ) {
    if (settlements.length === 0) {
      return 0;
    }

    const hits = settlements.filter((item) => {
      const totalGoals = item.homeScore + item.awayScore;
      const range = this.scoreModelOutputFromArchive(
        item.predictionArchive,
      ).totalGoalsRange;

      if (range === '0-1球') {
        return totalGoals <= 1;
      }
      if (range === '2-3球') {
        return totalGoals >= 2 && totalGoals <= 3;
      }
      if (range === '4球以上') {
        return totalGoals >= 4;
      }
      return false;
    });

    return Math.round((hits.length / settlements.length) * 100);
  }

  private brierScore(
    settlements: Array<{
      resultDirection: PredictionDirection;
      predictionArchive: {
        homeWinProb?: unknown;
        drawProb?: unknown;
        awayWinProb?: unknown;
      };
    }>,
  ) {
    if (settlements.length === 0) {
      return 0;
    }

    const total = settlements.reduce((sum, item) => {
      const home = this.decimalNumber(item.predictionArchive.homeWinProb) / 100;
      const draw = this.decimalNumber(item.predictionArchive.drawProb) / 100;
      const away = this.decimalNumber(item.predictionArchive.awayWinProb) / 100;
      const actualHome =
        item.resultDirection === PredictionDirection.HOME_WIN ? 1 : 0;
      const actualDraw = item.resultDirection === PredictionDirection.DRAW ? 1 : 0;
      const actualAway =
        item.resultDirection === PredictionDirection.AWAY_WIN ? 1 : 0;

      return (
        sum +
        (home - actualHome) ** 2 +
        (draw - actualDraw) ** 2 +
        (away - actualAway) ** 2
      );
    }, 0);

    return Number((total / settlements.length).toFixed(4));
  }

  private decimalNumber(value: unknown) {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value || 0);
  }

  private optionalDecimalNumber(value: unknown) {
    if (value === undefined || value === null) {
      return undefined;
    }

    return this.decimalNumber(value);
  }

  private optionalNumber(value: unknown) {
    if (value === undefined || value === null) {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private currentStreak(items: Array<{ hitResult: boolean }>) {
    let streak = 0;
    for (const item of items) {
      if (!item.hitResult) {
        break;
      }
      streak += 1;
    }
    return streak;
  }

  private bestStreak(items: Array<{ hitResult: boolean }>) {
    let best = 0;
    let current = 0;
    for (const item of [...items].reverse()) {
      if (item.hitResult) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }

  private toBeijingDateOnly(date: Date) {
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return new Date(
      Date.UTC(
        beijingTime.getUTCFullYear(),
        beijingTime.getUTCMonth(),
        beijingTime.getUTCDate(),
      ),
    );
  }

  private dayRange(day: Date) {
    return {
      start: new Date(day),
      end: new Date(day.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  private predictionWindow(date?: string) {
    const businessDate = date || this.toBeijingDateString(new Date());
    const start = new Date(`${businessDate}T00:00:00.000+08:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return {
      businessDate,
      start,
      end,
    };
  }

  private addBeijingDays(value: Date, days: number) {
    const beijing = new Date(value.getTime() + 8 * 60 * 60 * 1000);
    beijing.setUTCDate(beijing.getUTCDate() + days);
    const year = beijing.getUTCFullYear();
    const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijing.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private predictionLockAt(kickoffAt: Date) {
    return new Date(
      kickoffAt.getTime() - this.scheduleConfig().lockMinutes * 60 * 1000,
    );
  }

  private scheduleConfig(): PredictionScheduleConfig {
    return getPredictionScheduleConfig(this.configService);
  }

  private stagePromptVersion(
    promptVersion: string,
    predictionStage: ArchivePredictionStage,
    refreshStage?: string,
  ) {
    if (predictionStage === 'DRAFT') {
      return promptVersion;
    }

    return [promptVersion, predictionStage.toLowerCase(), refreshStage]
      .filter(Boolean)
      .join(':');
  }

  private async runLoggedTask<T>(
    jobType: string,
    targetId: string | null,
    task: () => Promise<T>,
  ) {
    const startedAt = new Date();
    const log = await this.safeStartLog(jobType, targetId, startedAt);

    try {
      const result = await task();
      await this.safeFinishLog(log?.id, AiJobStatus.SUCCEEDED);
      this.logger.log(`${jobType} succeeded`);
      return result;
    } catch (error) {
      await this.safeFinishLog(log?.id, AiJobStatus.FAILED, error);
      throw error;
    }
  }

  private safeStartLog(jobType: string, targetId: string | null, startedAt: Date) {
    return this.prisma.aiGenerationLog
      .create({
        data: {
          jobType,
          targetId,
          status: AiJobStatus.RUNNING,
          promptVersion: this.aiService.promptVersion,
          model: this.aiService.model,
          startedAt,
        },
      })
      .catch((error) => {
        this.logger.warn(
          `Unable to create prediction schedule log: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return null;
      });
  }

  private safeFinishLog(
    id: string | undefined,
    status: AiJobStatus,
    error?: unknown,
  ) {
    if (!id) {
      return Promise.resolve(null);
    }

    return this.prisma.aiGenerationLog
      .update({
        where: { id },
        data: {
          status,
          finishedAt: new Date(),
          errorMessage: error
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
        },
      })
      .catch((logError) => {
        this.logger.warn(
          `Unable to finish prediction schedule log: ${
            logError instanceof Error ? logError.message : String(logError)
          }`,
        );
        return null;
      });
  }

  private async buildAiMatchContext(match: MatchWithTeams): Promise<AiMatchContext> {
    const historyContext = await this.loadHistoryContext(match);

    return {
      id: match.id,
      stage: match.stage,
      groupName: match.groupName,
      matchDate: match.matchDate ? this.toDateOnly(match.matchDate) : null,
      kickoffTime: match.kickoffTime,
      timezone: match.timezone,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      city: match.city,
      roundName: match.roundName,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      historyContext,
    };
  }

  private withPredictionRefreshContext(
    context: AiMatchContext,
    predictionType: PredictionVersionType,
    refreshStage = String(predictionType),
  ): AiMatchContext {
    const updateFocus = this.predictionTypeFocus(predictionType, refreshStage);

    return {
      ...context,
      historyContext: {
        matchIntro: context.historyContext?.matchIntro,
        groupIntro: context.historyContext?.groupIntro,
        homeTeamIntro: context.historyContext?.homeTeamIntro,
        awayTeamIntro: context.historyContext?.awayTeamIntro,
        facts: [
          ...(context.historyContext?.facts ?? []),
          `预测刷新类型：${predictionType}，刷新阶段：${refreshStage}。${updateFocus}`,
        ],
        ragText: [
          ...(context.historyContext?.ragText ?? []),
          `本次生成必须按${predictionType}/${refreshStage}版本处理：${updateFocus}`,
        ],
      },
    };
  }

  private async loadHistoryContext(match: MatchWithTeams) {
    const tags = [
      match.homeTeam.fifaCode,
      match.awayTeam.fifaCode,
      match.groupName,
      match.externalId,
    ].filter(Boolean) as string[];

    const docs = await this.prisma.knowledgeBaseDocument
      .findMany({
        where: {
          OR: [
            { tags: { hasSome: tags } },
            {
              title: {
                in: [
                  match.homeTeam.name,
                  match.awayTeam.name,
                  match.groupName ? `${match.groupName}组` : '',
                  `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                ].filter(Boolean),
              },
            },
            { type: { in: ['fact', 'history'] } },
          ],
        },
        orderBy: [{ type: 'asc' }, { title: 'asc' }],
        take: 10,
        select: {
          type: true,
          title: true,
          summary: true,
          embeddingText: true,
        },
      })
      .catch(() => []);

    const findSummary = (type: string, title?: string) =>
      docs.find(
        (doc) =>
          doc.type === type &&
          (!title || doc.title === title || doc.title.includes(title)),
      )?.summary || null;

    return {
      matchIntro:
        findSummary('match', `${match.homeTeam.name} vs ${match.awayTeam.name}`) ||
        `${match.homeTeam.name} vs ${match.awayTeam.name}，${match.groupName || ''}组${match.roundName || '世界杯比赛'}。`,
      groupIntro: match.groupName ? findSummary('group', `${match.groupName}组`) : null,
      homeTeamIntro: findSummary('team', match.homeTeam.name),
      awayTeamIntro: findSummary('team', match.awayTeam.name),
      facts: docs
        .filter((doc) => doc.type === 'fact' || doc.type === 'history')
        .map((doc) => doc.summary || doc.embeddingText)
        .filter(Boolean)
        .slice(0, 4),
      ragText: docs
        .map((doc) => `${doc.title}: ${doc.embeddingText}`)
        .filter(Boolean)
        .slice(0, 8),
    };
  }

  private toDateOnly(value: Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toBeijingDateString(value: Date) {
    return this.toDateOnly(new Date(value.getTime() + 8 * 60 * 60 * 1000));
  }

  private emptyStats() {
    return {
      source: 'database',
      totalPredictions: 0,
      settledPredictions: 0,
      last7DaysHitRate: 0,
      last30MatchesHitRate: 0,
      resultHitRate: 0,
      scoreHitRate: 0,
      scoreCandidateHitRate: 0,
      totalGoalsHitRate: 0,
      totalGoalsRangeHitRate: 0,
      currentHitStreak: 0,
      bestHitStreak: 0,
      highConfidenceStats: {
        count: 0,
        resultHitRate: 0,
        scoreHitRate: 0,
      },
      cautiousStats: {
        count: 0,
        resultHitRate: 0,
        scoreHitRate: 0,
      },
      recentPredictions: [],
    };
  }
}
