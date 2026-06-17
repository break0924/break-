CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MembershipStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED', 'REFUNDED');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "MatchStage" AS ENUM ('GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');
CREATE TYPE "PredictionDirection" AS ENUM ('HOME_WIN', 'DRAW', 'AWAY_WIN');
CREATE TYPE "PredictionLockStatus" AS ENUM ('OPEN', 'LOCKED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CLOSED', 'FAILED', 'REFUNDED');
CREATE TYPE "AiJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "openId" TEXT NOT NULL,
  "unionId" TEXT,
  "nickname" TEXT,
  "avatarUrl" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'NONE',
  "membershipExpireAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "fifaCode" TEXT NOT NULL,
  "countryCode" TEXT,
  "name" TEXT NOT NULL,
  "nameEn" TEXT,
  "groupName" TEXT,
  "flagUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameEn" TEXT,
  "position" TEXT,
  "isKey" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "stage" "MatchStage" NOT NULL,
  "groupName" TEXT,
  "homeTeamId" TEXT NOT NULL,
  "awayTeamId" TEXT NOT NULL,
  "kickoffAt" TIMESTAMP(3) NOT NULL,
  "venue" TEXT,
  "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "lockAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_reports" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "fullContent" TEXT NOT NULL,
  "homeWinProb" DECIMAL(5,2) NOT NULL,
  "drawProb" DECIMAL(5,2) NOT NULL,
  "awayWinProb" DECIMAL(5,2) NOT NULL,
  "predictedHome" INTEGER NOT NULL,
  "predictedAway" INTEGER NOT NULL,
  "riskIndex" INTEGER NOT NULL,
  "confidenceIndex" INTEGER NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_recommendations" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "intro" TEXT,
  "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
  "promptVersion" TEXT NOT NULL,
  "model" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "daily_recommendation_matches" (
  "id" TEXT NOT NULL,
  "dailyRecommendationId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "recommendationDirection" "PredictionDirection" NOT NULL,
  "predictedHome" INTEGER NOT NULL,
  "predictedAway" INTEGER NOT NULL,
  "homeWinProb" DECIMAL(5,2) NOT NULL,
  "drawProb" DECIMAL(5,2) NOT NULL,
  "awayWinProb" DECIMAL(5,2) NOT NULL,
  "riskIndex" INTEGER NOT NULL,
  "confidenceIndex" INTEGER NOT NULL,
  "freeReason" TEXT NOT NULL,
  "memberReason" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_recommendation_matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChallengeSeason" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "actualChampionTeamId" TEXT,
  "actualGoldenBootName" TEXT,
  "resultScoredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChallengeSeason_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChallengeSeasonFinalFour" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChallengeSeasonFinalFour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchPrediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "direction" "PredictionDirection" NOT NULL,
  "predictedHome" INTEGER,
  "predictedAway" INTEGER,
  "lockStatus" "PredictionLockStatus" NOT NULL DEFAULT 'OPEN',
  "lockedAt" TIMESTAMP(3),
  "points" INTEGER NOT NULL DEFAULT 0,
  "scoredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchPrediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentPick" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "championTeamId" TEXT,
  "goldenBootName" TEXT,
  "lockedAt" TIMESTAMP(3),
  "points" INTEGER NOT NULL DEFAULT 0,
  "scoredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TournamentPick_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TournamentPickFinalFour" (
  "id" TEXT NOT NULL,
  "tournamentPickId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TournamentPickFinalFour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChallengeScore" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "title" TEXT,
  "rank" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChallengeScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_plans" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "benefits" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_orders" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "orderNo" TEXT NOT NULL,
  "wechatPrepayId" TEXT,
  "wechatTransactionId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "membership_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_generation_logs" (
  "id" TEXT NOT NULL,
  "jobType" TEXT NOT NULL,
  "targetId" TEXT,
  "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
  "promptVersion" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "errorMessage" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_openId_key" ON "User"("openId");
CREATE INDEX "User_membershipStatus_membershipExpireAt_idx" ON "User"("membershipStatus", "membershipExpireAt");
CREATE UNIQUE INDEX "Team_fifaCode_key" ON "Team"("fifaCode");
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

CREATE UNIQUE INDEX "Player_teamId_name_key" ON "Player"("teamId", "name");
CREATE UNIQUE INDEX "Match_externalId_key" ON "Match"("externalId");
CREATE INDEX "Match_kickoffAt_idx" ON "Match"("kickoffAt");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE UNIQUE INDEX "ai_reports_matchId_key" ON "ai_reports"("matchId");
CREATE UNIQUE INDEX "daily_recommendations_date_key" ON "daily_recommendations"("date");
CREATE UNIQUE INDEX "daily_recommendation_matches_dailyRecommendationId_matchId_key" ON "daily_recommendation_matches"("dailyRecommendationId", "matchId");
CREATE INDEX "daily_recommendation_matches_matchId_idx" ON "daily_recommendation_matches"("matchId");
CREATE UNIQUE INDEX "MatchPrediction_userId_matchId_key" ON "MatchPrediction"("userId", "matchId");
CREATE INDEX "MatchPrediction_matchId_idx" ON "MatchPrediction"("matchId");
CREATE INDEX "MatchPrediction_userId_points_idx" ON "MatchPrediction"("userId", "points");
CREATE UNIQUE INDEX "ChallengeSeasonFinalFour_seasonId_teamId_key" ON "ChallengeSeasonFinalFour"("seasonId", "teamId");
CREATE UNIQUE INDEX "TournamentPick_userId_seasonId_key" ON "TournamentPick"("userId", "seasonId");
CREATE UNIQUE INDEX "TournamentPickFinalFour_tournamentPickId_teamId_key" ON "TournamentPickFinalFour"("tournamentPickId", "teamId");
CREATE UNIQUE INDEX "ChallengeScore_userId_seasonId_key" ON "ChallengeScore"("userId", "seasonId");
CREATE INDEX "ChallengeScore_seasonId_points_idx" ON "ChallengeScore"("seasonId", "points");
CREATE UNIQUE INDEX "membership_plans_code_key" ON "membership_plans"("code");
CREATE UNIQUE INDEX "membership_orders_orderNo_key" ON "membership_orders"("orderNo");
CREATE INDEX "membership_orders_userId_status_idx" ON "membership_orders"("userId", "status");
CREATE INDEX "membership_orders_orderNo_idx" ON "membership_orders"("orderNo");
CREATE INDEX "ai_generation_logs_jobType_targetId_idx" ON "ai_generation_logs"("jobType", "targetId");
CREATE INDEX "ai_generation_logs_status_idx" ON "ai_generation_logs"("status");

CREATE TABLE "knowledge_base_documents" (
  "id" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" JSONB NOT NULL,
  "imageUrl" TEXT,
  "flagUrl" TEXT,
  "embeddingText" TEXT NOT NULL,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_base_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_base_documents_sourceKey_key" ON "knowledge_base_documents"("sourceKey");

CREATE INDEX "knowledge_base_documents_type_idx" ON "knowledge_base_documents"("type");

ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "daily_recommendation_matches" ADD CONSTRAINT "daily_recommendation_matches_dailyRecommendationId_fkey" FOREIGN KEY ("dailyRecommendationId") REFERENCES "daily_recommendations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "daily_recommendation_matches" ADD CONSTRAINT "daily_recommendation_matches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeSeason" ADD CONSTRAINT "ChallengeSeason_actualChampionTeamId_fkey" FOREIGN KEY ("actualChampionTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChallengeSeasonFinalFour" ADD CONSTRAINT "ChallengeSeasonFinalFour_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ChallengeSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeSeasonFinalFour" ADD CONSTRAINT "ChallengeSeasonFinalFour_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchPrediction" ADD CONSTRAINT "MatchPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchPrediction" ADD CONSTRAINT "MatchPrediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TournamentPick" ADD CONSTRAINT "TournamentPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TournamentPick" ADD CONSTRAINT "TournamentPick_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ChallengeSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TournamentPick" ADD CONSTRAINT "TournamentPick_championTeamId_fkey" FOREIGN KEY ("championTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TournamentPickFinalFour" ADD CONSTRAINT "TournamentPickFinalFour_tournamentPickId_fkey" FOREIGN KEY ("tournamentPickId") REFERENCES "TournamentPick"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TournamentPickFinalFour" ADD CONSTRAINT "TournamentPickFinalFour_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeScore" ADD CONSTRAINT "ChallengeScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChallengeScore" ADD CONSTRAINT "ChallengeScore_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ChallengeSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "membership_orders" ADD CONSTRAINT "membership_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "membership_orders" ADD CONSTRAINT "membership_orders_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
