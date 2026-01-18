import { db } from '../src/lib/prisma';

async function main() {
    console.log('🔄 FULL RESET: Returning to Pre-Draft State...\n');

    const league = await db.league.findFirst();
    if (!league) {
        console.log('❌ No league found!');
        return;
    }

    console.log(`📍 League: ${league.name}`);
    console.log('━'.repeat(50));

    // 1. Clear all waiver claims
    const waiverClaims = await db.waiverClaim.deleteMany({
        where: { team: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${waiverClaims.count} waiver claims`);

    // 2. Clear all transactions
    const transactions = await db.leagueTransaction.deleteMany({
        where: { leagueId: league.id }
    });
    console.log(`✅ Cleared ${transactions.count} transactions`);

    // 3. Clear player traits
    const traits = await db.playerTrait.deleteMany({
        where: { leagueId: league.id }
    });
    console.log(`✅ Cleared ${traits.count} player traits`);

    // 4. Clear player performances
    const performances = await db.playerPerformance.deleteMany({
        where: { week: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${performances.count} player performances`);

    // 5. Clear team week stats
    const weekStats = await db.teamWeekStats.deleteMany({
        where: { team: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${weekStats.count} team week stats`);

    // 6. Clear team powerup offers
    const offers = await db.teamPowerupOffer.deleteMany({
        where: { team: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${offers.count} powerup offers`);

    // 7. Clear team powerups
    const powerups = await db.teamPowerup.deleteMany({
        where: { team: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${powerups.count} team powerups`);

    // 8. Clear draft picks
    const picks = await db.draftPick.deleteMany({
        where: { draft: { leagueId: league.id } }
    });
    console.log(`✅ Cleared ${picks.count} draft picks`);

    // 9. Clear rosters (set playerId to null)
    const rosters = await db.rosterSlot.updateMany({
        where: { team: { leagueId: league.id } },
        data: { playerId: null }
    });
    console.log(`✅ Cleared ${rosters.count} roster slots`);

    // 10. Reset matchups to scheduled with 0 scores
    const matchups = await db.matchup.updateMany({
        where: { leagueId: league.id },
        data: { homeScore: 0, awayScore: 0, status: 'scheduled' }
    });
    console.log(`✅ Reset ${matchups.count} matchups`);

    // 11. Reset draft to pre_draft status
    await db.draft.update({
        where: { leagueId: league.id },
        data: {
            status: 'pre_draft',
            currentPick: 1
        }
    });
    console.log(`✅ Reset draft to pre_draft`);

    // 12. Reset team gold and waiver priority
    const teams = await db.team.updateMany({
        where: { leagueId: league.id },
        data: {
            gold: 100,
            faabBalance: 100,
            waiverPriority: 1
        }
    });
    console.log(`✅ Reset ${teams.count} teams (gold: 100, FAAB: 100)`);

    console.log('\n━'.repeat(50));
    console.log('🎉 FULL RESET COMPLETE!');
    console.log('📋 The league is now in pre-draft state.');
    console.log('👉 Navigate to /league/[id]/draft to start the draft!');
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
