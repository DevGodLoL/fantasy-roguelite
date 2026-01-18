import { db } from '../src/lib/prisma';
import { pickPlayer } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: "The DevGods", leagueId: league?.id } });
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });

    // Find a DST
    const dst = await db.player.findFirst({ where: { position: 'DST', rosterSlots: { none: {} } } });
    console.log(`Trying to pick DST: ${dst?.name}`);

    try {
        // Force Pick 140 (User's other slot in strict sequence)
        await db.draft.update({
            where: { id: draft!.id },
            data: { currentPick: 140, status: 'drafting' }
        });
        console.log("Forced Draft to Pick 140 (User Turn).");

        await pickPlayer(league!.id, draft!.id, userTeam!.id, dst!.id);
        console.log("Success picking DST.");
    } catch (e) {
        console.log("Pick Action threw error:", e);
    }
}

main();
