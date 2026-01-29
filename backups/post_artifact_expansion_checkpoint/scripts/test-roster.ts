
import { db } from "@/lib/prisma";
import { swapRosterSlots, dropPlayer, addPlayerToRoster } from "@/app/league/[id]/team/actions";

async function verifyRosterManagement() {
    console.log("🧪 Starting Roster Management Verification...");

    // 1. Setup
    const league = await db.league.findFirst({
        include: { teams: { include: { rosterSlots: { include: { player: true } } } } }
    });
    if (!league) { console.error("❌ No league found"); return; }

    // Use the first team
    const team = league.teams[0];
    console.log(`📋 Testing Team: ${team.name} (Slots: ${team.rosterSlots.length})`);

    // 2. Test Swap Logic
    console.log("\n🔄 Testing Roster Swap...");

    // Find two swappable slots (e.g., both BENCH or same position)
    // Let's try to swap two BENCH players first as it's always safe
    const benchSlots = team.rosterSlots.filter(s => s.slotType === 'BENCH');

    if (benchSlots.length >= 2) {
        const slot1 = benchSlots[0];
        const slot2 = benchSlots[1];

        console.log(`   Attempting to swap ${slot1.player?.name || 'Empty'} (Slot ${slot1.id}) <-> ${slot2.player?.name || 'Empty'} (Slot ${slot2.id})`);

        try {
            await swapRosterSlots(league.id, team.id, slot1.id, slot2.id);
            console.log("   ✅ Swap action executed without error.");

            // Verify DB State
            const updatedSlot1 = await db.rosterSlot.findUnique({ where: { id: slot1.id } });
            const updatedSlot2 = await db.rosterSlot.findUnique({ where: { id: slot2.id } });

            // Check if player IDs swapped
            if (updatedSlot1?.playerId === slot2.playerId && updatedSlot2?.playerId === slot1.playerId) {
                console.log("   ✅ Verified: Player IDs swapped correctly in DB.");
            } else {
                console.error("   ❌ Swap Verification Failed: IDs matched original state or invalid.");
            }

        } catch (e) {
            console.error("   ❌ Swap Failed:", e);
        }
    } else {
        console.log("   ⚠️ Not enough bench slots to test swap.");
    }

    // 3. Test Drop Logic
    console.log("\n🗑️  Testing Player Drop...");

    // Find a player to drop ( Bench player preferred )
    const dropTarget = team.rosterSlots.find(s => s.playerId && s.slotType === 'BENCH');

    if (dropTarget && dropTarget.playerId) {
        console.log(`   Dropping player: ${dropTarget.player?.name} (Slot: ${dropTarget.id})`);

        try {
            await dropPlayer(league.id, team.id, dropTarget.id);
            console.log("   ✅ Drop action executed.");

            const verifySlot = await db.rosterSlot.findUnique({ where: { id: dropTarget.id } });
            if (verifySlot?.playerId === null) {
                console.log("   ✅ Verified: Slot is now empty.");

                // 4. Test Add Logic (Re-add the player or a free agent to this empty slot)
                console.log("\n➕ Testing Player Add (Re-recruiting)...");
                // We'll just put the player back for cleanliness if possible, or a top FA
                const originalPlayerId = dropTarget.playerId;

                // Add back
                try {
                    await addPlayerToRoster(league.id, team.id, dropTarget.id, originalPlayerId);
                    console.log("   ✅ Add action executed.");

                    const reVerify = await db.rosterSlot.findUnique({ where: { id: dropTarget.id } });
                    if (reVerify?.playerId === originalPlayerId) {
                        console.log("   ✅ Verified: Player added back successfully.");
                    } else {
                        console.error("   ❌ Add verification failed.");
                    }
                } catch (addError) {
                    console.error("   ❌ Re-add failed (Player might be rostered check failed?):", addError);
                }

            } else {
                console.error("   ❌ Drop Failed: Slot still has player ID.");
            }
        } catch (e) {
            console.error("   ❌ Drop Action Failed:", e);
        }
    } else {
        console.log("   ⚠️ No safe player found to drop.");
    }

    console.log("\n🧪 Roster Verification Complete.");
}

verifyRosterManagement()
    .catch(console.error)
    .finally(async () => await db.$disconnect());
