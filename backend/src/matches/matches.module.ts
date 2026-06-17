import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EloModule } from '../elo';
import { MatchMonitorModule } from '../match-monitor/match-monitor.module';
import { UsersModule } from '../users/users.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [AiModule, UsersModule, MatchMonitorModule, EloModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
