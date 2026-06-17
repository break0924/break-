import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { CreateOddsDto } from './dto/create-odds.dto';
import { OddsService } from './odds.service';

@Controller()
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('admin/matches/:matchId/odds')
  async listByMatch(@Param('matchId') matchId: string) {
    return ok(await this.oddsService.listByMatch(matchId));
  }

  @Post('admin/matches/:matchId/odds')
  async create(@Param('matchId') matchId: string, @Body() dto: CreateOddsDto) {
    return ok(await this.oddsService.create(matchId, dto));
  }
}
