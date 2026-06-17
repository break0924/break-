import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService
  ) {}

  list() {
    return this.prisma.team.findMany({
      where: { isActive: true },
      orderBy: [{ groupName: 'asc' }, { name: 'asc' }]
    });
  }

  async create(dto: CreateTeamDto) {
    const team = await this.prisma.team.create({ data: dto });
    await this.auditLogService.write({
      action: 'CREATE',
      entityType: 'Team',
      entityId: team.id,
      after: team
    });
    return team;
  }

  async update(id: string, dto: Partial<CreateTeamDto>) {
    const before = await this.prisma.team.findUnique({ where: { id } });
    const team = await this.prisma.team.update({ where: { id }, data: dto });
    await this.auditLogService.write({
      action: 'UPDATE',
      entityType: 'Team',
      entityId: id,
      before,
      after: team
    });
    return team;
  }
}
