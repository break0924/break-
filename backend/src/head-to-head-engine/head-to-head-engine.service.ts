import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HeadToHeadEngineCalculator } from './head-to-head-engine.calculator';

@Injectable()
export class HeadToHeadEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: HeadToHeadEngineCalculator,
  ) {}

  async getHeadToHead(input: {
    homeTeamId: string;
    awayTeamId: string;
    beforeDate?: Date;
    sampleSize?: number;
  }) {
    const beforeDate = input.beforeDate ?? new Date();
    const sampleSize = input.sampleSize ?? 10;
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        kickoffAt: { lt: beforeDate },
        homeScore: { not: null },
        awayScore: { not: null },
        OR: [
          {
            homeTeamId: input.homeTeamId,
            awayTeamId: input.awayTeamId,
          },
          {
            homeTeamId: input.awayTeamId,
            awayTeamId: input.homeTeamId,
          },
        ],
      },
      orderBy: { kickoffAt: 'desc' },
      take: sampleSize,
    });

    return this.calculator.calculate({
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      sampleSize,
      matches: matches.map((match) => ({
        matchId: match.id,
        playedAt: match.kickoffAt,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: match.homeScore!,
        awayScore: match.awayScore!,
      })),
    });
  }
}
