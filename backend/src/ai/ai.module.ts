import { Module } from '@nestjs/common';
import { AiContentPolicyService } from './ai-content-policy.service';
import { AiService } from './ai.service';

@Module({
  providers: [AiContentPolicyService, AiService],
  exports: [AiContentPolicyService, AiService],
})
export class AiModule {}
