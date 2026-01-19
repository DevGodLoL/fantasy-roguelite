
import { db } from "@/lib/prisma";
import { submitWaiverClaim, processWaivers } from "@/app/league/[id]/waivers/actions";

async function verifyWaivers() {
    console.log("🧪 Starting Waiver System Verification...");

    // 1. Setup: Find a League and User Team
    // We'll use the first available league for testing
    const league = await db.league.findFirst({
        include: { teams: { include: { rosterSlots: true } } }
    });

    if (!league) {
        console.error("❌ No league found to test.");
        return;
    }

    const season = await db.league.findFirst({ where: { id: league.id } });
    if (!season) { console.error("League not found"); return; }

    // Find "The DevGods" or the first team
    const userTeam = league.teams.find(t => t.name === "The DevGods") || league.teams[0];
    console.log(`📋 Testing with Team: ${userTeam.name} (ID: ${userTeam.id})`);
    console.log(`💰 Current FAAB: ${userTeam.faabBalance}`);

    // 2. Find a Free Agent (Player not on any roster in this league)
    const rosteredPlayerIds = await db.rosterSlot.findMany({
        where: { team: { leagueId: league.id }, playerId: { not: null } },
        select: { playerId: true }
    }).then(slots => slots.map(s => s.playerId).filter(id => id !== null) as string[]);

    const freeAgent = await db.player.findFirst({
        where: { id: { notIn: rosteredPlayerIds } },
        orderBy: { adp: 'asc' } // Get a good player
    });

    if (!freeAgent) {
        console.error("❌ No free agents found.");
        return;
    }

    console.log(`🎯 Targeting Free Agent: ${freeAgent.name} (${freeAgent.position})`);

    // 3. Submit a Waiver Claim
    console.log("📝 Submitting Waiver Claim...");
    const BID_AMOUNT = 5;

    // Check if we need to drop someone
    let dropPlayerId: string | undefined = undefined;
    const emptySlots = userTeam.rosterSlots.filter(s => s.playerId === null);

    // Always try to drop a player to ensure the transaction succeeds (testing Drop-to-Add logic)
    const playerToDropSlot = userTeam.rosterSlots.find(s => s.playerId && (s.slotType === 'BENCH' || s.slotType === 'DST')) || userTeam.rosterSlots.find(s => s.playerId);

    if (playerToDropSlot && playerToDropSlot.playerId) {
        dropPlayerId = playerToDropSlot.playerId;
        console.log(`🔻 Forcing Drop-to-Add test. Will drop player: ${playerToDropSlot.player?.name} (ID: ${dropPlayerId})`);
    } else {
        console.log("⚠️ Could not find ANY player to drop. Test might fail.");
    }

    try {
        await submitWaiverClaim(league.id, userTeam.id, freeAgent.id, BID_AMOUNT, dropPlayerId);
        console.log("✅ Claim submitted successfully.");
    } catch (e) {
        console.error("❌ Failed to submit claim:", e);
        return;
    }

    // 4. Verify "Pending" State
    const pendingClaim = await db.waiverClaim.findFirst({
        where: { teamId: userTeam.id, playerId: freeAgent.id, status: 'pending' }
    });

    if (pendingClaim) {
        console.log("✅ Verified: Claim is in PENDING state in DB.");
    } else {
        console.error("❌ Claim not found in DB after submission.");
        return;
    }

    // 5. Process Waivers
    console.log("⚙️  Processing Waivers (Simulating 'Execute Contracts Now')...");
    const result = await processWaivers(league.id);
    console.log("📊 Process Result:", result);

    // 6. Verify "Successful" State & Roster Update
    const processedClaim = await db.waiverClaim.findFirst({
        where: { id: pendingClaim.id }
    });

    if (processedClaim?.status === 'successful') {
        console.log("✅ Verified: Claim status changed to SUCCESSFUL.");
    } else {
        console.error(`❌ Claim failed or stuck. Status: ${processedClaim?.status}`);
        if (processedClaim?.reason) console.error(`   Reason: ${processedClaim.reason}`);
    }

    // 7. Verify Player is on Roster
    const updatedRosterSlot = await db.rosterSlot.findFirst({
        where: { teamId: userTeam.id, playerId: freeAgent.id }
    });

    if (updatedRosterSlot) {
        console.log(`✅ Verified: ${freeAgent.name} is now on the roster!`);
    } else {
        console.error(`❌ Player ${freeAgent.name} is NOT on the roster.`);
    }

    // 8. Verify FAAB Deduction
    const updatedTeam = await db.team.findUnique({ where: { id: userTeam.id } });
    if (updatedTeam) {
        const expectedFaab = userTeam.faabBalance - BID_AMOUNT;
        if (updatedTeam.faabBalance === expectedFaab) {
            console.log(`✅ Verified: FAAB deducted correctly. (${userTeam.faabBalance} -> ${updatedTeam.faabBalance})`);
        } else {
            console.log(`⚠️ FAAB mismatch. Expected ${expectedFaab}, got ${updatedTeam.faabBalance}`);
        }
    }

    console.log("🧪 Verification Complete.");
}

verifyWaivers()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
