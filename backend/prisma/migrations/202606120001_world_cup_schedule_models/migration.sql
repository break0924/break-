CREATE TYPE "TournamentStage" AS ENUM (
  'GROUP',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_PLACE',
  'FINAL'
);

CREATE TABLE "world_cup_groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "world_cup_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "world_cup_groups_code_check" CHECK ("code" IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  CONSTRAINT "world_cup_groups_sort_order_check" CHECK ("sortOrder" >= 1 AND "sortOrder" <= 12)
);

ALTER TABLE "Team" ADD COLUMN "groupId" TEXT;

ALTER TABLE "Match" ADD COLUMN "groupId" TEXT;
ALTER TABLE "Match" ADD COLUMN "matchDate" DATE;
ALTER TABLE "Match" ADD COLUMN "kickoffTime" TEXT;
ALTER TABLE "Match" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
ALTER TABLE "Match" ADD COLUMN "city" TEXT;
ALTER TABLE "Match" ADD COLUMN "roundName" TEXT;
ALTER TABLE "Match" ADD COLUMN "winnerTeamId" TEXT;

UPDATE "Match"
SET
  "matchDate" = "kickoffAt"::date,
  "kickoffTime" = to_char("kickoffAt", 'HH24:MI')
WHERE "kickoffAt" IS NOT NULL;

ALTER TABLE "Match"
  ALTER COLUMN "stage" TYPE "TournamentStage"
  USING "stage"::text::"TournamentStage";

DROP TYPE "MatchStage";

CREATE UNIQUE INDEX "world_cup_groups_name_key" ON "world_cup_groups"("name");
CREATE UNIQUE INDEX "world_cup_groups_code_key" ON "world_cup_groups"("code");
CREATE INDEX "world_cup_groups_sortOrder_idx" ON "world_cup_groups"("sortOrder");

CREATE INDEX "Team_groupId_idx" ON "Team"("groupId");
CREATE INDEX "Team_groupName_idx" ON "Team"("groupName");

CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");
CREATE INDEX "Match_stage_matchDate_idx" ON "Match"("stage", "matchDate");
CREATE INDEX "Match_groupId_idx" ON "Match"("groupId");
CREATE INDEX "Match_winnerTeamId_idx" ON "Match"("winnerTeamId");

ALTER TABLE "Team" ADD CONSTRAINT "Team_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "world_cup_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "world_cup_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match" ADD CONSTRAINT "Match_kickoffTime_check" CHECK (
  "kickoffTime" IS NULL OR "kickoffTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
);

ALTER TABLE "Match" ADD CONSTRAINT "Match_timezone_check" CHECK (length("timezone") > 0);
