CREATE TABLE "prediction_model_calibrations" (
  "id" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
  "sampleSize" INTEGER NOT NULL DEFAULT 0,
  "brierScore" DOUBLE PRECISION,
  "resultHitRate" DOUBLE PRECISION,
  "scoreCandidateHitRate" DOUBLE PRECISION,
  "totalGoalsRangeHitRate" DOUBLE PRECISION,
  "oddsAgreementHitRate" DOUBLE PRECISION,
  "modelAgreementHitRate" DOUBLE PRECISION,
  "parameters" JSONB NOT NULL,
  "trainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "prediction_model_calibrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_model_calibrations_modelVersion_scope_key"
  ON "prediction_model_calibrations"("modelVersion", "scope");

CREATE INDEX "prediction_model_calibrations_trainedAt_idx"
  ON "prediction_model_calibrations"("trainedAt");
