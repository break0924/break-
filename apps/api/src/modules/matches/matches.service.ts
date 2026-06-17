import { Injectable, NotFoundException } from '@nestjs/common';
import { AiAnalysisStatus, Prisma } from '@prisma/client';
import { pageResult } from '../../common/dto/api-response';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryMatchesDto } from './dto/query-matches.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryMatchesDto) {
    const where: Prisma.MatchWhereInput = {
      isActive: true,
      stage: query.stage,
      status: query.status,
      groupName: query.group,
      kickoffAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined
      },
      OR: query.teamId
        ? [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }]
        : undefined
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { kickoffAt: 'asc' },
        include: {
          homeTeam: true,
          awayTeam: true,
          oddsSnapshots: {
            where: { isLatest: true },
            orderBy: { capturedAt: 'desc' }
          }
        }
      }),
      this.prisma.match.count({ where })
    ]);

    return pageResult(items, query.page, query.pageSize, total);
  }

  async detail(id: string) {
    const match = await this.prisma.match.findFirst({
      where: { id, isActive: true },
      include: {
        homeTeam: true,
        awayTeam: true,
        oddsSnapshots: { orderBy: { capturedAt: 'desc' } },
        aiAnalyses: {
          where: { status: AiAnalysisStatus.PUBLISHED },
          orderBy: { publishedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  async publishedAnalysis(matchId: string) {
    return this.prisma.aiAnalysis.findFirst({
      where: { matchId, status: AiAnalysisStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        tacticalNotes: true,
        injuryNotes: true,
        riskLevel: true,
        confidence: true,
        publishedAt: true
      }
    });
  }
}
