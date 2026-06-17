ALTER TABLE "prediction_archives"
  ADD COLUMN "predictionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "engineModelVersion" TEXT NOT NULL DEFAULT 'prediction-engine-v1',
  ADD COLUMN "engineWeightConfig" JSONB,
  ADD COLUMN "engineFactorScores" JSONB,
  ADD COLUMN "finalProbability" JSONB;

DROP INDEX "prediction_archives_matchId_promptVersion_isMemberContent_key";

CREATE UNIQUE INDEX "prediction_archives_matchId_promptVersion_engineModelVersion_isMemberContent_key"
  ON "prediction_archives"("matchId", "promptVersion", "engineModelVersion", "isMemberContent");

CREATE INDEX "prediction_archives_predictionTime_idx" ON "prediction_archives"("predictionTime");
