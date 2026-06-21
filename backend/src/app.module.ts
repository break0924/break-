import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './ai/ai.module';
import { AdminAiModule } from './admin-ai/admin-ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ChallengeModule } from './challenge/challenge.module';
import { CompatModule } from './compat/compat.module';
import { EloModule } from './elo';
import { FootballDataModule } from './football-data/football-data.module';
import { FormEngineModule } from './form-engine';
import { HeadToHeadEngineModule } from './head-to-head-engine';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MatchMonitorModule } from './match-monitor/match-monitor.module';
import { MatchesModule } from './matches/matches.module';
import { MembershipModule } from './membership/membership.module';
import { PredictionEngineModule } from './prediction-engine';
import { PrismaModule } from './prisma/prisma.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ResultSyncModule } from './result-sync/result-sync.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ChatModule,
    HealthModule,
    MatchMonitorModule,
    UsersModule,
    MatchesModule,
    MembershipModule,
    ChallengeModule,
    CompatModule,
    EloModule,
    FormEngineModule,
    HeadToHeadEngineModule,
    FootballDataModule,
    AiModule,
    PredictionEngineModule,
    RecommendationsModule,
    PredictionsModule,
    ResultSyncModule,
    AdminAiModule,
    JobsModule,
  ],
})
export class AppModule {}
