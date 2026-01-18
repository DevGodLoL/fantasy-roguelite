import { db } from '../src/lib/prisma';
import { pickPlayer } from '../src/app/league/[id]/draft/actions';

async function main() {
    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: "The DevGods", leagueId: league?.id } });
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });

    // Force turn to user
    await db.draft.update({
        where: { id: draft?.id },
        data: { currentPick: 1, status: 'drafting' } // Assuming user is pick 1 for this test
    });
    // But pick 1 might be random.
    // Let's just update the draft to make it user's turn
    // Find when User picks next?
    // Actually, executePickInternal checks if it's the user's turn. 
    // I will BYPASS check in the action? No, I want to test the action.

    // Update draft to ensure user is active.
    // User team id: userTeam.id.
    // Draft format: snake.
    // If user is index 0 (created first?), check team index.
    const teams = await db.team.findMany({ where: { leagueId: league?.id }, orderBy: { createdAt: 'asc' } });
    const userIndex = teams.findIndex(t => t.id === userTeam?.id);

    // Set current Pick to userIndex + 1
    console.log(`User is at index ${userIndex}. Setting draft pick to ${userIndex + 1}...`);
    await db.draft.update({ where: { id: draft?.id }, data: { currentPick: userIndex + 1, status: 'drafting' } });

    // Find a Kicker
    const kicker = await db.player.findFirst({ where: { position: 'K', rosterSlots: { none: {} } } });
    if (!kicker) return console.log("No Kicker found");

    console.log(`Trying to pick Kicker: ${kicker.name}`);
    try {
        await pickPlayer(league!.id, draft!.id, userTeam!.id, kicker.id);
        console.log("Pick executed via Action wrapper.");
    } catch (e) {
        console.log("Pick Action threw error:", e);
    }
}

main();
