import { db } from '../src/lib/prisma';

async function main() {
    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id }, include: { picks: true } });
    const userTeam = await db.team.findFirst({ where: { name: 'The DevGods', leagueId: league?.id }, include: { rosterSlots: { include: { player: true } } } });

    console.log('--- TRIAGE REPORT ---');
    console.log('Draft Status:', draft?.status);
    console.log('Current Pick Pointer:', draft?.currentPick);
    console.log('Total Picks Made:', draft?.picks.length);

    if (draft?.picks.length > 0) {
        const lastPick = draft.picks[draft.picks.length - 1];
        console.log(`Last Pick Record: #${lastPick.pickNumber} (Round ${lastPick.round}) by Team ${lastPick.teamId}`);
    } else {
        console.log("No picks made yet.");
    }

    // Check whose turn it is
    const teams = await db.team.findMany({ where: { leagueId: league?.id }, orderBy: { createdAt: 'asc' } });
    const numTeams = teams.length;
    const currentPickIndex = (draft?.currentPick || 1) - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;
    let activeTeamIndex = (round % 2 === 0) ? (numTeams - pickInRound) : (pickInRound - 1); // Snake

    const activeTeam = teams[activeTeamIndex];

    console.log(`\n--- TURN INFO ---`);
    console.log(`Round ${round}, Pick ${pickInRound} in round. (Overall ${draft?.currentPick})`);
    console.log('Calculated Active Team:', activeTeam.name);
    console.log('User Team:', userTeam?.name);

    console.log('\n--- ROSTER STATE ---');
    userTeam?.rosterSlots.forEach(s => {
        console.log(`[${s.slotType}] ${s.player ? s.player.name + ' (' + s.player.position + ')' : 'EMPTY'}`);
    });
}

main();
