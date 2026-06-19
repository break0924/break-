import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import {
  AiJobStatus,
  MatchStatus,
  PredictionArchiveStatus,
  PredictionDirection,
  Prisma,
} from "@prisma/client";
import { AiService } from "../ai/ai.service";
import { demoScheduleMatches } from "../demo/demo-data";
import {
  predictionGenerateCron,
  predictionTimeZone,
} from "../predictions/prediction-schedule.config";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
  ) {}

  @Cron(predictionGenerateCron(), { timeZone: predictionTimeZone() })
  async generateTomorrowByCron() {
    try {
      await this.generateDailyRecommendation(this.addBeijingDays(new Date(), 1));
    } catch (error) {
      this.logger.error("Daily recommendation cron failed", error);
    }
  }

  async getToday(userId?: string, date = new Date()) {
    const day = this.toBeijingDateOnly(date);
    const recommendation = await this.prisma.dailyRecommendation
      .findUnique({
        where: { date: day },
        include: {
          matches: {
            orderBy: { sortOrder: "asc" },
            include: {
              match: {
                include: {
                  homeTeam: true,
                  awayTeam: true,
                  predictionArchives: {
                    where: {
                      status: PredictionArchiveStatus.PUBLISHED,
                      isPublic: true,
                    },
                    orderBy: [{ publishedAt: "desc" }, { generatedAt: "desc" }],
                    take: 1,
                    include: {
                      featureSnapshot: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .catch(() => null);

    if (!recommendation) {
      return this.getScheduleRecommendation(userId, day);
    }

    const isMember = userId ? await this.isMember(userId) : false;
    const { start, end } = this.beijingDayRange(day);
    const validMatches = recommendation.matches.filter((item) => {
      const kickoffAt = item.match.kickoffAt?.getTime();
      return kickoffAt >= start.getTime() && kickoffAt < end.getTime();
    });

    if (validMatches.length === 0) {
      return this.getScheduleRecommendation(userId, day);
    }

    return {
      ...recommendation,
      displayDate: this.beijingDateKey(day),
      nextAvailableDate: this.beijingDateKey(day),
      source: "database",
      isMember,
      matches: validMatches.map((item) => {
        const latestArchive = item.match.predictionArchives?.[0];
        const scoreModel = this.scoreModelFromArchive(latestArchive);

        return {
          ...item,
          scoreCandidates: scoreModel.scoreCandidates,
          totalGoalsRange: scoreModel.totalGoalsRange,
          overUnderLean: scoreModel.overUnderLean,
          totalGoalsDistribution: scoreModel.totalGoalsDistribution,
          memberReason: isMember ? item.memberReason : undefined,
          locked: !isMember,
          unlockHint: isMember ? null : "会员可查看完整推荐理由",
        };
      }),
    };
  }

  async generateDailyRecommendation(date = new Date()) {
    const day = this.toBeijingDateOnly(date);
    const startedAt = new Date();
    const log = await this.prisma.aiGenerationLog.create({
      data: {
        jobType: "DAILY_RECOMMENDATION",
        status: AiJobStatus.RUNNING,
        promptVersion: this.aiService.promptVersion,
        model: this.aiService.model,
        startedAt,
      },
    });

    try {
      const candidates = await this.findCandidateMatches(day);
      if (candidates.length === 0) {
        throw new NotFoundException("No candidate matches found");
      }

      const aiPicks = await this.aiService.generateDailyPicks(
        candidates.map((match) => ({
          id: match.id,
          stage: match.stage,
          groupName: match.groupName,
          kickoffAt: match.kickoffAt,
          venue: match.venue,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
        })),
      );
      const candidateIds = new Set(candidates.map((match) => match.id));
      const validPicks = aiPicks
        .filter((pick) => candidateIds.has(pick.matchId))
        .slice(0, 3);
      if (validPicks.length === 0) {
        throw new NotFoundException(
          "AI returned no valid recommendation picks",
        );
      }

      const recommendation = await this.prisma.$transaction(async (tx) => {
        const record = await tx.dailyRecommendation.upsert({
          where: { date: day },
          update: {
            title: "AI每日精选",
            intro: "基于赛程、球队状态和风险控制生成的3场内容推荐",
            status: AiJobStatus.SUCCEEDED,
            promptVersion: this.aiService.promptVersion,
            model: this.aiService.model,
            generatedAt: new Date(),
            matches: {
              deleteMany: {},
            },
          },
          create: {
            date: day,
            title: "AI每日精选",
            intro: "基于赛程、球队状态和风险控制生成的3场内容推荐",
            status: AiJobStatus.SUCCEEDED,
            promptVersion: this.aiService.promptVersion,
            model: this.aiService.model,
            generatedAt: new Date(),
          },
        });

        for (const [index, pick] of validPicks.entries()) {
          await tx.dailyRecommendationMatch.create({
            data: {
              dailyRecommendationId: record.id,
              matchId: pick.matchId,
              recommendationDirection: pick.recommendationDirection,
              predictedHome: pick.predictedHome,
              predictedAway: pick.predictedAway,
              homeWinProb: new Prisma.Decimal(pick.homeWinProb),
              drawProb: new Prisma.Decimal(pick.drawProb),
              awayWinProb: new Prisma.Decimal(pick.awayWinProb),
              riskIndex: pick.riskIndex,
              confidenceIndex: pick.confidenceIndex,
              freeReason: pick.freeReason,
              memberReason: pick.memberReason,
              sortOrder: index + 1,
            },
          });
        }

        return record;
      });

      await this.prisma.aiGenerationLog.update({
        where: { id: log.id },
        data: {
          status: AiJobStatus.SUCCEEDED,
          targetId: recommendation.id,
          finishedAt: new Date(),
        },
      });

      return this.getToday(undefined, day);
    } catch (error) {
      await this.prisma.aiGenerationLog.update({
        where: { id: log.id },
        data: {
          status: AiJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : String(error),
          finishedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async findCandidateMatches(day: Date) {
    const { start, end } = this.beijingDayRange(day);

    const matches = await this.prisma.match.findMany({
      where: {
        kickoffAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { kickoffAt: "asc" },
      take: 8,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (matches.length >= 3) {
      return matches;
    }

    return this.prisma.match.findMany({
      where: {
        kickoffAt: {
          gte: start,
          lt: new Date(end.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { kickoffAt: "asc" },
      take: 8,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  private async getScheduleRecommendation(userId: string | undefined, day: Date) {
    const isMember = userId ? await this.isMember(userId) : false;
    const { start, end } = this.beijingDayRange(day);
    const requestedDate = this.beijingDateKey(day);
    let title = "今日推荐";
    let intro = "暂无今日比赛";
    let matches: Array<any> = await this.findMatchesInRange(start, end, 4);
    let source: "database" | "demo" = "database";
    let displayDate = requestedDate;

    if (matches.length === 0) {
      matches = await this.findMatchesInRange(end, undefined, 4);
      if (matches.length > 0) {
        displayDate = this.beijingDateKey(matches[0].kickoffAt);
        title = "下一比赛日推荐";
        intro = `暂无今日比赛，展示 ${displayDate} 最近可推荐比赛`;
      }
    } else {
      intro = `今日共 ${matches.length} 场比赛，已更新 ${matches.length} 场赛前分析。`;
    }

    if (matches.length === 0) {
      source = "demo";
      matches = this.findDemoMatchesInRange(start, end, 4);
    }

    if (matches.length === 0) {
      source = "demo";
      matches = this.findDemoMatchesInRange(end, undefined, 4);
      if (matches.length > 0) {
        displayDate = this.beijingDateKey(matches[0].kickoffAt);
        title = "下一比赛日推荐";
        intro = `暂无今日比赛，展示 ${displayDate} 最近可推荐比赛`;
      }
    } else if (source === "demo") {
      displayDate = this.beijingDateKey(matches[0].kickoffAt);
      if (displayDate === requestedDate) {
        title = "今日推荐";
        intro = `今日共 ${matches.length} 场比赛，已更新 ${matches.length} 场赛前分析。`;
      } else {
        title = "下一比赛日推荐";
        intro = `暂无今日比赛，展示 ${displayDate} 最近可推荐比赛`;
      }
    }

    return {
      id: `daily_${requestedDate}_schedule`,
      date: day,
      displayDate,
      nextAvailableDate: displayDate,
      source,
      title,
      intro,
      status: AiJobStatus.SUCCEEDED,
      promptVersion: "schedule-fallback-v1",
      model: "schedule-fallback",
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isMember,
      matches: matches.map((match, index) => {
        const latestArchive = match.predictionArchives?.[0];
        const pick = this.pickFromArchiveOrMatch(match, latestArchive, index);
        const scoreModel = this.scoreModelFromArchive(latestArchive);

        return {
          id: `daily_pick_${match.id}`,
          dailyRecommendationId: `daily_${requestedDate}_schedule`,
          matchId: match.id,
          recommendationDirection: pick.recommendationDirection,
          predictedHome: pick.predictedHome,
          predictedAway: pick.predictedAway,
          homeWinProb: pick.homeWinProb,
          drawProb: pick.drawProb,
          awayWinProb: pick.awayWinProb,
          riskIndex: pick.riskIndex,
          confidenceIndex: pick.confidenceIndex,
          scoreCandidates: scoreModel.scoreCandidates,
          totalGoalsRange: scoreModel.totalGoalsRange,
          overUnderLean: scoreModel.overUnderLean,
          totalGoalsDistribution: scoreModel.totalGoalsDistribution,
          freeReason: pick.freeReason,
          memberReason: isMember ? pick.memberReason : undefined,
          sortOrder: index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          locked: !isMember,
          unlockHint: isMember ? null : "会员可查看完整推荐理由",
          match,
        };
      }),
    };
  }

  private findMatchesInRange(start: Date, end: Date | undefined, take: number) {
    return this.prisma.match.findMany({
      where: {
        kickoffAt: end
          ? {
              gte: start,
              lt: end,
            }
          : {
              gte: start,
            },
      },
      orderBy: { kickoffAt: "asc" },
      take,
      include: {
        homeTeam: true,
        awayTeam: true,
        predictionArchives: {
          where: {
            status: PredictionArchiveStatus.PUBLISHED,
            isPublic: true,
          },
          orderBy: [{ publishedAt: "desc" }, { generatedAt: "desc" }],
          take: 1,
          include: {
            featureSnapshot: true,
          },
        },
      },
    });
  }

  private findDemoMatchesInRange(start: Date, end: Date | undefined, take: number) {
    if (end) {
      return this.dynamicDemoMatchesForDate(this.beijingDateKey(start), take);
    }

    const fixedMatches = demoScheduleMatches
      .filter((match) => {
        const kickoffAt = match.kickoffAt.getTime();
        return kickoffAt >= start.getTime();
      })
      .slice(0, take)
      .map((match) => ({ ...match, predictionArchives: [] }));

    return fixedMatches.length > 0
      ? fixedMatches
      : this.dynamicDemoMatchesForDate(this.beijingDateKey(start), take);
  }

  private dynamicDemoMatchesForDate(date: string, take: number) {
    const pool = demoScheduleMatches.filter(
      (match) => match.status !== MatchStatus.FINISHED,
    );
    const sourceMatches = pool.length > 0 ? pool : demoScheduleMatches;
    const startIndex = this.demoRotationIndex(date, sourceMatches.length);
    const selected = Array.from(
      { length: Math.min(take, sourceMatches.length) },
      (_, index) => sourceMatches[(startIndex + index) % sourceMatches.length],
    );

    return selected.map((match, index) => {
      const kickoffTime = match.kickoffTime || ["01:00", "04:00", "07:00", "10:00"][index % 4];
      const kickoffAt = new Date(`${date}T${kickoffTime}:00+08:00`);

      return {
        ...match,
        matchDate: new Date(`${date}T00:00:00.000Z`),
        kickoffAt,
        kickoffTime,
        lockAt: kickoffAt,
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
        winnerTeamId: null,
        predictionArchives: [],
      };
    });
  }

  private demoRotationIndex(date: string, poolSize: number) {
    if (poolSize <= 0) return 0;
    const day = Date.parse(`${date}T00:00:00.000+08:00`);
    const dayNumber = Number.isFinite(day)
      ? Math.floor(day / (24 * 60 * 60 * 1000))
      : 0;

    return ((dayNumber % poolSize) + poolSize) % poolSize;
  }

  private pickFromArchiveOrMatch(
    match: {
      homeTeam: { name: string };
      awayTeam: { name: string };
    },
    archive:
      | {
          recommendationDirection: PredictionDirection;
          predictedHome: number;
          predictedAway: number;
          homeWinProb: Prisma.Decimal | number | string;
          drawProb: Prisma.Decimal | number | string;
          awayWinProb: Prisma.Decimal | number | string;
          riskIndex: number;
          confidenceIndex: number;
          recommendationReason: string;
          fullAnalysis?: string | null;
          shortAnalysis?: string | null;
        }
      | undefined,
    index: number,
  ) {
    if (archive) {
      return {
        recommendationDirection: archive.recommendationDirection,
        predictedHome: archive.predictedHome,
        predictedAway: archive.predictedAway,
        homeWinProb: archive.homeWinProb,
        drawProb: archive.drawProb,
        awayWinProb: archive.awayWinProb,
        riskIndex: archive.riskIndex,
        confidenceIndex: archive.confidenceIndex,
        freeReason: archive.shortAnalysis || archive.recommendationReason,
        memberReason: archive.fullAnalysis || archive.recommendationReason,
      };
    }

    const fallbackDirections = [
      PredictionDirection.HOME_WIN,
      PredictionDirection.DRAW,
      PredictionDirection.AWAY_WIN,
    ];
    const recommendationDirection =
      fallbackDirections[index % fallbackDirections.length];
    const predictedHome = recommendationDirection === PredictionDirection.AWAY_WIN ? 1 : 2;
    const predictedAway = recommendationDirection === PredictionDirection.HOME_WIN ? 1 : 2;

    return {
      recommendationDirection,
      predictedHome,
      predictedAway,
      homeWinProb:
        recommendationDirection === PredictionDirection.HOME_WIN ? "46.00" : "32.00",
      drawProb:
        recommendationDirection === PredictionDirection.DRAW ? "36.00" : "28.00",
      awayWinProb:
        recommendationDirection === PredictionDirection.AWAY_WIN ? "46.00" : "26.00",
      riskIndex: 55 + index * 3,
      confidenceIndex: 64 - index * 2,
      freeReason: `${match.homeTeam.name} vs ${match.awayTeam.name}：赛前数据已载入，建议关注阵容、节奏和临场变化。风险提示：足球比赛存在不确定性，本内容仅供数据分析参考。`,
      memberReason: `${match.homeTeam.name}与${match.awayTeam.name}的比赛已进入赛前推荐池，综合赛程、分组和基础实力差异生成参考方向。请结合临场名单、伤停、天气和战术安排阅读。`,
    };
  }

  private async isMember(userId: string) {
    const user = await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          membershipStatus: true,
          membershipExpireAt: true,
        },
      })
      .catch(() => null);

    return user
      ? this.usersService.isActiveMember(
          user.membershipStatus,
          user.membershipExpireAt,
        )
      : false;
  }

  private scoreModelFromArchive(
    archive?: {
      originalContent?: unknown;
      featureSnapshot?: { modelOutput?: unknown } | null;
    } | null,
  ) {
    const modelOutput =
      this.objectValue(archive?.featureSnapshot?.modelOutput) ||
      this.objectValue(this.objectValue(archive?.originalContent)?.predictionEngine);

    return {
      scoreCandidates: Array.isArray(modelOutput?.scoreCandidates)
        ? modelOutput.scoreCandidates
        : [],
      totalGoalsRange:
        typeof modelOutput?.totalGoalsRange === "string"
          ? modelOutput.totalGoalsRange
          : null,
      overUnderLean:
        typeof modelOutput?.overUnderLean === "string"
          ? modelOutput.overUnderLean
          : null,
      totalGoalsDistribution:
        modelOutput?.totalGoalsDistribution &&
        typeof modelOutput.totalGoalsDistribution === "object"
          ? modelOutput.totalGoalsDistribution
          : null,
    };
  }

  private objectValue(value: unknown): Record<string, any> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, any>;
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

  private beijingDayRange(day: Date) {
    const key = this.beijingDateKey(day);
    const start = new Date(`${key}T00:00:00.000+08:00`);

    return {
      start,
      end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  private beijingDateKey(day: Date) {
    const beijingTime = new Date(day.getTime() + 8 * 60 * 60 * 1000);

    return `${beijingTime.getUTCFullYear()}-${String(
      beijingTime.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(beijingTime.getUTCDate()).padStart(2, "0")}`;
  }

  private addBeijingDays(value: Date, days: number) {
    const beijing = new Date(value.getTime() + 8 * 60 * 60 * 1000);
    beijing.setUTCDate(beijing.getUTCDate() + days);

    return new Date(
      `${beijing.getUTCFullYear()}-${String(
        beijing.getUTCMonth() + 1,
      ).padStart(2, "0")}-${String(beijing.getUTCDate()).padStart(
        2,
        "0",
      )}T00:00:00.000+08:00`,
    );
  }
}
