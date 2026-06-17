import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateOddsDto } from './dto/create-odds.dto';

@Injectable()
export class OddsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService
  ) {}

  listByMatch(matchId: string) {
    return this.prisma.oddsSnapshot.findMany({
      where: { matchId },
      orderBy: { capturedAt: 'desc' }
    });
  }

  async create(matchId: string, dto: CreateOddsDto) {
    await this.prisma.oddsSnapshot.updateMany({
      where: {
        matchId,
        market: dto.market,
        selection: dto.selection,
        isLatest: true
      },
      data: { isLatest: false }
    });

    const odds = await this.prisma.oddsSnapshot.create({
      data: {
        matchId,
        market: dto.market,
        selection: dto.selection,
        odds: dto.odds,
        source: dto.source,
        isLatest: true
      }
    });

    await this.auditLogService.write({
      action: 'CREATE',
      entityType: 'OddsSnapshot',
      entityId: odds.id,
      after: odds
    });

    return odds;
  }
}
