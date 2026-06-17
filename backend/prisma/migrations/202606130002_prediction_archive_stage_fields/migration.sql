ALTER TABLE "prediction_archives"
  ADD COLUMN "modelVersion" TEXT NOT NULL DEFAULT 'prediction-engine-v1',
  ADD COLUMN "predictionStage" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "predictedScore" TEXT,
  ADD COLUMN "confidenceLevel" TEXT,
  ADD COLUMN "riskLevel" TEXT,
  ADD COLUMN "shortAnalysis" TEXT,
  ADD COLUMN "fullAnalysis" TEXT,
  ADD COLUMN "disclaimer" TEXT,
  ADD COLUMN "correctionNote" TEXT;

DROP INDEX IF EXISTS "prediction_archives_matchId_promptVersion_engineModelVersion_isMemberContent_key";

CREATE UNIQUE INDEX "prediction_archives_matchId_promptVersion_engineModelVersion_isMemberContent_predictionStage_key"
  ON "prediction_archives"("matchId", "promptVersion", "engineModelVersion", "isMemberContent", "predictionStage");

CREATE INDEX "prediction_archives_predictionStage_predictionTime_idx"
  ON "prediction_archives"("predictionStage", "predictionTime");
