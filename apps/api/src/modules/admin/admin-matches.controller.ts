import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { ok } from '../../common/dto/api-response';
import { AdminMatchesService } from './admin-matches.service';
import { CreateMatchDto, UpdateMatchResultDto } from './dto/create-match.dto';

@Controller('admin/matches')
export class AdminMatchesController {
  constructor(private readonly adminMatchesService: AdminMatchesService) {}

  @Get()
  async list() {
    return ok(await this.adminMatchesService.list());
  }

  @Post()
  async create(@Body() dto: CreateMatchDto) {
    return ok(await this.adminMatchesService.create(dto));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateMatchDto>) {
    return ok(await this.adminMatchesService.update(id, dto));
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: MatchStatus) {
    return ok(await this.adminMatchesService.updateStatus(id, status));
  }

  @Patch(':id/result')
  async updateResult(@Param('id') id: string, @Body() dto: UpdateMatchResultDto) {
    return ok(await this.adminMatchesService.updateResult(id, dto));
  }
}
