-- CreateTable
CREATE TABLE "WaiverClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dropPlayerId" TEXT,
    "bidAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    CONSTRAINT "WaiverClaim_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WaiverClaim_dropPlayerId_fkey" FOREIGN KEY ("dropPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeagueSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "rosterQB" INTEGER NOT NULL DEFAULT 1,
    "rosterRB" INTEGER NOT NULL DEFAULT 2,
    "rosterWR" INTEGER NOT NULL DEFAULT 2,
    "rosterTE" INTEGER NOT NULL DEFAULT 1,
    "rosterFLEX" INTEGER NOT NULL DEFAULT 1,
    "rosterDST" INTEGER NOT NULL DEFAULT 1,
    "rosterK" INTEGER NOT NULL DEFAULT 1,
    "bench" INTEGER NOT NULL DEFAULT 6,
    "initialFaab" INTEGER NOT NULL DEFAULT 100,
    "passingYardsPerPoint" REAL NOT NULL DEFAULT 25,
    "passingTdPoints" INTEGER NOT NULL DEFAULT 4,
    "interceptionPoints" INTEGER NOT NULL DEFAULT -2,
    "rushingYardsPerPoint" REAL NOT NULL DEFAULT 10,
    "rushingTdPoints" INTEGER NOT NULL DEFAULT 6,
    "receivingYardsPerPoint" REAL NOT NULL DEFAULT 10,
    "receivingTdPoints" INTEGER NOT NULL DEFAULT 6,
    "receptionPoints" REAL NOT NULL DEFAULT 1,
    "fumbleLostPoints" INTEGER NOT NULL DEFAULT -2,
    CONSTRAINT "LeagueSettings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LeagueSettings" ("bench", "fumbleLostPoints", "id", "interceptionPoints", "leagueId", "passingTdPoints", "passingYardsPerPoint", "receivingTdPoints", "receivingYardsPerPoint", "receptionPoints", "rosterDST", "rosterFLEX", "rosterK", "rosterQB", "rosterRB", "rosterTE", "rosterWR", "rushingTdPoints", "rushingYardsPerPoint") SELECT "bench", "fumbleLostPoints", "id", "interceptionPoints", "leagueId", "passingTdPoints", "passingYardsPerPoint", "receivingTdPoints", "receivingYardsPerPoint", "receptionPoints", "rosterDST", "rosterFLEX", "rosterK", "rosterQB", "rosterRB", "rosterTE", "rosterWR", "rushingTdPoints", "rushingYardsPerPoint" FROM "LeagueSettings";
DROP TABLE "LeagueSettings";
ALTER TABLE "new_LeagueSettings" RENAME TO "LeagueSettings";
CREATE UNIQUE INDEX "LeagueSettings_leagueId_key" ON "LeagueSettings"("leagueId");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "waiverPriority" INTEGER NOT NULL DEFAULT 1,
    "faabBalance" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("createdAt", "id", "leagueId", "name", "ownerId", "updatedAt", "waiverPriority") SELECT "createdAt", "id", "leagueId", "name", "ownerId", "updatedAt", "waiverPriority" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WaiverClaim_teamId_status_idx" ON "WaiverClaim"("teamId", "status");
