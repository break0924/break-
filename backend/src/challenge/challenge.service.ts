import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PredictionDirection, PredictionLockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { SetTournamentResultDto } from './dto/set-tournament-result.dto';
import { SubmitMatchPredictionDto } from './dto/submit-match-prediction.dto';
import { SubmitTournamentPickDto } from './dto/submit-tournament-pick.dto';

@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 * * * * *')
  async lockPredictionsAfterKickoff() {
    if (this.configService.get<string>('PRISMA_CONNECT_ON_STARTUP') === 'false') {
      return;
    }

    await this.lockDuePredictions();
  }

  upsertSeason(dto: CreateSeasonDto) {
    return this.prisma.challengeSeason.create({
      data: {
        name: dto.name,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async getHome(userId?: string) {
    const season = await this.prisma.challengeSeason.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: 'desc' },
    });

    if (!season) {
      return { season: null, myScore: null };
    }

    const myScore = userId
      ? await this.prisma.challengeScore.findUnique({
          where: {
            userId_seasonId: {
              userId,
              seasonId: season.id,
            },
          },
        })
      : null;

    return { season, myScore };
  }

  async myScore(userId: string, seasonId?: string) {
    const season = await this.resolveSeason(seasonId);
    const score = await this.refreshChallengeScore(userId, season.id);
    return { season, score };
  }

  async submitMatchPrediction(userId: string, dto: SubmitMatchPredictionDto) {
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.lockAt <= new Date()) {
      throw new BadRequestException('Prediction is locked after kickoff');
    }

    const existing = await this.prisma.matchPrediction.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId: dto.matchId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Prediction cannot be changed after submit');
    }

    return this.prisma.matchPrediction.create({
      data: {
        userId,
        matchId: dto.matchId,
        direction: dto.direction,
        predictedHome: dto.predictedHome,
        predictedAway: dto.predictedAway,
        lockStatus: PredictionLockStatus.OPEN,
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });
  }

  async submitTournamentPick(userId: string, dto: SubmitTournamentPickDto) {
    const season = await this.prisma.challengeSeason.findUnique({
      where: { id: dto.seasonId },
    });

    if (!season) {
      throw new NotFoundException('Challenge season not found');
    }

    const now = new Date();
    if (season.startsAt <= now) {
      throw new BadRequestException('Tournament pick is locked after season start');
    }

    const existing = await this.prisma.tournamentPick.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: dto.seasonId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Tournament pick cannot be changed after submit');
    }

    const uniqueFinalFour = [...new Set(dto.finalFourTeamIds)];
    if (uniqueFinalFour.length !== 4) {
      throw new BadRequestException('Final four teams must be unique');
    }

    return this.prisma.tournamentPick.create({
      data: {
        userId,
        seasonId: dto.seasonId,
        championTeamId: dto.championTeamId,
        goldenBootName: dto.goldenBootName,
        lockedAt: now,
        finalFour: {
          create: uniqueFinalFour.map((teamId) => ({ teamId })),
        },
      },
      include: {
        championTeam: true,
        finalFour: {
          include: { team: true },
        },
      },
    });
  }

  async setTournamentResult(seasonId: string, dto: SetTournamentResultDto) {
    const season = await this.prisma.challengeSeason.findUnique({
      where: { id: seasonId },
    });

    if (!season) {
      throw new NotFoundException('Challenge season not found');
    }

    const uniqueFinalFour = [...new Set(dto.actualFinalFourTeamIds)];
    if (uniqueFinalFour.length !== 4) {
      throw new BadRequestException('Actual final four teams must be unique');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.challengeSeason.update({
        where: { id: seasonId },
        data: {
          actualChampionTeamId: dto.actualChampionTeamId,
          actualGoldenBootName: dto.actualGoldenBootName,
          resultScoredAt: new Date(),
          actualFinalFour: {
            deleteMany: {},
            create: uniqueFinalFour.map((teamId) => ({ teamId })),
          },
        },
      });
    });

    await this.scoreTournamentPicks(seasonId);

    return this.prisma.challengeSeason.findUnique({
      where: { id: seasonId },
      include: {
        actualChampionTeam: true,
        actualFinalFour: {
          include: { team: true },
        },
      },
    });
  }

  async leaderboard(seasonId?: string) {
    const season = await this.resolveSeason(seasonId);

    return this.prisma.challengeScore.findMany({
      where: { seasonId: season.id },
      orderBy: [{ points: 'desc' }, { updatedAt: 'asc' }],
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async lockDuePredictions() {
    return this.prisma.matchPrediction.updateMany({
      where: {
        lockStatus: PredictionLockStatus.OPEN,
        match: {
          lockAt: {
            lte: new Date(),
          },
        },
      },
      data: {
        lockStatus: PredictionLockStatus.LOCKED,
        lockedAt: new Date(),
      },
    });
  }

  async settleMatchPoints(matchId: string, force = false) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.homeScore === null || match.awayScore === null) {
      return {
        matchId,
        settledCount: 0,
        refreshedScores: 0,
        skipped: true,
        reason: 'MATCH_SCORE_REQUIRED',
      };
    }

    const resultDirection = this.directionFromScore(
      match.homeScore,
      match.awayScore,
    );
    const predictions = await this.prisma.matchPrediction.findMany({
      where: {
        matchId,
        ...(force ? {} : { scoredAt: null }),
      },
      select: {
        id: true,
        userId: true,
        direction: true,
        predictedHome: true,
        predictedAway: true,
      },
    });

    for (const prediction of predictions) {
      const exactScore =
        prediction.predictedHome === match.homeScore &&
        prediction.predictedAway === match.awayScore;
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
    }

    const season = await this.prisma.challengeSeason.findFirst({
      where: { isActive: true },
      orderBy: { startsAt: 'desc' },
    });

    let refreshedScores = 0;
    if (season) {
      const userIds = [...new Set(predictions.map((item) => item.userId))];
      for (const userId of userIds) {
        await this.refreshChallengeScore(userId, season.id);
        refreshedScores += 1;
      }
    }

    return {
      matchId,
      settledCount: predictions.length,
      refreshedScores,
      skipped: predictions.length === 0,
      force,
    };
  }

  private async scoreTournamentPicks(seasonId: string) {
    const season = await this.prisma.challengeSeason.findUnique({
      where: { id: seasonId },
      include: {
        actualFinalFour: true,
      },
    });

    if (!season) {
      throw new NotFoundException('Challenge season not found');
    }

    const finalFourIds = new Set(season.actualFinalFour.map((item) => item.teamId));
    const picks = await this.prisma.tournamentPick.findMany({
      where: { seasonId },
      include: {
        finalFour: true,
      },
    });

    for (const pick of picks) {
      const championPoints =
        season.actualChampionTeamId &&
        pick.championTeamId === season.actualChampionTeamId
          ? 50
          : 0;
      const finalFourPoints =
        pick.finalFour.filter((item) => finalFourIds.has(item.teamId)).length * 20;
      const goldenBootPoints =
        season.actualGoldenBootName &&
        pick.goldenBootName?.trim() === season.actualGoldenBootName.trim()
          ? 30
          : 0;
      const points = championPoints + finalFourPoints + goldenBootPoints;

      await this.prisma.tournamentPick.update({
        where: { id: pick.id },
        data: {
          points,
          scoredAt: new Date(),
        },
      });

      await this.refreshChallengeScore(pick.userId, seasonId);
    }
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

  private async resolveSeason(seasonId?: string) {
    const season =
      seasonId != null
        ? await this.prisma.challengeSeason.findUnique({ where: { id: seasonId } })
        : await this.prisma.challengeSeason.findFirst({
            where: { isActive: true },
            orderBy: { startsAt: 'desc' },
          });

    if (!season) {
      throw new NotFoundException('Challenge season not found');
    }

    return season;
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

  private directionFromScore(homeScore: number, awayScore: number) {
    if (homeScore > awayScore) {
      return PredictionDirection.HOME_WIN;
    }

    if (awayScore > homeScore) {
      return PredictionDirection.AWAY_WIN;
    }

    return PredictionDirection.DRAW;
  }
}
