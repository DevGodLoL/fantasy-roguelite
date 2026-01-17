-- CreateTable
CREATE TABLE "TeamPowerupOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "powerupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isChosen" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TeamPowerupOffer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerupOffer_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerupOffer_powerupId_fkey" FOREIGN KEY ("powerupId") REFERENCES "Powerup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TeamPowerupOffer_teamId_weekId_idx" ON "TeamPowerupOffer"("teamId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPowerupOffer_teamId_weekId_powerupId_key" ON "TeamPowerupOffer"("teamId", "weekId", "powerupId");
