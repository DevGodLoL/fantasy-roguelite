import { db } from './src/lib/prisma';
async function main() {
    const league = await db.league.findFirst();
    console.log('LEAGUE_ID:', league?.id);
    const teams = await db.team.findMany({ where: { leagueId: league?.id || '' } });
    console.log('TEAMS_COUNT:', teams.length);
}
main();
