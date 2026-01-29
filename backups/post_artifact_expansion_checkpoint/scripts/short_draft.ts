import { db } from '../src/lib/prisma';
import { autoDraft } from '../src/app/league/[id]/draft/actions';

async function main() {
    // 1. Find League and Draft
    const league = await db.league.findFirst();
    if (!league) return console.log('❌ No league found');

    const draft = await db.draft.findFirst({ where: { leagueId: league.id } });
    if (!draft) return console.log('❌ No draft found');

    if (draft.status !== 'drafting' && draft.status !== 'open') {
        // Reset draft specifically for this test if it's completed?
        // Or just log it.
        console.log(`⚠️ Draft is ${draft.status}`);
        if (draft.status === 'completed') return;
    }

    // Ensure status is drafting
    if (draft.status === 'open') {
        await db.draft.update({ where: { id: draft.id }, data: { status: 'drafting', currentPick: 1 } });
    }

    console.log(`🚀 Starting Mock Draft Simulation for League ${league.id}`);

    // 2. Run lots of picks
    // Since autoDraft stops at user pick, we loop until complete
    let safety = 0;
    while (safety < 200) {
        const result: any = await autoDraft(league.id, draft.id);

        if (result.draftComplete) {
            console.log("✅ Draft Complete!");
            break;
        }

        if (result.isUserTurn) {
            console.log("👤 User turn! Simulating pick for user...");
            // Force pick for user to keep things moving
            // Find best player
            const available = await db.player.findFirst({
                where: {
                    rosterSlots: { none: { team: { leagueId: league.id } } }
                },
                orderBy: { adp: 'asc' }
            });

            if (!available) break;

            // Find user team
            const userTeam = await db.team.findFirst({ where: { name: "The DevGods", leagueId: league.id } });
            if (userTeam) {
                // Hack: Call internal pick logic indirectly or via pickPlayer?
                // Since pickPlayer calls executePickInternal which is not exported, 
                // we will manual pick.
                // Actually, let's just use the pickPlayer action if possible, but we are in a script context.
                // We'll just skip user turn logic or implement a quick raw DB insert to bypass constraints for test.
                // But wait, 'autoDraft' stops on user turn.

                // Simulating User Pick:
                const draftState = await db.draft.findUnique({ where: { id: draft.id } });
                if (!draftState) break;

                // Find slot
                const slot = await db.rosterSlot.findFirst({
                    where: { teamId: userTeam.id, playerId: null, slotType: available.position }
                }) || await db.rosterSlot.findFirst({
                    where: { teamId: userTeam.id, playerId: null, slotType: 'BENCH' }
                });

                if (slot) {
                    await db.$transaction([
                        db.draftPick.create({
                            data: {
                                draftId: draft.id,
                                teamId: userTeam.id,
                                playerId: available.id,
                                pickNumber: draftState.currentPick,
                                round: Math.ceil(draftState.currentPick / 10)
                            }
                        }),
                        db.rosterSlot.update({ where: { id: slot.id }, data: { playerId: available.id } }),
                        db.draft.update({ where: { id: draft.id }, data: { currentPick: draftState.currentPick + 1 } })
                    ]);
                    console.log(`👤 User Picked: ${available.name} (${available.position})`);
                }
            }
        }
        safety++;
    }

    // 3. Analyze Results
    console.log("\n📊 Analysis:");
    const teams = await db.team.findMany({
        where: { leagueId: league.id },
        include: { rosterSlots: { include: { player: true } } }
    });

    for (const t of teams) {
        const missing = [];
        const roster = t.rosterSlots.filter(s => s.playerId && s.player);
        const qbs = roster.filter(s => s.player?.position === 'QB').length;
        const rbs = roster.filter(s => s.player?.position === 'RB').length;

        if (qbs === 0) missing.push("QB");
        if (rbs < 2) missing.push("RB < 2");

        console.log(`Team ${t.name}: QB=${qbs}, RB=${rbs}, WR=${roster.filter(s => s.player?.position === 'WR').length} | Missing: ${missing.join(', ') || 'NONE'}`);
    }
}

main();
