-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeagueSettings" (
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

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    CONSTRAINT "Week_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Matchup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" REAL NOT NULL DEFAULT 0,
    "awayScore" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "Matchup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nflPlayerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "teamAbbr" TEXT
);

-- CreateTable
CREATE TABLE "RosterSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "slotType" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RosterSlot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RosterSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Powerup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "scope" TEXT NOT NULL DEFAULT 'self',
    "duration" TEXT NOT NULL DEFAULT 'week'
);

-- CreateTable
CREATE TABLE "TeamPowerup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "powerupId" TEXT NOT NULL,
    "weekId" TEXT,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TeamPowerup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerup_powerupId_fkey" FOREIGN KEY ("powerupId") REFERENCES "Powerup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamPowerup_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueSettings_leagueId_key" ON "LeagueSettings"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "Week_leagueId_number_key" ON "Week"("leagueId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Matchup_weekId_homeTeamId_key" ON "Matchup"("weekId", "homeTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Matchup_weekId_awayTeamId_key" ON "Matchup"("weekId", "awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_nflPlayerId_key" ON "Player"("nflPlayerId");

-- CreateIndex
CREATE INDEX "RosterSlot_teamId_slotType_idx" ON "RosterSlot"("teamId", "slotType");

-- CreateIndex
CREATE UNIQUE INDEX "Powerup_code_key" ON "Powerup"("code");

-- CreateIndex
CREATE INDEX "TeamPowerup_teamId_isConsumed_idx" ON "TeamPowerup"("teamId", "isConsumed");
