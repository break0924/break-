import { Controller, Get, Query } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { AuditLogService } from './audit-log.service';

@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('entityType') entityType?: string
  ) {
    return ok(
      await this.auditLogService.list({
        page: Number(page),
        pageSize: Number(pageSize),
        entityType
      })
    );
  }
}
