import { db } from '../src/lib/prisma';
import { autoDraft } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });

    console.log(`Starting Fast Forward from Pick ${draft?.currentPick}...`);

    let isUserTurn = false;
    let safety = 0;

    while (!isUserTurn && safety < 50) {
        // Run AI Draft logic interactively
        const result: any = await autoDraft(league!.id, draft!.id);

        if (result.isUserTurn) {
            console.log("🛑 Reached User Turn!");
            isUserTurn = true;
            break;
        }

        if (result.draftComplete) {
            console.log("✅ Draft Completed!");
            break;
        }

        // If we in script mode, autoDraft returns void or result?
        // My actions.ts returns { success, isUserTurn, draftComplete }

        // Check DB for current pick progress just in case
        const d = await db.draft.findFirst({ where: { id: draft?.id } });
        console.log(`  -> Advanced to Pick ${d?.currentPick}`);

        safety++;
    }
}

main();
