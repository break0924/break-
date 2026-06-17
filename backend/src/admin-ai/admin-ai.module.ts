import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { AdminAiController } from './admin-ai.controller';

@Module({
  imports: [MatchesModule, RecommendationsModule],
  controllers: [AdminAiController],
})
export class AdminAiModule {}
