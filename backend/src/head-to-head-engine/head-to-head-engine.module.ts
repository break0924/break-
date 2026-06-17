import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HeadToHeadEngineCalculator } from './head-to-head-engine.calculator';
import { HeadToHeadEngineService } from './head-to-head-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [HeadToHeadEngineCalculator, HeadToHeadEngineService],
  exports: [HeadToHeadEngineCalculator, HeadToHeadEngineService],
})
export class HeadToHeadEngineModule {}
