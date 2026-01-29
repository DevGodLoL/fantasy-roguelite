-- CreateTable
CREATE TABLE "PlayerTrait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "kind" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "expiresAtWeek" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerTrait_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerTrait_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeagueTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT,
    "amount" INTEGER,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueTransaction_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeagueTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeagueTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayerPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "points" REAL NOT NULL DEFAULT 0,
    "passYds" INTEGER NOT NULL DEFAULT 0,
    "rushYds" INTEGER NOT NULL DEFAULT 0,
    "recYds" INTEGER NOT NULL DEFAULT 0,
    "tds" INTEGER NOT NULL DEFAULT 0,
    "fumbles" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerPerformance_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PlayerPerformance" ("id", "passYds", "playerId", "points", "recYds", "rushYds", "tds", "weekId") SELECT "id", "passYds", "playerId", "points", "recYds", "rushYds", "tds", "weekId" FROM "PlayerPerformance";
DROP TABLE "PlayerPerformance";
ALTER TABLE "new_PlayerPerformance" RENAME TO "PlayerPerformance";
CREATE UNIQUE INDEX "PlayerPerformance_playerId_weekId_key" ON "PlayerPerformance"("playerId", "weekId");
CREATE TABLE "new_Powerup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "scope" TEXT NOT NULL DEFAULT 'self',
    "duration" TEXT NOT NULL DEFAULT 'week',
    "kind" TEXT,
    "value" REAL,
    "type" TEXT NOT NULL DEFAULT 'card',
    "price" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Powerup" ("code", "description", "duration", "id", "kind", "name", "rarity", "scope", "value") SELECT "code", "description", "duration", "id", "kind", "name", "rarity", "scope", "value" FROM "Powerup";
DROP TABLE "Powerup";
ALTER TABLE "new_Powerup" RENAME TO "Powerup";
CREATE UNIQUE INDEX "Powerup_code_key" ON "Powerup"("code");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "waiverPriority" INTEGER NOT NULL DEFAULT 1,
    "faabBalance" INTEGER NOT NULL DEFAULT 100,
    "gold" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("createdAt", "faabBalance", "id", "leagueId", "name", "ownerId", "updatedAt", "waiverPriority") SELECT "createdAt", "faabBalance", "id", "leagueId", "name", "ownerId", "updatedAt", "waiverPriority" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PlayerTrait_leagueId_playerId_idx" ON "PlayerTrait"("leagueId", "playerId");
