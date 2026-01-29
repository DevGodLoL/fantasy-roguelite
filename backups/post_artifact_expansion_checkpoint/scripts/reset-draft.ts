import { db } from '../src/lib/prisma';

async function main() {
    console.log('🔄 Resetting League to Pre-Draft State...');

    const league = await db.league.findFirst();
    if (!league) return;

    // 1. Clear Rosters
    await db.rosterSlot.updateMany({
        where: { team: { leagueId: league.id } },
        data: { playerId: null }
    });
    console.log('✅ Rosters Cleared');

    // 2. Clear Draft Picks
    await db.draftPick.deleteMany({
        where: { draft: { leagueId: league.id } }
    });
    console.log('✅ Draft History Wiped');

    // 3. Reset Draft Status
    await db.draft.update({
        where: { leagueId: league.id },
        data: {
            status: 'pre_draft', // Must be pre_draft to show 'Start' button
            currentPick: 1
        }
    });
    console.log('✅ Draft Reset to Round 1');

    // 4. (Optional) Reset Weeks/Matchups if needed? 
    // Usually fine to leave them, but let's reset matchup scores just in case
    await db.matchup.updateMany({
        where: { leagueId: league.id },
        data: { homeScore: 0, awayScore: 0, status: 'scheduled' }
    });
    // Reset Team Gold/Stats
    await db.team.updateMany({
        where: { leagueId: league.id },
        data: { gold: 100 }
    });

    console.log('🎉 League Reset Complete! You may now draft.');
}

main();
