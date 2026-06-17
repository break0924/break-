-- Prediction scheduling refactor: next-day generation, staged refresh, and append-only locks.

ALTER TABLE "Match"
  ADD COLUMN "predictionLockAt" TIMESTAMP(3),
  ADD COLUMN "predictionLockedAt" TIMESTAMP(3);

ALTER TABLE "prediction_archives"
  ADD COLUMN "lockedAt" TIMESTAMP(3);

ALTER TABLE "prediction_versions"
  ADD COLUMN "refreshStage" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "scheduledFor" TIMESTAMP(3),
  ADD COLUMN "lockedAt" TIMESTAMP(3);

CREATE INDEX "Match_predictionLockAt_idx" ON "Match"("predictionLockAt");
CREATE INDEX "Match_predictionLockedAt_idx" ON "Match"("predictionLockedAt");
CREATE INDEX "prediction_archives_lockedAt_idx" ON "prediction_archives"("lockedAt");
CREATE INDEX "prediction_versions_refreshStage_scheduledFor_idx" ON "prediction_versions"("refreshStage", "scheduledFor");
CREATE INDEX "prediction_versions_lockedAt_idx" ON "prediction_versions"("lockedAt");
CREATE UNIQUE INDEX "prediction_versions_matchId_predictionType_refreshStage_key"
  ON "prediction_versions"("matchId", "predictionType", "refreshStage");
