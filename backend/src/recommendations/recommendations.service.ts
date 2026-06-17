import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AiJobStatus, PredictionArchiveStatus, Prisma } from "@prisma/client";
import { AiService } from "../ai/ai.service";
import { demoReports, demoScheduleMatches } from "../demo/demo-data";
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
      return this.getDemoRecommendation(userId);
    }

    const isMember = userId ? await this.isMember(userId) : false;

    return {
      ...recommendation,
      isMember,
      matches: recommendation.matches.map((item) => {
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
    const start = new Date(day);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

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
          lt: new Date(start.getTime() + 48 * 60 * 60 * 1000),
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

  private async getDemoRecommendation(userId?: string) {
    const isMember = userId ? await this.isMember(userId) : false;

    return {
      id: "daily_20260612_demo",
      date: new Date(Date.UTC(2026, 5, 12)),
      title: "今日AI精选",
      intro: "已载入2026-06-12两场A组比赛，并完成AI赛前预测与赛果更新。",
      status: AiJobStatus.SUCCEEDED,
      promptVersion: "demo-20260612-v1",
      model: "local-demo",
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isMember,
      matches: demoScheduleMatches.slice(0, 2).map((match, index) => {
        const report = demoReports.get(match.id)!;
        return {
          id: `daily_pick_${match.id}`,
          dailyRecommendationId: "daily_20260612_demo",
          matchId: match.id,
          recommendationDirection: report.recommendationDirection,
          predictedHome: report.predictedHome,
          predictedAway: report.predictedAway,
          homeWinProb: report.homeWinProb,
          drawProb: report.drawProb,
          awayWinProb: report.awayWinProb,
          riskIndex: report.riskIndex,
          confidenceIndex: report.confidenceIndex,
          freeReason: `${report.summary} 风险提示：临场信息可能影响判断。`,
          memberReason: isMember
            ? `${report.fullContent}\n\n综合方向：${this.directionText(report.recommendationDirection)}。`
            : undefined,
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

  private directionText(direction: string) {
    if (direction === "HOME_WIN") {
      return "主队方向";
    }

    if (direction === "AWAY_WIN") {
      return "客队方向";
    }

    return "平局方向";
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
