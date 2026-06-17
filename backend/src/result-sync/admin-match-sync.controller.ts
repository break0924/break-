import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RunResultSyncDto } from './dto/run-result-sync.dto';
import { ResultSyncService } from './result-sync.service';

@Controller('admin/matches')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminMatchSyncController {
  constructor(private readonly resultSyncService: ResultSyncService) {}

  @Post(':id/sync-result')
  syncResult(@Param('id') matchId: string, @Body() dto: RunResultSyncDto) {
    return this.resultSyncService.syncSingleMatch(
      matchId,
      dto.forceSettlement ?? true,
    );
  }
}
