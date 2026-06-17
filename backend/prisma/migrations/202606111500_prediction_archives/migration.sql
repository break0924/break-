CREATE TYPE "PredictionArchiveStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "prediction_archives" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "dailyRecommendationMatchId" TEXT,
  "status" "PredictionArchiveStatus" NOT NULL DEFAULT 'DRAFT',
  "homeTeamName" TEXT NOT NULL,
  "awayTeamName" TEXT NOT NULL,
  "kickoffAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recommendationDirection" "PredictionDirection" NOT NULL,
  "homeWinProb" DECIMAL(5,2) NOT NULL,
  "drawProb" DECIMAL(5,2) NOT NULL,
  "awayWinProb" DECIMAL(5,2) NOT NULL,
  "predictedHome" INTEGER NOT NULL,
  "predictedAway" INTEGER NOT NULL,
  "totalGoalsPrediction" INTEGER NOT NULL,
  "confidenceIndex" INTEGER NOT NULL,
  "riskIndex" INTEGER NOT NULL,
  "recommendationReason" TEXT NOT NULL,
  "riskTip" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "isMemberContent" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "originalContent" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prediction_archives_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prediction_archives_publish_state_check" CHECK (
    ("status" = 'DRAFT' AND "publishedAt" IS NULL)
    OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL)
  ),
  CONSTRAINT "prediction_archives_probability_check" CHECK (
    "homeWinProb" >= 0
    AND "homeWinProb" <= 100
    AND "drawProb" >= 0
    AND "drawProb" <= 100
    AND "awayWinProb" >= 0
    AND "awayWinProb" <= 100
  ),
  CONSTRAINT "prediction_archives_score_check" CHECK (
    "predictedHome" >= 0
    AND "predictedAway" >= 0
    AND "totalGoalsPrediction" >= 0
  ),
  CONSTRAINT "prediction_archives_index_check" CHECK (
    "confidenceIndex" >= 0
    AND "confidenceIndex" <= 100
    AND "riskIndex" >= 0
    AND "riskIndex" <= 100
  )
);

CREATE TABLE "prediction_settlements" (
  "id" TEXT NOT NULL,
  "predictionArchiveId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "resultDirection" "PredictionDirection" NOT NULL,
  "hitResult" BOOLEAN NOT NULL,
  "hitScore" BOOLEAN NOT NULL,
  "hitTotalGoals" BOOLEAN NOT NULL,
  "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prediction_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prediction_settlements_score_check" CHECK (
    "homeScore" >= 0
    AND "awayScore" >= 0
  )
);

CREATE TABLE "prediction_corrections" (
  "id" TEXT NOT NULL,
  "predictionArchiveId" TEXT NOT NULL,
  "correctionNote" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prediction_corrections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_archives_contentHash_key" ON "prediction_archives"("contentHash");
CREATE UNIQUE INDEX "prediction_archives_matchId_promptVersion_isMemberContent_key" ON "prediction_archives"("matchId", "promptVersion", "isMemberContent");
CREATE INDEX "prediction_archives_status_publishedAt_idx" ON "prediction_archives"("status", "publishedAt");
CREATE INDEX "prediction_archives_matchId_status_idx" ON "prediction_archives"("matchId", "status");
CREATE INDEX "prediction_archives_isPublic_status_publishedAt_idx" ON "prediction_archives"("isPublic", "status", "publishedAt");

CREATE UNIQUE INDEX "prediction_settlements_predictionArchiveId_key" ON "prediction_settlements"("predictionArchiveId");
CREATE INDEX "prediction_settlements_matchId_idx" ON "prediction_settlements"("matchId");
CREATE INDEX "prediction_settlements_settledAt_idx" ON "prediction_settlements"("settledAt");
CREATE INDEX "prediction_settlements_hitResult_hitScore_hitTotalGoals_idx" ON "prediction_settlements"("hitResult", "hitScore", "hitTotalGoals");

CREATE INDEX "prediction_corrections_predictionArchiveId_createdAt_idx" ON "prediction_corrections"("predictionArchiveId", "createdAt");

ALTER TABLE "prediction_archives" ADD CONSTRAINT "prediction_archives_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_archives" ADD CONSTRAINT "prediction_archives_dailyRecommendationMatchId_fkey" FOREIGN KEY ("dailyRecommendationMatchId") REFERENCES "daily_recommendation_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prediction_settlements" ADD CONSTRAINT "prediction_settlements_predictionArchiveId_fkey" FOREIGN KEY ("predictionArchiveId") REFERENCES "prediction_archives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_settlements" ADD CONSTRAINT "prediction_settlements_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_settlements" ADD CONSTRAINT "prediction_settlements_settledByUserId_fkey" FOREIGN KEY ("settledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prediction_corrections" ADD CONSTRAINT "prediction_corrections_predictionArchiveId_fkey" FOREIGN KEY ("predictionArchiveId") REFERENCES "prediction_archives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_corrections" ADD CONSTRAINT "prediction_corrections_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_published_prediction_archive_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."status" = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published prediction archives cannot be deleted';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."status" = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published prediction archives cannot be edited; append a correction note instead';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "prediction_archives_prevent_published_update"
BEFORE UPDATE OR DELETE ON "prediction_archives"
FOR EACH ROW
EXECUTE FUNCTION prevent_published_prediction_archive_mutation();
