import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FootballDataService } from './football-data.service';
import { ApiFootballProvider } from './providers/api-football.provider';
import { ManualProvider } from './providers/manual.provider';
import { SportmonksProvider } from './providers/sportmonks.provider';

@Module({
  imports: [PrismaModule],
  providers: [
    FootballDataService,
    ApiFootballProvider,
    SportmonksProvider,
    ManualProvider,
  ],
  exports: [FootballDataService],
})
export class FootballDataModule {}
