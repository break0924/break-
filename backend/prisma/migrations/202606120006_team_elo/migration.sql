ALTER TABLE "Team" ADD COLUMN "eloRating" INTEGER NOT NULL DEFAULT 1500;

CREATE TABLE "team_elo_history" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "opponentTeamId" TEXT NOT NULL,
  "isHome" BOOLEAN NOT NULL,
  "scoreFor" INTEGER NOT NULL,
  "scoreAgainst" INTEGER NOT NULL,
  "result" DOUBLE PRECISION NOT NULL,
  "oldRating" INTEGER NOT NULL,
  "newRating" INTEGER NOT NULL,
  "ratingDelta" INTEGER NOT NULL,
  "kFactor" INTEGER NOT NULL,
  "expectedScore" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "team_elo_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_elo_history_teamId_matchId_key" ON "team_elo_history"("teamId", "matchId");

CREATE INDEX "team_elo_history_matchId_idx" ON "team_elo_history"("matchId");

CREATE INDEX "team_elo_history_teamId_createdAt_idx" ON "team_elo_history"("teamId", "createdAt");

CREATE INDEX "Team_eloRating_idx" ON "Team"("eloRating");

ALTER TABLE "team_elo_history"
  ADD CONSTRAINT "team_elo_history_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "team_elo_history"
  ADD CONSTRAINT "team_elo_history_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
