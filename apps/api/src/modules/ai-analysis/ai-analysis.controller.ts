import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { AiAnalysisService } from './ai-analysis.service';
import { UpsertAiAnalysisDto } from './dto/upsert-ai-analysis.dto';

@Controller('admin')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('matches/:matchId/analysis/generate')
  async generate(@Param('matchId') matchId: string) {
    return ok(await this.aiAnalysisService.generateDraft(matchId));
  }

  @Get('matches/:matchId/analysis')
  async list(@Param('matchId') matchId: string) {
    return ok(await this.aiAnalysisService.listByMatch(matchId));
  }

  @Patch('analysis/:id')
  async update(@Param('id') id: string, @Body() dto: UpsertAiAnalysisDto) {
    return ok(await this.aiAnalysisService.update(id, dto));
  }

  @Patch('analysis/:id/publish')
  async publish(@Param('id') id: string) {
    return ok(await this.aiAnalysisService.publish(id));
  }

  @Patch('analysis/:id/reject')
  async reject(@Param('id') id: string, @Body('reviewerNote') reviewerNote?: string) {
    return ok(await this.aiAnalysisService.reject(id, reviewerNote));
  }
}
