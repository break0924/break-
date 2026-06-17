-- Prediction V2 odds snapshot.
-- Odds are stored only as model calibration features and audit snapshots.

CREATE TABLE "match_odds_snapshots" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'MANUAL',
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openingHomeOdds" DECIMAL(8,3),
  "openingDrawOdds" DECIMAL(8,3),
  "openingAwayOdds" DECIMAL(8,3),
  "currentHomeOdds" DECIMAL(8,3) NOT NULL,
  "currentDrawOdds" DECIMAL(8,3) NOT NULL,
  "currentAwayOdds" DECIMAL(8,3) NOT NULL,
  "impliedHomeProbability" DECIMAL(5,2) NOT NULL,
  "impliedDrawProbability" DECIMAL(5,2) NOT NULL,
  "impliedAwayProbability" DECIMAL(5,2) NOT NULL,
  "normalizedHomeProbability" DECIMAL(5,2) NOT NULL,
  "normalizedDrawProbability" DECIMAL(5,2) NOT NULL,
  "normalizedAwayProbability" DECIMAL(5,2) NOT NULL,
  "homeOddsMovement" DECIMAL(8,3),
  "drawOddsMovement" DECIMAL(8,3),
  "awayOddsMovement" DECIMAL(8,3),
  "asianHandicapLine" TEXT,
  "asianHandicapHomeOdds" DECIMAL(8,3),
  "asianHandicapAwayOdds" DECIMAL(8,3),
  "overUnderLine" DECIMAL(5,2),
  "overOdds" DECIMAL(8,3),
  "underOdds" DECIMAL(8,3),
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "match_odds_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "match_odds_snapshots_matchId_capturedAt_idx"
  ON "match_odds_snapshots"("matchId", "capturedAt");

CREATE INDEX "match_odds_snapshots_provider_capturedAt_idx"
  ON "match_odds_snapshots"("provider", "capturedAt");

ALTER TABLE "match_odds_snapshots"
  ADD CONSTRAINT "match_odds_snapshots_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
