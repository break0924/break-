ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'POSTPONED';

ALTER TABLE "result_sync_logs"
  ADD COLUMN "matchId" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "rawPayload" JSONB,
  ADD COLUMN "syncedAt" TIMESTAMP(3),
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "result_sync_logs_matchId_syncedAt_idx" ON "result_sync_logs"("matchId", "syncedAt");
CREATE INDEX "result_sync_logs_provider_syncedAt_idx" ON "result_sync_logs"("provider", "syncedAt");
CREATE INDEX "result_sync_logs_syncStatus_syncedAt_idx" ON "result_sync_logs"("syncStatus", "syncedAt");
