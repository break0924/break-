import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AiJobStatus,
  MatchStatus,
  PredictionDirection,
  PredictionLockStatus,
  Prisma,
} from '@prisma/client';
import { AiService } from '../ai/ai.service';
import {
  demoResultByExternalId,
  demoReports,
  demoScheduleMatches,
  demoTeams,
  previewContent,
} from '../demo/demo-data';
import { EloUpdateService } from '../elo';
import { MatchMonitorService } from '../match-monitor/match-monitor.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateAiReportDto } from './dto/create-ai-report.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { ListMatchesQueryDto } from './dto/list-matches-query.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
    private readonly matchMonitorService: MatchMonitorService,
    private readonly eloUpdateService: EloUpdateService,
  ) {}

  createTeam(dto: CreateTeamDto) {
    return this.prisma.team.upsert({
      where: { fifaCode: dto.fifaCode },
      update: dto,
      create: dto,
    });
  }

  listTeams() {
    return this.prisma.team
      .findMany({
        orderBy: [{ groupName: 'asc' }, { name: 'asc' }],
      })
      .catch(() => demoTeams);
  }

  createMatch(dto: CreateMatchDto) {
    const kickoffAt = new Date(dto.kickoffAt);
    const predictionLockAt = new Date(kickoffAt.getTime() - 30 * 60 * 1000);

    return this.prisma.match.create({
      data: {
        externalId: dto.externalId,
        stage: dto.stage,
        groupName: dto.groupName,
        homeTeamId: dto.homeTeamId,
        awayTeamId: dto.awayTeamId,
        kickoffAt,
        lockAt: kickoffAt,
        predictionLockAt,
        venue: dto.venue,
      },
      include: this.matchInclude(),
    });
  }

  listMatches(query: ListMatchesQueryDto = {}) {
    return this.prisma.match
      .findMany({
        where: this.matchWhere(query),
        orderBy: { kickoffAt: 'asc' },
        include: this.matchInclude(),
      })
      .then((matches) =>
        this.presentMatches(
          matches.length > 0 ? matches : this.filterDemoMatches(query),
          query,
        ),
      )
      .catch(() => this.presentMatches(this.filterDemoMatches(query), query));
  }

  async listMatchFilters() {
    const rows = await this.prisma.match
      .findMany({
        orderBy: { kickoffAt: 'asc' },
        select: {
          matchDate: true,
          kickoffAt: true,
          groupName: true,
          stage: true,
        },
      })
      .catch(() => demoScheduleMatches);
    const sourceRows = rows.length > 0 ? rows : demoScheduleMatches;

    const dates = new Set<string>();
    const groups = new Set<string>();
    const stages = new Set<string>();

    for (const row of sourceRows) {
      const date =
        'matchDate' in row && row.matchDate
          ? this.toDateOnly(row.matchDate)
          : this.toShanghaiDate(row.kickoffAt);

      dates.add(date);

      if (row.groupName) {
        groups.add(row.groupName);
      }

      stages.add(row.stage);
    }

    return {
      dates: [...dates].sort(),
      groups: [...groups].sort((a, b) => a.localeCompare(b)),
      stages: [...stages],
    };
  }

  async getMatch(id: string) {
    const legacyMatch = this.parseLegacyMatchId(id);
    const match = await this.prisma.match
      .findFirst({
        where: {
          OR: [
            { id },
            { externalId: id },
            ...(legacyMatch
              ? [
                  {
                    kickoffAt: {
                      gte: legacyMatch.start,
                      lt: legacyMatch.end,
                    },
                    homeTeam: { fifaCode: legacyMatch.homeFifaCode },
                    awayTeam: { fifaCode: legacyMatch.awayFifaCode },
                  },
                ]
              : []),
          ],
        },
        include: this.matchInclude(),
      })
      .catch(() => null);

    if (!match) {
      const demoMatch = demoScheduleMatches.find((item) => item.id === id);
      if (demoMatch) {
        return this.presentMatch(demoMatch);
      }

      throw new NotFoundException('Match not found');
    }

    return this.attachAiPrediction(this.presentMatch(match));
  }

  private parseLegacyMatchId(id: string) {
    const matched = /^match_(\d{4})(\d{2})(\d{2})_([a-z0-9]+)_([a-z0-9]+)$/i.exec(
      id,
    );
    if (!matched) {
      return null;
    }

    const [, year, month, day, homeCode, awayCode] = matched;
    const dateKey = `${year}-${month}-${day}`;
    const start = new Date(`${dateKey}T00:00:00.000+08:00`);

    return {
      start,
      end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
      homeFifaCode: homeCode.toUpperCase(),
      awayFifaCode: awayCode.toUpperCase(),
    };
  }

  async updateResult(id: string, dto: UpdateMatchResultDto) {
    const previous = await this.prisma.match.findUnique({
      where: { id },
      select: { status: true },
    });

    if (dto.status !== MatchStatus.FINISHED) {
      const match = await this.prisma.match.update({
        where: { id },
        data: {
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          status: dto.status,
        },
        include: this.matchInclude(),
      });
      this.matchMonitorService.publishStatusChange(match, previous?.status);
      return match;
    }

    const resultDirection = this.getDirection(dto.homeScore, dto.awayScore);
    const match = await this.prisma.match.update({
      where: { id },
      data: {
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        status: MatchStatus.FINISHED,
      },
      include: this.matchInclude(),
    });
    this.matchMonitorService.publishStatusChange(match, previous?.status);

    const predictions = await this.prisma.matchPrediction.findMany({
      where: { matchId: id },
      select: {
        id: true,
        userId: true,
        direction: true,
        predictedHome: true,
        predictedAway: true,
      },
    });

    const season = await this.prisma.challengeSeason.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: 'desc' },
    });

    for (const prediction of predictions) {
      const exactScore =
        prediction.predictedHome === dto.homeScore &&
        prediction.predictedAway === dto.awayScore;
      const points = exactScore
        ? 10
        : prediction.direction === resultDirection
          ? 3
          : 0;

      await this.prisma.matchPrediction.update({
        where: { id: prediction.id },
        data: {
          points,
          scoredAt: new Date(),
          lockStatus: PredictionLockStatus.LOCKED,
          lockedAt: new Date(),
        },
      });

      if (season) {
        await this.refreshChallengeScore(prediction.userId, season.id);
      }
    }

    this.matchMonitorService.publishSettlementUpdated(match, {
      predictionSettled: false,
      challengeSettled: predictions.length > 0,
    });
    await this.eloUpdateService.updateTeamElo({
      matchId: id,
      homeScore: dto.homeScore,
      awayScore: dto.awayScore,
      force: true,
    });

    return match;
  }

  async upsertAiReport(matchId: string, dto: CreateAiReportDto) {
    await this.getMatch(matchId);

    return this.prisma.aiMatchReport.upsert({
      where: { matchId },
      update: this.aiReportData(dto),
      create: {
        matchId,
        ...this.aiReportData(dto),
      },
    });
  }

  async generateAiReport(matchId: string) {
    const match = await this.getMatch(matchId);
    const startedAt = new Date();
    const log = await this.prisma.aiGenerationLog.create({
      data: {
        jobType: 'MATCH_REPORT',
        targetId: matchId,
        status: AiJobStatus.RUNNING,
        promptVersion: this.aiService.promptVersion,
        model: this.aiService.model,
        startedAt,
      },
    });

    try {
      const result = await this.aiService.generateMatchReport({
        id: match.id,
        stage: match.stage,
        groupName: match.groupName,
        kickoffAt: match.kickoffAt,
        venue: match.venue,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
      });

      const report = await this.upsertAiReport(matchId, {
        ...result,
        promptVersion: this.aiService.promptVersion,
        model: this.aiService.model,
      });

      await this.prisma.aiGenerationLog.update({
        where: { id: log.id },
        data: {
          status: AiJobStatus.SUCCEEDED,
          finishedAt: new Date(),
        },
      });

      return report;
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

  async getAiReport(matchId: string, userId?: string) {
    const report = await this.prisma.aiMatchReport
      .findUnique({
        where: { matchId },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      })
      .catch(() => null);

    if (!report) {
      const demoReport = demoReports.get(matchId);
      if (demoReport) {
        const isMember = userId ? await this.isMember(userId) : false;
        return {
          ...demoReport,
          fullContent: isMember
            ? demoReport.fullContent
            : previewContent(demoReport.fullContent),
          isMember,
          locked: !isMember,
          unlockHint: isMember ? null : '会员可查看完整AI赛前分析',
        };
      }

      throw new NotFoundException('AI report not found');
    }

    const isMember = userId ? await this.isMember(userId) : false;
    const content = isMember
      ? report.fullContent
      : this.preview(report.fullContent, 0.3);

    return {
      ...report,
      fullContent: content,
      isMember,
      locked: !isMember,
      unlockHint: isMember ? null : '会员可查看完整AI赛前分析',
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

  private preview(text: string, ratio: number) {
    const length = Math.max(80, Math.floor(text.length * ratio));
    return text.slice(0, length);
  }

  private demoReportSummary(matchId: string) {
    const report = demoReports.get(matchId);
    if (!report) {
      return null;
    }

    return {
      id: report.id,
      summary: report.summary,
      predictedHome: report.predictedHome,
      predictedAway: report.predictedAway,
      riskIndex: report.riskIndex,
      confidenceIndex: report.confidenceIndex,
    };
  }

  private aiReportData(dto: CreateAiReportDto) {
    return {
      summary: dto.summary,
      fullContent: dto.fullContent,
      homeWinProb: new Prisma.Decimal(dto.homeWinProb),
      drawProb: new Prisma.Decimal(dto.drawProb),
      awayWinProb: new Prisma.Decimal(dto.awayWinProb),
      predictedHome: dto.predictedHome,
      predictedAway: dto.predictedAway,
      riskIndex: dto.riskIndex,
      confidenceIndex: dto.confidenceIndex,
      promptVersion: dto.promptVersion,
      model: dto.model,
      generatedAt: new Date(),
    };
  }

  private getDirection(homeScore: number, awayScore: number) {
    if (homeScore > awayScore) {
      return PredictionDirection.HOME_WIN;
    }

    if (homeScore < awayScore) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
  }

  private async refreshChallengeScore(userId: string, seasonId: string) {
    const [matchPoints, tournamentPick] = await Promise.all([
      this.prisma.matchPrediction.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      this.prisma.tournamentPick.findUnique({
        where: {
          userId_seasonId: {
            userId,
            seasonId,
          },
        },
        select: { points: true },
      }),
    ]);

    const points =
      (matchPoints._sum.points ?? 0) + (tournamentPick?.points ?? 0);

    return this.prisma.challengeScore.upsert({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
      update: {
        points,
        title: this.getScoreTitle(points),
      },
      create: {
        userId,
        seasonId,
        points,
        title: this.getScoreTitle(points),
      },
    });
  }

  private getScoreTitle(points: number) {
    if (points >= 200) {
      return '冠军预言家';
    }

    if (points >= 100) {
      return '战术分析师';
    }

    if (points >= 30) {
      return '绿茵观察员';
    }

    return '新晋挑战者';
  }

  private matchInclude() {
    return {
      homeTeam: true,
      awayTeam: true,
      aiReport: {
        select: {
          id: true,
          summary: true,
          homeWinProb: true,
          drawProb: true,
          awayWinProb: true,
          predictedHome: true,
          predictedAway: true,
          riskIndex: true,
          confidenceIndex: true,
          generatedAt: true,
        },
      },
      predictionArchives: {
        where: {
          status: 'PUBLISHED',
          isPublic: true,
        },
        orderBy: [{ publishedAt: 'desc' }, { predictionTime: 'desc' }],
        take: 1,
        select: {
          id: true,
          matchId: true,
          recommendationDirection: true,
          homeWinProb: true,
          drawProb: true,
          awayWinProb: true,
          predictedHome: true,
          predictedAway: true,
          confidenceIndex: true,
          riskIndex: true,
          recommendationReason: true,
          riskTip: true,
          publishedAt: true,
          predictionTime: true,
        },
      },
    } satisfies Prisma.MatchInclude;
  }

  private attachAiPrediction<T extends { predictionArchives?: unknown[] }>(
    match: T,
  ) {
    const predictionArchives = match.predictionArchives || [];
    return {
      ...match,
      aiPrediction: predictionArchives[0] || null,
    };
  }

  private matchWhere(query: ListMatchesQueryDto) {
    const where: Prisma.MatchWhereInput = {};

    if (query.groupName) {
      where.groupName = query.groupName;
    }

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00.000+08:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      where.OR = [
        { matchDate: new Date(`${query.date}T00:00:00.000Z`) },
        {
          matchDate: null,
          kickoffAt: {
            gte: start,
            lt: end,
          },
        },
      ];
    }

    return where;
  }

  private filterDemoMatches(query: ListMatchesQueryDto = {}) {
    return demoScheduleMatches
      .filter((match) => {
        if (query.groupName && match.groupName !== query.groupName) {
          return false;
        }

        if (query.stage && match.stage !== query.stage) {
          return false;
        }

        if (query.date && this.toDateOnly(match.matchDate) !== query.date) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  }

  private presentMatches<T extends Array<any>>(
    matches: T,
    query: ListMatchesQueryDto = {},
  ) {
    const rows = matches.map((match) => this.presentMatch(match));

    if (!query.status) {
      return rows;
    }

    return rows.filter((match) => match.status === query.status);
  }

  private presentMatch<T extends {
    externalId?: string | null;
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
    status?: MatchStatus | string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }>(match: T) {
    const withFallbackResult = this.withFallbackResult(match);
    const effectiveKickoffAt = this.effectiveKickoffAt(withFallbackResult);
    return {
      ...withFallbackResult,
      kickoffAt: effectiveKickoffAt.toISOString(),
      status: this.displayStatus(withFallbackResult),
      resultStatus: this.resultStatus(withFallbackResult),
    };
  }

  private withFallbackResult<T extends {
    externalId?: string | null;
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
    status?: MatchStatus | string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }>(match: T) {
    if (this.hasResult(match) || !this.isPastResultWindow(match)) {
      return match;
    }

    const fallback = match.externalId
      ? demoResultByExternalId[match.externalId]
      : null;
    if (!fallback) {
      return match;
    }

    return {
      ...match,
      status: MatchStatus.FINISHED,
      homeScore: fallback.homeScore,
      awayScore: fallback.awayScore,
      winnerTeamId: fallback.winnerTeamId,
    };
  }

  private resultStatus(match: {
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }) {
    if (this.hasResult(match)) {
      return 'RESULTED';
    }
    if (this.isPastResultWindow(match)) {
      return 'PENDING_RESULT';
    }
    return 'PENDING';
  }

  private displayStatus(match: {
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
    status?: MatchStatus | string | null;
    homeScore?: number | null;
    awayScore?: number | null;
  }) {
    if (
      match.status === MatchStatus.POSTPONED ||
      match.status === MatchStatus.CANCELLED
    ) {
      return match.status;
    }

    if (match.homeScore !== null && match.homeScore !== undefined &&
      match.awayScore !== null && match.awayScore !== undefined) {
      return MatchStatus.FINISHED;
    }

    const kickoffAt = this.effectiveKickoffAt(match).getTime();
    if (!Number.isFinite(kickoffAt)) {
      return match.status || MatchStatus.SCHEDULED;
    }

    const now = Date.now();
    if (now < kickoffAt) {
      return MatchStatus.SCHEDULED;
    }

    if (now < kickoffAt + 120 * 60 * 1000) {
      return MatchStatus.LIVE;
    }

    return MatchStatus.FINISHED;
  }

  private hasResult(match: {
    homeScore?: number | null;
    awayScore?: number | null;
  }) {
    return (
      match.homeScore !== null &&
      match.homeScore !== undefined &&
      match.awayScore !== null &&
      match.awayScore !== undefined
    );
  }

  private isPastResultWindow(match: {
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
  }) {
    const kickoffTime = this.effectiveKickoffAt(match).getTime();
    return (
      Number.isFinite(kickoffTime) &&
      Date.now() >= kickoffTime + 120 * 60 * 1000
    );
  }

  private effectiveKickoffAt(match: {
    kickoffAt: Date | string;
    matchDate?: Date | string | null;
    kickoffTime?: string | null;
  }) {
    const date = this.matchDateString(match.matchDate);
    if (date && match.kickoffTime) {
      return new Date(`${date}T${match.kickoffTime}:00+08:00`);
    }

    return new Date(match.kickoffAt);
  }

  private matchDateString(value?: Date | string | null) {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const matched = /^(\d{4}-\d{2}-\d{2})/.exec(value);
      if (matched) {
        return matched[1];
      }
    }

    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return null;
    }

    return this.toDateOnly(date);
  }

  private toShanghaiDate(value: Date) {
    const shanghai = new Date(value.getTime() + 8 * 60 * 60 * 1000);
    const year = shanghai.getUTCFullYear();
    const month = String(shanghai.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shanghai.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toDateOnly(value: Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
