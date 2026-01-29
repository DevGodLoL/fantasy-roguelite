-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "price" INTEGER NOT NULL DEFAULT 0,
    "isPlayoffOnly" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Powerup" ("code", "description", "duration", "id", "kind", "name", "price", "rarity", "scope", "type", "value") SELECT "code", "description", "duration", "id", "kind", "name", "price", "rarity", "scope", "type", "value" FROM "Powerup";
DROP TABLE "Powerup";
ALTER TABLE "new_Powerup" RENAME TO "Powerup";
CREATE UNIQUE INDEX "Powerup_code_key" ON "Powerup"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
