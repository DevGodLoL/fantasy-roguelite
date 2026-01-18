-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nflPlayerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "teamAbbr" TEXT,
    "adp" REAL NOT NULL DEFAULT 999
);
INSERT INTO "new_Player" ("id", "name", "nflPlayerId", "position", "teamAbbr") SELECT "id", "name", "nflPlayerId", "position", "teamAbbr" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_nflPlayerId_key" ON "Player"("nflPlayerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
