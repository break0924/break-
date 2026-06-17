import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FormEngineCalculator } from './form-engine.calculator';
import { FormMatchResult, TeamFormSummary } from './form-engine.types';

@Injectable()
export class FormEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: FormEngineCalculator,
  ) {}

  async getTeamForm(teamId: string, beforeDate = new Date()): Promise<TeamFormSummary> {
    const matches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        kickoffAt: { lt: beforeDate },
        homeScore: { not: null },
        awayScore: { not: null },
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      orderBy: { kickoffAt: 'desc' },
      take: 10,
    });

    const results: FormMatchResult[] = matches.map((match) => {
      const isHome = match.homeTeamId === teamId;
      return {
        teamId,
        opponentTeamId: isHome ? match.awayTeamId : match.homeTeamId,
        playedAt: match.kickoffAt,
        goalsFor: isHome ? match.homeScore! : match.awayScore!,
        goalsAgainst: isHome ? match.awayScore! : match.homeScore!,
        isHome,
      };
    });

    return {
      teamId,
      recent5: this.calculator.calculate(results, 5),
      recent10: this.calculator.calculate(results, 10),
    };
  }
}
