-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "rewardsClaimed" BOOLEAN NOT NULL DEFAULT false,
    "waiverPriority" INTEGER NOT NULL DEFAULT 1,
    "faabBalance" INTEGER NOT NULL DEFAULT 100,
    "gold" INTEGER NOT NULL DEFAULT 100,
    "rerolls" INTEGER NOT NULL DEFAULT 1,
    "archetype" TEXT NOT NULL DEFAULT 'BALANCED',
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("createdAt", "faabBalance", "gold", "id", "leagueId", "name", "nextSeasonBonusGold", "nextSeasonBonusRerolls", "ownerId", "playoffSeed", "rerolls", "rewardsClaimed", "updatedAt", "waiverPriority") SELECT "createdAt", "faabBalance", "gold", "id", "leagueId", "name", "nextSeasonBonusGold", "nextSeasonBonusRerolls", "ownerId", "playoffSeed", "rerolls", "rewardsClaimed", "updatedAt", "waiverPriority" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_leagueId_ownerId_key" ON "Team"("leagueId", "ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
