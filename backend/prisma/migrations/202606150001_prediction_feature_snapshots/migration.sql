CREATE TABLE "prediction_feature_snapshots" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "archiveId" TEXT NOT NULL,
  "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "modelVersion" TEXT NOT NULL,
  "dataVersion" TEXT NOT NULL,
  "promptVersion" TEXT,
  "featureInputs" JSONB NOT NULL,
  "rawInputs" JSONB,
  "factorScores" JSONB NOT NULL,
  "weightConfig" JSONB NOT NULL,
  "modelOutput" JSONB NOT NULL,
  "dataQuality" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "prediction_feature_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_feature_snapshots_archiveId_key"
  ON "prediction_feature_snapshots"("archiveId");

CREATE INDEX "prediction_feature_snapshots_matchId_snapshotAt_idx"
  ON "prediction_feature_snapshots"("matchId", "snapshotAt");

CREATE INDEX "prediction_feature_snapshots_modelVersion_snapshotAt_idx"
  ON "prediction_feature_snapshots"("modelVersion", "snapshotAt");

ALTER TABLE "prediction_feature_snapshots"
  ADD CONSTRAINT "prediction_feature_snapshots_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "prediction_feature_snapshots"
  ADD CONSTRAINT "prediction_feature_snapshots_archiveId_fkey"
  FOREIGN KEY ("archiveId") REFERENCES "prediction_archives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
