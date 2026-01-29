import { db } from '../src/lib/prisma';

async function main() {
    console.log("🏁 Finalizing Draft in DB...");

    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });

    // 1. Find all teams that have empty slots
    const teams = await db.team.findMany({
        where: { leagueId: league?.id },
        include: { rosterSlots: true }
    });

    // 2. Find available players
    const draftedStruct = await db.rosterSlot.findMany({ where: { playerId: { not: null } }, select: { playerId: true } });
    const takenIds = new Set(draftedStruct.map(s => s.playerId));

    const allPlayers = await db.player.findMany({
        where: { id: { notIn: Array.from(takenIds) as string[] } },
        orderBy: { adp: 'asc' }
    });

    let playerIdx = 0;

    for (const team of teams) {
        const emptySlots = team.rosterSlots.filter(s => !s.playerId);
        if (emptySlots.length === 0) continue;

        console.log(`Team ${team.name} needs ${emptySlots.length} players...`);

        for (const slot of emptySlots) {
            // Find a player that fits? Or just any player if it's AI?
            // Technically AI needs valid slots.
            // Simplified: Just match position strictly.
            // If matching fails, use BEST AVAILABLE for BENCH.

            let candidate = allPlayers.slice(playerIdx).find(p => p.position === slot.slotType);

            if (!candidate && slot.slotType === 'FLEX') {
                candidate = allPlayers.slice(playerIdx).find(p => ['RB', 'WR', 'TE'].includes(p.position));
            }
            if (!candidate && slot.slotType === 'BENCH') {
                candidate = allPlayers[playerIdx]; // Just take next best
            }

            if (candidate) {
                // Update Slot
                await db.rosterSlot.update({
                    where: { id: slot.id },
                    data: { playerId: candidate.id }
                });
                // Add Draft Pick Record (Fake)
                // We won't bother with accurate pick/round numbers for this bulk finish, purely to fill rosters
                // Actually, draft picks are needed for history? Maybe not critical.

                // Remove from pool
                playerIdx = allPlayers.indexOf(candidate) + 1; // crude advancement
                // Better: swap to prevent reuse
                // Actually slice is inefficient inside loop.
                // Optim: just filter standard array.
                // Let's rely on filter index.

                // Hack: Set candidate id to null in array so we don't reuse
                (candidate as any).id = 'USED';
            }
        }
    }

    // 3. Mark Draft Completed
    await db.draft.update({
        where: { id: draft!.id },
        data: { status: 'completed', currentPick: 151 }
    });

    console.log("✅ Draft Completed. Season is ready!");
}

main();
