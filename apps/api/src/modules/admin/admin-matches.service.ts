import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateMatchDto, UpdateMatchResultDto } from './dto/create-match.dto';

@Injectable()
export class AdminMatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService
  ) {}

  list() {
    return this.prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: 'asc' }
    });
  }

  async create(dto: CreateMatchDto) {
    const match = await this.prisma.match.create({
      data: {
        ...dto,
        kickoffAt: new Date(dto.kickoffAt)
      }
    });

    await this.auditLogService.write({
      action: 'CREATE',
      entityType: 'Match',
      entityId: match.id,
      after: match
    });

    return match;
  }

  async update(id: string, dto: Partial<CreateMatchDto>) {
    const before = await this.prisma.match.findUnique({ where: { id } });
    const match = await this.prisma.match.update({
      where: { id },
      data: {
        ...dto,
        kickoffAt: dto.kickoffAt ? new Date(dto.kickoffAt) : undefined
      }
    });

    await this.auditLogService.write({
      action: 'UPDATE',
      entityType: 'Match',
      entityId: id,
      before,
      after: match
    });

    return match;
  }

  async updateStatus(id: string, status: MatchStatus) {
    const before = await this.prisma.match.findUnique({ where: { id } });
    const match = await this.prisma.match.update({ where: { id }, data: { status } });
    await this.auditLogService.write({
      action: 'UPDATE_STATUS',
      entityType: 'Match',
      entityId: id,
      before,
      after: match
    });
    return match;
  }

  async updateResult(id: string, dto: UpdateMatchResultDto) {
    const before = await this.prisma.match.findUnique({ where: { id } });
    const match = await this.prisma.match.update({
      where: { id },
      data: {
        homeScore: dto.homeScore,
        awayScore: dto.awayScore,
        resultNote: dto.resultNote,
        status: MatchStatus.FINISHED
      }
    });

    await this.auditLogService.write({
      action: 'UPDATE_RESULT',
      entityType: 'Match',
      entityId: id,
      before,
      after: match
    });

    return match;
  }
}
