-- Prediction V2 pre-match context fields.
-- These fields keep structured inputs for injury, lineup, motivation,
-- weather, and travel factors so published predictions remain auditable.

ALTER TABLE "Match"
  ADD COLUMN "homeInjuryImpact" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "awayInjuryImpact" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "homeInjuryNotes" JSONB,
  ADD COLUMN "awayInjuryNotes" JSONB,
  ADD COLUMN "homeLineupStatus" JSONB,
  ADD COLUMN "awayLineupStatus" JSONB,
  ADD COLUMN "homeLineupStability" INTEGER,
  ADD COLUMN "awayLineupStability" INTEGER,
  ADD COLUMN "homeMotivationScore" INTEGER,
  ADD COLUMN "awayMotivationScore" INTEGER,
  ADD COLUMN "weatherImpact" INTEGER,
  ADD COLUMN "weatherSnapshot" JSONB,
  ADD COLUMN "homeTravelFatigue" INTEGER,
  ADD COLUMN "awayTravelFatigue" INTEGER,
  ADD COLUMN "travelSnapshot" JSONB,
  ADD COLUMN "preMatchDataUpdatedAt" TIMESTAMP(3);

CREATE INDEX "Match_preMatchDataUpdatedAt_idx" ON "Match"("preMatchDataUpdatedAt");
