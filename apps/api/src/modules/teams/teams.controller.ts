import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('teams')
  async list() {
    return ok(await this.teamsService.list());
  }

  @Post('admin/teams')
  async create(@Body() dto: CreateTeamDto) {
    return ok(await this.teamsService.create(dto));
  }

  @Patch('admin/teams/:id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTeamDto>) {
    return ok(await this.teamsService.update(id, dto));
  }
}
