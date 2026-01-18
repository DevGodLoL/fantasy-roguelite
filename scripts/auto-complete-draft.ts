import { db } from '../src/lib/prisma';
import { autoDraft, pickPlayer } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    if (!league) return console.log("No league found");

    const draft = await db.draft.findFirst({ where: { leagueId: league.id } });
    if (!draft) return console.log("No draft found");

    console.log('🔄 Resetting Draft...');
    await db.draft.update({
        where: { id: draft.id },
        data: { status: 'drafting', currentPick: 1 }
    });
    // Clear rosters
    await db.rosterSlot.updateMany({
        where: { team: { leagueId: league.id } },
        data: { playerId: null }
    });
    // Clear picks history
    await db.draftPick.deleteMany({ where: { draftId: draft.id } });

    console.log('⚡ Fast-Forwarding Draft (User + AI)...');

    let isComplete = false;
    let round = 1;

    while (!isComplete) {
        // Try to auto-draft for AI
        const res: any = await autoDraft(league.id, draft.id);

        if (res.draftComplete) {
            isComplete = true;
            console.log("✅ Draft Finished!");
            break;
        }

        if (res.isUserTurn) {
            // Simulate User Pick
            const userTeam = await db.team.findFirst({
                where: { name: 'The DevGods', leagueId: league.id }
            });

            // Find best available for User
            // Note: We'll just grab the best ADP available to simulate a "Good" user
            // We have to filter out taken players manually or rely on DB query
            const available = await db.player.findFirst({
                where: { rosterSlots: { none: { team: { leagueId: league.id } } } },
                orderBy: { adp: 'asc' }
            });

            if (userTeam && available) {
                console.log(`👤 User Turn (Pick ${round}): Auto-picking ${available.name} (${available.position})`);
                await pickPlayer(league.id, draft.id, userTeam.id, available.id);
                round++;
            } else {
                console.error("❌ Could not find user team or player");
                break;
            }
        }
    }

    console.log('🎉 Done! You can now visit the League Dashboard.');
}

main();
