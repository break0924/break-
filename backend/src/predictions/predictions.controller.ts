import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PredictionVersionType } from '@prisma/client';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArchiveQueryDto } from './dto/archive-query.dto';
import { GenerateDailyPredictionsDto } from './dto/generate-daily-predictions.dto';
import { PublishPredictionsDto } from './dto/publish-predictions.dto';
import { RecordMatchResultDto } from './dto/record-match-result.dto';
import { SettlePredictionsDto } from './dto/settle-predictions.dto';
import { PredictionsService } from './predictions.service';

@Controller()
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post('admin/predictions/generate-daily')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generateDaily(@Body() dto: GenerateDailyPredictionsDto) {
    return this.predictionsService.generateDailyDrafts(dto);
  }

  @Post('admin/predictions/generate-next-day')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generateNextDay() {
    return this.predictionsService.generateNextDay();
  }

  @Post('admin/predictions/publish-next-day')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  publishNextDay() {
    return this.predictionsService.publishNextDay();
  }

  @Post('admin/predictions/generate-by-date')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generateByDate(
    @Body() dto: GenerateDailyPredictionsDto,
    @Query('date') date?: string,
    @Query('publish') publish?: string,
  ) {
    return this.predictionsService.generateByDate({
      ...dto,
      date: dto.date || date,
      publish: dto.publish ?? publish === 'true',
    });
  }

  @Post('admin/predictions/generate-by-match/:matchId')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generateByMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.generateByMatch(matchId);
  }

  @Post('admin/predictions/check-missing')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  checkMissing(@Body() dto: { matchId?: string; date?: string }) {
    return this.predictionsService.checkMissingPredictions(dto);
  }

  @Post('admin/predictions/refresh-versions')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  refreshVersions(
    @Body()
    dto: {
      predictionType?: PredictionVersionType;
      date?: string;
    },
  ) {
    return this.predictionsService.generatePredictionVersions(
      dto.predictionType ?? PredictionVersionType.DAILY,
      dto.date,
    );
  }

  @Post('admin/predictions/refresh/:matchId')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  refreshMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.refreshMatchPrediction(matchId);
  }

  @Post('admin/predictions/finalize/:matchId')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  finalizeMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.finalizeMatchPrediction(matchId);
  }

  @Post('admin/predictions/lock/:matchId')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  lockMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.lockMatchPrediction(matchId);
  }

  @Post('admin/predictions/publish')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  publish(@Body() dto: PublishPredictionsDto) {
    return this.predictionsService.publishPredictions(dto);
  }

  @Get('predictions/today')
  today(@Query('date') date?: string) {
    return this.predictionsService.getToday(date);
  }

  @Get('predictions/archive')
  archive(@Query() query: ArchiveQueryDto) {
    return this.predictionsService.getArchive(query);
  }

  @Get('predictions/matches/:matchId')
  matchPrediction(@Param('matchId') matchId: string) {
    return this.predictionsService.getByMatchId(matchId);
  }

  @Get('predictions/by-match/:matchId')
  predictionByMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.getByMatchId(matchId);
  }

  @Get('predictions/stats')
  stats() {
    return this.predictionsService.getStats();
  }

  @Get('admin/predictions/backtest')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  backtest() {
    return this.predictionsService.runBacktest();
  }

  @Post('admin/predictions/backtest')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  runBacktest() {
    return this.predictionsService.runBacktest();
  }

  @Get('admin/predictions/calibration')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  calibration() {
    return this.predictionsService.getModelCalibration();
  }

  @Post('admin/predictions/calibration/train')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  trainCalibration() {
    return this.predictionsService.trainModelCalibration();
  }

  @Get('admin/predictions/versions')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  versions(@Query() query: { matchId?: string; type?: string }) {
    return this.predictionsService.getPredictionVersions(query);
  }

  @Post('admin/matches/:id/result')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  recordResult(@Param('id') matchId: string, @Body() dto: RecordMatchResultDto) {
    return this.predictionsService.recordMatchResult(matchId, dto);
  }

  @Post('admin/matches/:id/prematch-context')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  updatePreMatchContext(
    @Param('id') matchId: string,
    @Body()
    dto: {
      homeInjuryImpact?: number;
      awayInjuryImpact?: number;
      homeInjuryNotes?: unknown;
      awayInjuryNotes?: unknown;
      homeLineupStatus?: unknown;
      awayLineupStatus?: unknown;
      homeLineupStability?: number;
      awayLineupStability?: number;
      homeMotivationScore?: number;
      awayMotivationScore?: number;
      weatherImpact?: number;
      weatherSnapshot?: unknown;
      homeTravelFatigue?: number;
      awayTravelFatigue?: number;
      travelSnapshot?: unknown;
    },
  ) {
    return this.predictionsService.updateMatchPreMatchContext(matchId, dto);
  }

  @Post('admin/matches/:id/odds-snapshot')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  createOddsSnapshot(
    @Param('id') matchId: string,
    @Body()
    dto: {
      provider?: string;
      capturedAt?: string;
      openingHomeOdds?: number;
      openingDrawOdds?: number;
      openingAwayOdds?: number;
      currentHomeOdds: number;
      currentDrawOdds: number;
      currentAwayOdds: number;
      asianHandicapLine?: string;
      asianHandicapHomeOdds?: number;
      asianHandicapAwayOdds?: number;
      overUnderLine?: number;
      overOdds?: number;
      underOdds?: number;
      rawPayload?: unknown;
    },
  ) {
    return this.predictionsService.createMatchOddsSnapshot(matchId, dto);
  }

  @Post('admin/predictions/settle/:matchId')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  settle(@Param('matchId') matchId: string, @Body() dto: SettlePredictionsDto) {
    return this.predictionsService.settleMatch(matchId, dto.settledByUserId, true);
  }
}
