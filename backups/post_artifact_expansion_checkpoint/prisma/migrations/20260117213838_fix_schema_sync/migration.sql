/*
  Warnings:

  - You are about to drop the column `bench` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `initialFaab` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `interceptionPoints` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `passingTdPoints` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `passingYardsPerPoint` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `receivingYardsPerPoint` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `rosterFLEX` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `rushingTdPoints` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `rushingYardsPerPoint` on the `LeagueSettings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TeamPowerupOffer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,weekId]` on the table `TeamPowerup` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `League` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DraftPick_teamId_idx";

-- DropIndex
DROP INDEX "TeamPowerup_teamId_isConsumed_idx";

-- CreateTable
CREATE TABLE "PlayerPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "points" REAL NOT NULL DEFAULT 0,
    "passYds" INTEGER NOT NULL DEFAULT 0,
    "rushYds" INTEGER NOT NULL DEFAULT 0,
    "recYds" INTEGER NOT NULL DEFAULT 0,
    "tds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerPerformance_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "format" TEXT NOT NULL DEFAULT 'snake',
    "currentPick" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Draft" ("createdAt", "currentPick", "format", "id", "leagueId", "status", "updatedAt") SELECT "createdAt", "currentPick", "format", "id", "leagueId", "status", "updatedAt" FROM "Draft";
DROP TABLE "Draft";
ALTER TABLE "new_Draft" RENAME TO "Draft";
CREATE UNIQUE INDEX "Draft_leagueId_key" ON "Draft"("leagueId");
CREATE TABLE "new_League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "League_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_League" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "League";
DROP TABLE "League";
ALTER TABLE "new_League" RENAME TO "League";
CREATE TABLE "new_LeagueMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LeagueMember" ("id", "leagueId", "role", "userId") SELECT "id", "leagueId", "role", "userId" FROM "LeagueMember";
DROP TABLE "LeagueMember";
ALTER TABLE "new_LeagueMember" RENAME TO "LeagueMember";
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");
CREATE TABLE "new_LeagueSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "rosterQB" INTEGER NOT NULL DEFAULT 1,
    "rosterRB" INTEGER NOT NULL DEFAULT 2,
    "rosterWR" INTEGER NOT NULL DEFAULT 2,
    "rosterTE" INTEGER NOT NULL DEFAULT 1,
    "rosterFlex" INTEGER NOT NULL DEFAULT 1,
    "rosterK" INTEGER NOT NULL DEFAULT 1,
    "rosterDST" INTEGER NOT NULL DEFAULT 1,
    "rosterBench" INTEGER NOT NULL DEFAULT 5,
    "passTdPoints" INTEGER NOT NULL DEFAULT 4,
    "passYardPoints" REAL NOT NULL DEFAULT 0.04,
    "rushTdPoints" INTEGER NOT NULL DEFAULT 6,
    "rushYardPoints" REAL NOT NULL DEFAULT 0.1,
    "receivingTdPoints" INTEGER NOT NULL DEFAULT 6,
    "receptionPoints" REAL NOT NULL DEFAULT 1,
    "fumbleLostPoints" INTEGER NOT NULL DEFAULT -2,
    CONSTRAINT "LeagueSettings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LeagueSettings" ("fumbleLostPoints", "id", "leagueId", "receivingTdPoints", "receptionPoints", "rosterDST", "rosterK", "rosterQB", "rosterRB", "rosterTE", "rosterWR") SELECT "fumbleLostPoints", "id", "leagueId", "receivingTdPoints", "receptionPoints", "rosterDST", "rosterK", "rosterQB", "rosterRB", "rosterTE", "rosterWR" FROM "LeagueSettings";
DROP TABLE "LeagueSettings";
ALTER TABLE "new_LeagueSettings" RENAME TO "LeagueSettings";
CREATE UNIQUE INDEX "LeagueSettings_leagueId_key" ON "LeagueSettings"("leagueId");
CREATE TABLE "new_TeamPowerupOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "powerupId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "isChosen" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TeamPowerupOffer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerupOffer_powerupId_fkey" FOREIGN KEY ("powerupId") REFERENCES "Powerup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerupOffer_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TeamPowerupOffer" ("id", "isChosen", "powerupId", "teamId", "weekId") SELECT "id", "isChosen", "powerupId", "teamId", "weekId" FROM "TeamPowerupOffer";
DROP TABLE "TeamPowerupOffer";
ALTER TABLE "new_TeamPowerupOffer" RENAME TO "TeamPowerupOffer";
CREATE UNIQUE INDEX "TeamPowerupOffer_teamId_weekId_powerupId_key" ON "TeamPowerupOffer"("teamId", "weekId", "powerupId");
CREATE TABLE "new_WaiverClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dropPlayerId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "bidAmount" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "WaiverClaim_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_dropPlayerId_fkey" FOREIGN KEY ("dropPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WaiverClaim" ("bidAmount", "createdAt", "dropPlayerId", "id", "playerId", "processedAt", "reason", "status", "teamId") SELECT "bidAmount", "createdAt", "dropPlayerId", "id", "playerId", "processedAt", "reason", "status", "teamId" FROM "WaiverClaim";
DROP TABLE "WaiverClaim";
ALTER TABLE "new_WaiverClaim" RENAME TO "WaiverClaim";
CREATE INDEX "WaiverClaim_teamId_status_idx" ON "WaiverClaim"("teamId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPerformance_playerId_weekId_key" ON "PlayerPerformance"("playerId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPowerup_teamId_weekId_key" ON "TeamPowerup"("teamId", "weekId");
