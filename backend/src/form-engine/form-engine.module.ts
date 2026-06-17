import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FormEngineCalculator } from './form-engine.calculator';
import { FormEngineService } from './form-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [FormEngineCalculator, FormEngineService],
  exports: [FormEngineCalculator, FormEngineService],
})
export class FormEngineModule {}
