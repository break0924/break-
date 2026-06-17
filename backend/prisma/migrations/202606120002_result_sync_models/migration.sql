-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'CONFLICT');

-- CreateTable
CREATE TABLE "result_data_source_configs" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "apiKeyEnv" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "pollingCron" TEXT,
  "requestTimeoutMs" INTEGER NOT NULL DEFAULT 10000,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "result_data_source_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_sync_logs" (
  "id" TEXT NOT NULL,
  "sourceConfigId" TEXT,
  "targetMatchId" TEXT,
  "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
  "triggerType" TEXT NOT NULL,
  "syncWindowStart" TIMESTAMP(3),
  "syncWindowEnd" TIMESTAMP(3),
  "requestUrl" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "errorMessage" TEXT,
  "matchedCount" INTEGER NOT NULL DEFAULT 0,
  "updatedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "conflictCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "result_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_results" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "sourceConfigId" TEXT,
  "syncLogId" TEXT,
  "sourceName" TEXT NOT NULL,
  "sourceMatchId" TEXT,
  "status" "MatchStatus" NOT NULL,
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "resultDirection" "PredictionDirection",
  "winnerTeamId" TEXT,
  "isFinal" BOOLEAN NOT NULL DEFAULT false,
  "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
  "rawPayload" JSONB,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "correctedAt" TIMESTAMP(3),
  "correctedByUserId" TEXT,
  "correctionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "match_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "result_data_source_configs_code_key" ON "result_data_source_configs"("code");

-- CreateIndex
CREATE INDEX "result_data_source_configs_isActive_priority_idx" ON "result_data_source_configs"("isActive", "priority");

-- CreateIndex
CREATE INDEX "result_sync_logs_status_createdAt_idx" ON "result_sync_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "result_sync_logs_sourceConfigId_createdAt_idx" ON "result_sync_logs"("sourceConfigId", "createdAt");

-- CreateIndex
CREATE INDEX "result_sync_logs_targetMatchId_createdAt_idx" ON "result_sync_logs"("targetMatchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_matchId_sourceName_key" ON "match_results"("matchId", "sourceName");

-- CreateIndex
CREATE INDEX "match_results_matchId_isFinal_idx" ON "match_results"("matchId", "isFinal");

-- CreateIndex
CREATE INDEX "match_results_sourceConfigId_syncedAt_idx" ON "match_results"("sourceConfigId", "syncedAt");

-- CreateIndex
CREATE INDEX "match_results_syncLogId_idx" ON "match_results"("syncLogId");

-- CreateIndex
CREATE INDEX "match_results_status_syncedAt_idx" ON "match_results"("status", "syncedAt");

-- AddForeignKey
ALTER TABLE "result_sync_logs" ADD CONSTRAINT "result_sync_logs_sourceConfigId_fkey" FOREIGN KEY ("sourceConfigId") REFERENCES "result_data_source_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_sync_logs" ADD CONSTRAINT "result_sync_logs_targetMatchId_fkey" FOREIGN KEY ("targetMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_sourceConfigId_fkey" FOREIGN KEY ("sourceConfigId") REFERENCES "result_data_source_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_syncLogId_fkey" FOREIGN KEY ("syncLogId") REFERENCES "result_sync_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_correctedByUserId_fkey" FOREIGN KEY ("correctedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
