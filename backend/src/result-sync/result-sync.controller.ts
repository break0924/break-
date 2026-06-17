import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SyncStatus } from '@prisma/client';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CorrectMatchResultDto } from './dto/correct-match-result.dto';
import { RunResultSyncDto } from './dto/run-result-sync.dto';
import { ResultSyncService } from './result-sync.service';

@Controller('admin/result-sync')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class ResultSyncController {
  constructor(private readonly resultSyncService: ResultSyncService) {}

  @Get('dashboard')
  dashboard(@Query('date') date?: string) {
    return this.resultSyncService.getDashboard(date);
  }

  @Get('logs')
  logs(@Query('limit') limit?: string, @Query('status') status?: SyncStatus) {
    return this.resultSyncService.listLogs({
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('sources')
  sources() {
    return this.resultSyncService.listDataSources();
  }

  @Get('matches')
  matches(@Query('date') date?: string) {
    return this.resultSyncService.listMatchSyncStatus(date);
  }

  @Post('run')
  run(@Body() dto: RunResultSyncDto) {
    return this.resultSyncService.runManual(dto);
  }

  @Post('matches/:id/sync')
  syncMatch(@Param('id') matchId: string, @Body() dto: RunResultSyncDto) {
    return this.resultSyncService.syncSingleMatch(
      matchId,
      dto.forceSettlement ?? true,
    );
  }

  @Patch('matches/:id/result')
  correctMatchResult(
    @Param('id') matchId: string,
    @Body() dto: CorrectMatchResultDto,
  ) {
    return this.resultSyncService.correctMatchResult(matchId, dto);
  }

  @Post('matches/:id/settle-predictions')
  settlePredictions(@Param('id') matchId: string) {
    return this.resultSyncService.settlePredictions(matchId);
  }

  @Post('matches/:id/settle-challenge')
  settleChallenge(@Param('id') matchId: string) {
    return this.resultSyncService.settleChallenge(matchId);
  }

  @Post('matches/:id/resettle')
  reSettleMatch(@Param('id') matchId: string) {
    return this.resultSyncService.reSettleMatch(matchId);
  }
}
