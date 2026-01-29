import { db } from '../src/lib/prisma';

async function main() {
    console.log("🛠️ Fixing and Finishing Draft...");

    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id }, include: { picks: true } });

    if (!draft) return;

    // 1. Identify Missing Picks
    // We expect 150 picks.
    const expectedPicks = 150;
    const existingPickNums = new Set(draft.picks.map(p => p.pickNumber));

    const missingPickNums = [];
    for (let i = 1; i <= expectedPicks; i++) {
        if (!existingPickNums.has(i)) {
            missingPickNums.push(i);
        }
    }

    console.log(`Found ${missingPickNums.length} missing picks.`);

    if (missingPickNums.length === 0 && draft.status === 'completed') {
        console.log("Draft is already perfect.");
        return;
    }

    // 2. Helper to determine Team for a pick
    const teams = await db.team.findMany({ where: { leagueId: league?.id }, orderBy: { createdAt: 'asc' } });
    const numTeams = teams.length; // 10

    const getTeamForPick = (pickNum: number) => {
        const idx = pickNum - 1;
        const round = Math.floor(idx / numTeams) + 1;
        const pickInRound = (idx % numTeams) + 1;
        const isEve = round % 2 === 0;
        const teamIdx = isEve ? (numTeams - pickInRound) : (pickInRound - 1);
        return { team: teams[teamIdx], round };
    };

    // 3. Get Available Players
    const takenPlayerIds = await db.rosterSlot.findMany({ where: { playerId: { not: null } }, select: { playerId: true } });
    const takenSet = new Set(takenPlayerIds.map(s => s.playerId));

    const availablePlayers = await db.player.findMany({
        where: { id: { notIn: Array.from(takenSet) as string[] } },
        orderBy: { adp: 'asc' },
        take: 200
    });

    let playerPoolIdx = 0;

    // 4. Fill Missing Picks
    for (const pickNum of missingPickNums) {
        const { team, round } = getTeamForPick(pickNum);

        // Find a slot for this team?
        // Actually, check if the team ALREADY has a player for this implied slot?
        // No, we assume if pick is missing, we need to add player.

        // Grab next player
        let player = availablePlayers[playerPoolIdx];

        // Try to match position need?
        // Simplified: Just take best available. If logic required, we'd query roster.
        // We'll just force it into BENCH if needed.

        if (!player) {
            console.log("⚠️ Run out of players!");
            break;
        }

        // Create Pick
        await db.draftPick.create({
            data: {
                draftId: draft.id,
                teamId: team.id,
                playerId: player.id,
                pickNumber: pickNum,
                round: round
            }
        });

        // Update Roster (Find open slot)
        // Prefer position match
        let slot = await db.rosterSlot.findFirst({ where: { teamId: team.id, playerId: null, slotType: player.position } });
        if (!slot) slot = await db.rosterSlot.findFirst({ where: { teamId: team.id, playerId: null, slotType: 'BENCH' } });
        if (!slot) slot = await db.rosterSlot.findFirst({ where: { teamId: team.id, playerId: null, slotType: 'FLEX' } });

        if (slot) {
            await db.rosterSlot.update({ where: { id: slot.id }, data: { playerId: player.id } });
        } else {
            console.log(`⚠️ Warning: No slot found for ${player.position} on Team ${team.name} (Pick ${pickNum})`);
        }

        console.log(`Filled Pick ${pickNum}: ${player.name} -> ${team.name}`);
        playerPoolIdx++;
    }

    // 5. Mark Complete
    await db.draft.update({
        where: { id: draft.id },
        data: { status: 'completed', currentPick: 151 }
    });

    console.log("✅ Draft repair complete. Status: COMPLETED.");
}

main();
