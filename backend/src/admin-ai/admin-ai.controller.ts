import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchesService } from '../matches/matches.service';
import { GenerateDailyRecommendationDto } from '../recommendations/dto/generate-daily-recommendation.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminAiController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post('reports/:matchId/regenerate')
  regenerateMatchReport(@Param('matchId') matchId: string) {
    return this.matchesService.generateAiReport(matchId);
  }

  @Post('daily-recommendations/regenerate')
  regenerateDailyRecommendation(@Body() dto: GenerateDailyRecommendationDto) {
    return this.recommendationsService.generateDailyRecommendation(
      dto.date ? new Date(dto.date) : new Date(),
    );
  }
}
