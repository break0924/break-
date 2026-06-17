import { Injectable, NotFoundException } from '@nestjs/common';
import { AiAnalysisStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AiProviderService } from './ai-provider.service';
import { UpsertAiAnalysisDto } from './dto/upsert-ai-analysis.dto';

@Injectable()
export class AiAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProvider: AiProviderService,
    private readonly auditLogService: AuditLogService
  ) {}

  listByMatch(matchId: string) {
    return this.prisma.aiAnalysis.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async generateDraft(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true }
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const generated = await this.aiProvider.analyzeMatch(
      `${match.homeTeam.name} vs ${match.awayTeam.name}`
    );

    const analysis = await this.prisma.aiAnalysis.create({
      data: {
        matchId,
        status: AiAnalysisStatus.PENDING_REVIEW,
        modelName: 'mock',
        promptVersion: 'phase1',
        ...generated
      }
    });

    await this.auditLogService.write({
      action: 'GENERATE_DRAFT',
      entityType: 'AiAnalysis',
      entityId: analysis.id,
      after: analysis
    });

    return analysis;
  }

  async update(id: string, dto: UpsertAiAnalysisDto) {
    const before = await this.prisma.aiAnalysis.findUnique({ where: { id } });
    const analysis = await this.prisma.aiAnalysis.update({ where: { id }, data: dto });
    await this.auditLogService.write({
      action: 'UPDATE',
      entityType: 'AiAnalysis',
      entityId: id,
      before,
      after: analysis
    });
    return analysis;
  }

  async publish(id: string) {
    const before = await this.prisma.aiAnalysis.findUnique({ where: { id } });
    const analysis = await this.prisma.aiAnalysis.update({
      where: { id },
      data: {
        status: AiAnalysisStatus.PUBLISHED,
        publishedAt: new Date()
      }
    });
    await this.auditLogService.write({
      action: 'PUBLISH',
      entityType: 'AiAnalysis',
      entityId: id,
      before,
      after: analysis
    });
    return analysis;
  }

  async reject(id: string, reviewerNote?: string) {
    const before = await this.prisma.aiAnalysis.findUnique({ where: { id } });
    const analysis = await this.prisma.aiAnalysis.update({
      where: { id },
      data: {
        status: AiAnalysisStatus.REJECTED,
        reviewerNote
      }
    });
    await this.auditLogService.write({
      action: 'REJECT',
      entityType: 'AiAnalysis',
      entityId: id,
      before,
      after: analysis
    });
    return analysis;
  }
}
