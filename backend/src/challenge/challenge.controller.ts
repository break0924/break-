import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ChallengeService } from './challenge.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { SetTournamentResultDto } from './dto/set-tournament-result.dto';
import { SubmitMatchPredictionDto } from './dto/submit-match-prediction.dto';
import { SubmitTournamentPickDto } from './dto/submit-tournament-pick.dto';

@Controller('challenge')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Post('seasons')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.challengeService.upsertSeason(dto);
  }

  @Post('seasons/:id/results')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  setTournamentResult(
    @Param('id') id: string,
    @Body() dto: SetTournamentResultDto,
  ) {
    return this.challengeService.setTournamentResult(id, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  home(@CurrentUser() user?: JwtUser) {
    return this.challengeService.getHome(user?.id);
  }

  @Post('match-predictions')
  @UseGuards(JwtAuthGuard)
  submitMatchPrediction(
    @CurrentUser() user: JwtUser,
    @Body() dto: SubmitMatchPredictionDto,
  ) {
    return this.challengeService.submitMatchPrediction(user.id, dto);
  }

  @Post('match-predictions/lock-due')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  lockDuePredictions() {
    return this.challengeService.lockDuePredictions();
  }

  @Post('tournament-pick')
  @UseGuards(JwtAuthGuard)
  submitTournamentPick(
    @CurrentUser() user: JwtUser,
    @Body() dto: SubmitTournamentPickDto,
  ) {
    return this.challengeService.submitTournamentPick(user.id, dto);
  }

  @Get('leaderboard')
  leaderboard(@Query('seasonId') seasonId?: string) {
    return this.challengeService.leaderboard(seasonId);
  }

  @Get('my-score')
  @UseGuards(JwtAuthGuard)
  myScore(@CurrentUser() user: JwtUser, @Query('seasonId') seasonId?: string) {
    return this.challengeService.myScore(user.id, seasonId);
  }
}
