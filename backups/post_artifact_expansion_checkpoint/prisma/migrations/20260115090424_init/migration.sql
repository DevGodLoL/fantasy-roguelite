/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `League` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[leagueId,name]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "League_name_key" ON "League"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_leagueId_name_key" ON "Team"("leagueId", "name");
