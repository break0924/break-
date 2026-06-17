import { Controller, Get, Param, Query } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { QueryMatchesDto } from './dto/query-matches.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async list(@Query() query: QueryMatchesDto) {
    return ok(await this.matchesService.list(query));
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return ok(await this.matchesService.detail(id));
  }

  @Get(':id/analysis')
  async analysis(@Param('id') id: string) {
    return ok(await this.matchesService.publishedAnalysis(id));
  }
}
