import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { AiProviderService } from './ai-provider.service';

@Module({
  imports: [AuditLogModule],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService, AiProviderService]
})
export class AiAnalysisModule {}
