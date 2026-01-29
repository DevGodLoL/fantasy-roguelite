-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamPowerup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "powerupId" TEXT NOT NULL,
    "weekId" TEXT,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'pack_opening',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamPowerup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerup_powerupId_fkey" FOREIGN KEY ("powerupId") REFERENCES "Powerup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerup_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamPowerup" ("id", "isConsumed", "powerupId", "teamId", "weekId") SELECT "id", "isConsumed", "powerupId", "teamId", "weekId" FROM "TeamPowerup";
DROP TABLE "TeamPowerup";
ALTER TABLE "new_TeamPowerup" RENAME TO "TeamPowerup";
CREATE INDEX "TeamPowerup_teamId_weekId_idx" ON "TeamPowerup"("teamId", "weekId");
CREATE INDEX "TeamPowerup_teamId_isConsumed_idx" ON "TeamPowerup"("teamId", "isConsumed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
