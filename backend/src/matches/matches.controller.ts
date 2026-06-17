import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateAiReportDto } from './dto/create-ai-report.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { ListMatchesQueryDto } from './dto/list-matches-query.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';
import { MatchesService } from './matches.service';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('teams')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  createTeam(@Body() dto: CreateTeamDto) {
    return this.matchesService.createTeam(dto);
  }

  @Get('teams')
  listTeams() {
    return this.matchesService.listTeams();
  }

  @Post('matches')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  createMatch(@Body() dto: CreateMatchDto) {
    return this.matchesService.createMatch(dto);
  }

  @Get('matches')
  listMatches(@Query() query: ListMatchesQueryDto) {
    return this.matchesService.listMatches(query);
  }

  @Get('matches/filters')
  listMatchFilters() {
    return this.matchesService.listMatchFilters();
  }

  @Get('matches/:id')
  getMatch(@Param('id') id: string) {
    return this.matchesService.getMatch(id);
  }

  @Patch('matches/:id/result')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  updateResult(@Param('id') id: string, @Body() dto: UpdateMatchResultDto) {
    return this.matchesService.updateResult(id, dto);
  }

  @Post('matches/:id/ai-report')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  upsertAiReport(@Param('id') id: string, @Body() dto: CreateAiReportDto) {
    return this.matchesService.upsertAiReport(id, dto);
  }

  @Post('matches/:id/ai-report/generate')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generateAiReport(@Param('id') id: string) {
    return this.matchesService.generateAiReport(id);
  }

  @Get('matches/:id/ai-report')
  @UseGuards(OptionalJwtAuthGuard)
  getAiReport(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.matchesService.getAiReport(id, user?.id);
  }
}
