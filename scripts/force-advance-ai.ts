import { db } from '../src/lib/prisma';
import { autoDraft } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });

    console.log(`Current Pick: ${draft?.currentPick}`);

    try {
        console.log("Attempting to run one AI pick...");
        // autoDraft runs up to 20.
        // We catch errors.
        const res = await autoDraft(league!.id, draft!.id);
        console.log("Result:", res);
    } catch (e) {
        console.error("AI Draft CRASHED:", e);
    }
}

main();
