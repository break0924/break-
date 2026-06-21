import { Module } from '@nestjs/common';
import { ChallengeModule } from '../challenge/challenge.module';
import { FootballDataModule } from '../football-data/football-data.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResultSyncModule } from '../result-sync/result-sync.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    PrismaModule,
    FootballDataModule,
    PredictionsModule,
    ResultSyncModule,
    ChallengeModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
