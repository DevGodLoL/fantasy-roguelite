-- AlterTable
ALTER TABLE "Matchup" ADD COLUMN "bracket" TEXT;
ALTER TABLE "Matchup" ADD COLUMN "round" TEXT;

-- CreateTable
CREATE TABLE "TeamTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    CONSTRAINT "TeamTitle_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "playoffTeams" INTEGER NOT NULL DEFAULT 6,
    "regularSeasonWeeks" INTEGER NOT NULL DEFAULT 14,
    "seasonStatus" TEXT NOT NULL DEFAULT 'regular',
    "championTeamId" TEXT,
    "consolationWinnerId" TEXT,
    CONSTRAINT "League_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_League" ("createdAt", "id", "name", "ownerId", "updatedAt") SELECT "createdAt", "id", "name", "ownerId", "updatedAt" FROM "League";
DROP TABLE "League";
ALTER TABLE "new_League" RENAME TO "League";
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "playoffSeed" INTEGER,
    "nextSeasonBonusGold" INTEGER NOT NULL DEFAULT 0,
    "nextSeasonBonusRerolls" INTEGER NOT NULL DEFAULT 0,
    "waiverPriority" INTEGER NOT NULL DEFAULT 1,
    "faabBalance" INTEGER NOT NULL DEFAULT 100,
    "gold" INTEGER NOT NULL DEFAULT 100,
    "rerolls" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("createdAt", "faabBalance", "gold", "id", "leagueId", "name", "ownerId", "rerolls", "updatedAt", "waiverPriority") SELECT "createdAt", "faabBalance", "gold", "id", "leagueId", "name", "ownerId", "rerolls", "updatedAt", "waiverPriority" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");
CREATE TABLE "new_Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regular',
    CONSTRAINT "Week_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Week" ("createdAt", "id", "leagueId", "number", "updatedAt") SELECT "createdAt", "id", "leagueId", "number", "updatedAt" FROM "Week";
DROP TABLE "Week";
ALTER TABLE "new_Week" RENAME TO "Week";
CREATE UNIQUE INDEX "Week_leagueId_number_key" ON "Week"("leagueId", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
