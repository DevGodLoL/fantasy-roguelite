import { db } from '../src/lib/prisma';
async function main() {
    const league = await db.league.findFirst();
    const week1 = await db.week.findFirst({
        where: { leagueId: league?.id, number: 1 },
        include: { matchups: { include: { homeTeam: true, awayTeam: true } } }
    });

    console.log(`--- WEEK 1 STATUS ---`);
    console.log(`League ID: ${league?.id}`);
    console.log(`Week ID: ${week1?.id}`);
    console.log(`Matchups Count: ${week1?.matchups.length}`);

    week1?.matchups.forEach(m => {
        console.log(`[${m.status}] ${m.homeTeam.name} vs ${m.awayTeam.name} (Score: ${m.homeScore}-${m.awayScore})`);
    });

    // Check one roster to be sure
    const userTeam = week1?.matchups[0].homeTeam.name === 'The DevGods' ? week1?.matchups[0].homeTeam : week1?.matchups[0].awayTeam; // approximation
    // actually just query
    if (userTeam) {
        const fullTeam = await db.team.findUnique({ where: { id: userTeam.id }, include: { rosterSlots: true } });
        console.log(`\nRoster Check (${fullTeam?.name}): ${fullTeam?.rosterSlots.filter(s => s.playerId).length} / 15 players.`);
    }
}
main();
