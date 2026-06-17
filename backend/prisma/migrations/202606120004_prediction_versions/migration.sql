CREATE TYPE "PredictionVersionType" AS ENUM ('DAILY', 'EVENING', 'PRE_MATCH');

CREATE TYPE "PredictionHitStatus" AS ENUM ('PENDING', 'HIT', 'MISS', 'VOID');

CREATE TABLE "prediction_versions" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "predictionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "predictionType" "PredictionVersionType" NOT NULL,
  "recommendationDirection" "PredictionDirection" NOT NULL,
  "winDrawLossProbability" JSONB NOT NULL,
  "scorePrediction" TEXT NOT NULL,
  "predictedHome" INTEGER NOT NULL,
  "predictedAway" INTEGER NOT NULL,
  "overUnderPrediction" TEXT NOT NULL,
  "totalGoalsPrediction" INTEGER NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "riskIndex" INTEGER NOT NULL,
  "recommendationReason" TEXT NOT NULL,
  "riskTip" TEXT NOT NULL,
  "actualResult" TEXT,
  "hitStatus" "PredictionHitStatus" NOT NULL DEFAULT 'PENDING',
  "hitResult" BOOLEAN,
  "hitScore" BOOLEAN,
  "hitTotalGoals" BOOLEAN,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "originalContent" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "prediction_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_versions_contentHash_key" ON "prediction_versions"("contentHash");

CREATE INDEX "prediction_versions_matchId_predictionTime_idx" ON "prediction_versions"("matchId", "predictionTime");

CREATE INDEX "prediction_versions_predictionType_predictionTime_idx" ON "prediction_versions"("predictionType", "predictionTime");

CREATE INDEX "prediction_versions_hitStatus_settledAt_idx" ON "prediction_versions"("hitStatus", "settledAt");

ALTER TABLE "prediction_versions"
  ADD CONSTRAINT "prediction_versions_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
