import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { GenerateDailyRecommendationDto } from './dto/generate-daily-recommendation.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('today')
  @UseGuards(OptionalJwtAuthGuard)
  today(@CurrentUser() user?: JwtUser) {
    return this.recommendationsService.getToday(user?.id);
  }

  @Post('daily/generate')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generate(@Body() dto: GenerateDailyRecommendationDto) {
    return this.recommendationsService.generateDailyRecommendation(
      dto.date ? new Date(dto.date) : new Date(),
    );
  }
}
