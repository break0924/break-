import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EloCalculator } from './elo.calculator';

@Injectable()
export class EloUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eloCalculator: EloCalculator,
  ) {}

  async updateTeamElo(matchResult: {
    matchId: string;
    homeScore?: number | null;
    awayScore?: number | null;
    force?: boolean;
  }) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchResult.matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        eloHistory: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found for Elo update');
    }

    const homeScore = matchResult.homeScore ?? match.homeScore;
    const awayScore = matchResult.awayScore ?? match.awayScore;

    if (
      match.status !== MatchStatus.FINISHED ||
      homeScore === null ||
      homeScore === undefined ||
      awayScore === null ||
      awayScore === undefined
    ) {
      return {
        matchId: match.id,
        skipped: true,
        reason: 'MATCH_NOT_FINISHED_OR_SCORE_MISSING',
      };
    }

    if (!matchResult.force && match.eloHistory.length > 0) {
      return {
        matchId: match.id,
        skipped: true,
        reason: 'ELO_ALREADY_UPDATED',
        historyCount: match.eloHistory.length,
      };
    }

    if (matchResult.force && match.eloHistory.length > 0) {
      await this.revertExistingHistory(match.id);
    }

    const calculation = this.eloCalculator.calculate({
      matchId: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeRating: match.homeTeam.eloRating,
      awayRating: match.awayTeam.eloRating,
      homeScore,
      awayScore,
    });

    await this.prisma.$transaction([
      this.prisma.team.update({
        where: { id: match.homeTeamId },
        data: { eloRating: calculation.home.newRating },
      }),
      this.prisma.team.update({
        where: { id: match.awayTeamId },
        data: { eloRating: calculation.away.newRating },
      }),
      this.prisma.teamEloHistory.createMany({
        data: [calculation.home, calculation.away].map((item) => ({
          teamId: item.teamId,
          matchId: match.id,
          opponentTeamId: item.opponentTeamId,
          isHome: item.isHome,
          scoreFor: item.scoreFor,
          scoreAgainst: item.scoreAgainst,
          result: item.result,
          oldRating: item.oldRating,
          newRating: item.newRating,
          ratingDelta: item.ratingDelta,
          kFactor: item.kFactor,
          expectedScore: item.expectedScore,
        })),
      }),
    ]);

    return {
      matchId: match.id,
      skipped: false,
      home: calculation.home,
      away: calculation.away,
    };
  }

  private async revertExistingHistory(matchId: string) {
    const histories = await this.prisma.teamEloHistory.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
    });

    if (histories.length === 0) {
      return;
    }

    await this.prisma.$transaction([
      ...histories.map((history) =>
        this.prisma.team.update({
          where: { id: history.teamId },
          data: { eloRating: history.oldRating },
        }),
      ),
      this.prisma.teamEloHistory.deleteMany({
        where: { matchId },
      }),
    ]);
  }
}
