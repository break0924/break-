import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { FormEngineModule } from '../form-engine';
import { HeadToHeadEngineModule } from '../head-to-head-engine';
import { PredictionEngineModule } from '../prediction-engine';
import { PrismaModule } from '../prisma/prisma.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    PredictionEngineModule,
    FormEngineModule,
    HeadToHeadEngineModule,
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
