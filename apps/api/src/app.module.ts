import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './common/prisma/prisma.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { MatchesModule } from './modules/matches/matches.module';
import { OddsModule } from './modules/odds/odds.module';
import { SimulationModule } from './modules/simulation/simulation.module';
import { TeamsModule } from './modules/teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    PrismaModule,
    AuthModule,
    TeamsModule,
    MatchesModule,
    OddsModule,
    SimulationModule,
    CalculatorModule,
    AiAnalysisModule,
    AdminModule,
    AuditLogModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {}
