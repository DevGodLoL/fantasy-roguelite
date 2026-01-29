import { db } from '../src/lib/prisma';
import { pickPlayer } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: "The DevGods", leagueId: league?.id } });
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id }, include: { picks: true } });

    // Find next pick number
    const nextPickNum = draft!.currentPick;
    console.log(`Current Draft Pick: ${nextPickNum}`);

    // Check whose turn it is
    // Snake draft math...
    // 10 teams.
    const numTeams = 10;
    const round = Math.ceil(nextPickNum / numTeams);
    const pickInRound = (nextPickNum - 1) % numTeams; // 0-9

    // Snake: Even rounds invert
    const isEven = round % 2 === 0;

    // Assume User is Index 0 (Created first).
    // Round 1: Pick 0.
    // Round 2: Pick 9.
    // Round 14 (Even): Pick 9 (Last index).
    // Round 15 (Odd): Pick 0.

    // Let's just force the NEXT user pick regardless of "Turn".
    // I will call `executePickInternal` directly logic? No, `pickPlayer`.
    // But `pickPlayer` checks turn.

    // Hack: I'll update the draft currentPick to match the user's slot.
    // User is "The DevGods".
    // Find User Index.
    const teams = await db.team.findMany({ where: { leagueId: league?.id }, orderBy: { createdAt: 'asc' } });
    const userIndex = teams.findIndex(t => t.id === userTeam?.id); // Should be 0.
    console.log(`User Team Index: ${userIndex}`);

    // Calculate next time user picks.
    // If we are at pick 130...
    // Round 14 start = 131. (Index 130).
    // Round 14 is Even. User is at 10 - 1 - 0 = 9. (Last).
    // So pick 140 (Index 139).

    // If currentPick is 131. User picks at 140.
    // I will force currentPick = 140.

    // Wait, let's just find the Kicker and try to pick.
    const kicker = await db.player.findFirst({ where: { position: 'K', rosterSlots: { none: {} } } });

    console.log(`Trying to pick Kicker: ${kicker?.name}`);

    try {
        // Mock the "Turn check" by explicitly setting the draft state to allow this team to pick?
        // Or essentially, I want to verify if the SLOT logic is valid.
        // `executePickInternal` checks `activeTeam.id !== teamId`.

        // I will temporarily update `draft.currentPick` to a value that makes it the user's turn.
        // If User is Index 0...
        // Pick 1 is User. Pick 20 is User. Pick 21 is User. Pick 40 is User.
        // Pick = (Round-1)*10 + 1 (Odd rounds)
        // Pick = (Round-1)*10 + 10 (Even rounds)

        // Let's set it to valid next turn.
        // E.g. Pick 141 (Round 15, Pick 1). User is first.

        await db.draft.update({
            where: { id: draft!.id },
            data: { currentPick: 141, status: 'drafting' }
        });
        console.log("Forced Draft to Pick 141 (User Turn).");

        const res = await pickPlayer(league!.id, draft!.id, userTeam!.id, kicker!.id);
        console.log("Success?", res); // undefined since it returns void or throws?
    } catch (e) {
        console.log("Pick Action threw error:", e);
    }
}

main();
