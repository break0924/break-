import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EloCalculator } from './elo.calculator';
import { EloUpdateService } from './elo-update.service';

@Module({
  imports: [PrismaModule],
  providers: [EloCalculator, EloUpdateService],
  exports: [EloCalculator, EloUpdateService],
})
export class EloModule {}
