/*
  Warnings:

  - You are about to drop the column `endsAt` on the `Week` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Week` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[leagueId,ownerId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Week` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Team_leagueId_name_key";

-- CreateTable
CREATE TABLE "TeamWeekStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "passYds" INTEGER NOT NULL DEFAULT 0,
    "rushYds" INTEGER NOT NULL DEFAULT 0,
    "recYds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TeamWeekStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamWeekStats_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pre_draft',
    "currentPick" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT NOT NULL DEFAULT 'snake',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Draft_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "pickNumber" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    CONSTRAINT "DraftPick_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Week_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Week" ("id", "leagueId", "number") SELECT "id", "leagueId", "number" FROM "Week";
DROP TABLE "Week";
ALTER TABLE "new_Week" RENAME TO "Week";
CREATE UNIQUE INDEX "Week_leagueId_number_key" ON "Week"("leagueId", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TeamWeekStats_teamId_weekId_key" ON "TeamWeekStats"("teamId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_leagueId_key" ON "Draft"("leagueId");

-- CreateIndex
CREATE INDEX "DraftPick_teamId_idx" ON "DraftPick"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_draftId_pickNumber_key" ON "DraftPick"("draftId", "pickNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");
