ALTER TABLE "Match" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

CREATE INDEX "Match_lastSyncedAt_idx" ON "Match"("lastSyncedAt");
