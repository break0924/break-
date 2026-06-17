import { Module } from '@nestjs/common';
import { ChallengeModule } from '../challenge/challenge.module';
import { EloModule } from '../elo';
import { FootballDataModule } from '../football-data/football-data.module';
import { MatchMonitorModule } from '../match-monitor/match-monitor.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResultSyncController } from './result-sync.controller';
import { ResultSyncService } from './result-sync.service';
import { PredictionSettlementService } from './prediction-settlement.service';
import { ChallengeSettlementService } from './challenge-settlement.service';
import { AdminMatchSyncController } from './admin-match-sync.controller';

@Module({
  imports: [
    PrismaModule,
    FootballDataModule,
    PredictionsModule,
    ChallengeModule,
    EloModule,
    MatchMonitorModule,
  ],
  controllers: [ResultSyncController, AdminMatchSyncController],
  providers: [
    ResultSyncService,
    PredictionSettlementService,
    ChallengeSettlementService,
  ],
  exports: [ResultSyncService],
})
export class ResultSyncModule {}
