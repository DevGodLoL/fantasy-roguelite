import { db } from '../src/lib/prisma';
async function main() {
    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: 'The DevGods', leagueId: league?.id }, include: { homeMatchups: { where: { week: { number: 1 } } }, awayMatchups: { where: { week: { number: 1 } } } } });

    const matchup = userTeam?.homeMatchups[0] || userTeam?.awayMatchups[0];

    if (matchup) {
        console.log(`\n--- WEEK 1 RESULT ---`);
        console.log(`Matchup ID: ${matchup.id}`);
        console.log(`Status: ${matchup.status}`);
        console.log(`Home Score: ${matchup.homeScore}`);
        console.log(`Away Score: ${matchup.awayScore}`);

        const result = matchup.homeTeamId === userTeam?.id
            ? (matchup.homeScore > matchup.awayScore ? 'VICTORY' : 'DEFEAT')
            : (matchup.awayScore > matchup.homeScore ? 'VICTORY' : 'DEFEAT');

        console.log(`Outcome: ${result}`);

        // Show Gold
        const updatedTeam = await db.team.findUnique({ where: { id: userTeam?.id } });
        console.log(`Gold Balance: ${updatedTeam?.gold} G`);
    } else {
        console.log("No matchup found.");
    }
}
main();
