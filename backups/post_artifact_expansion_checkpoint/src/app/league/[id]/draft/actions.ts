"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// The user's team name - this is the only team the human controls
const USER_TEAM_NAME = "The DevGods";

/**
 * Get the best available player for AI auto-drafting.
 * Uses ADP (Average Draft Position) with some randomness for variety.
 * Also considers team roster needs to prioritize filling empty starter slots.
 */
/**
 * Get the best available player for AI auto-drafting.
 * Uses a Weighted Scoring System:
 * Score = (Base Value from ADP) * (Position Need Multiplier) * (Scarcity Modifier)
 */
async function getBestAvailablePlayer(leagueId: string, teamId: string) {
    // 1. Get drafted players to exclude
    const draftedPlayerIds = await db.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => new Set(slots.map((s) => s.playerId).filter((id): id is string => id !== null)));

    // 2. Get Team's Current Roster
    const teamSlots = await db.rosterSlot.findMany({
        where: { teamId },
        include: { player: true },
    });

    const filledCounts: Record<string, number> = {
        QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, DST: 0, K: 0, BENCH: 0
    };

    // Count filled starter slots
    let starerSlotsFilled = 0;
    for (const slot of teamSlots) {
        if (slot.playerId && slot.player) {
            // Count what user ACTUALLY has (based on player position)
            const pos = slot.player.position;
            filledCounts[pos] = (filledCounts[pos] || 0) + 1;
            if (slot.slotType !== 'BENCH') starerSlotsFilled++;
        }
    }

    // 3. Define Requirements
    const REQUIRED = {
        QB: 1, RB: 2, WR: 2, TE: 1, DST: 1, K: 1
    };

    // 4. Fetch Top 50 Available (Optimization: Don't score everyone)
    const candidates = await db.player.findMany({
        where: { id: { notIn: Array.from(draftedPlayerIds) } },
        orderBy: { adp: "asc" },
        take: 30,
    });

    if (candidates.length === 0) return null;

    let bestPlayer = null;
    let maxScore = -Infinity;

    // 5. Scoring Loop
    for (const p of candidates) {
        let score = (200 - p.adp); // Base Value: High ADP (low number) = High Score.
        let needMultiplier = 1.0;

        // A. Position Logic
        const currentCount = filledCounts[p.position] || 0;
        const required = REQUIRED[p.position as keyof typeof REQUIRED] || 0;
        const isStarterNeeded = currentCount < required;

        if (p.position === 'K' || p.position === 'DST') {
            // Deprioritize K/DST until very late (unless all starters full)
            if (starerSlotsFilled < 7) {
                needMultiplier = 0.05; // Virtually ignore early
            } else if (isStarterNeeded) {
                needMultiplier = 2.0; // Grab them at end
            } else {
                needMultiplier = 0.01; // Never draft backup K/DST
            }
        } else {
            // Core Positions (QB/RB/WR/TE)
            if (isStarterNeeded) {
                needMultiplier = 1.5; // High priority for starters

                // positional scarcity boost
                if (p.position === 'RB') needMultiplier *= 1.2;
                if (p.position === 'WR') needMultiplier *= 1.1;

            } else if (filledCounts['RB'] + filledCounts['WR'] + filledCounts['TE'] < 7) {
                // Flex/Bench depth
                needMultiplier = 0.8;
                // Don't draft backup QB/TE too early
                if ((p.position === 'QB' || p.position === 'TE') && currentCount >= 1) {
                    needMultiplier = 0.2;
                }
            } else {
                needMultiplier = 0.1; // Deep bench
            }
        }

        // Apply Multiplier
        score *= needMultiplier;

        // B. Update Best
        if (score > maxScore) {
            maxScore = score;
            bestPlayer = p;
        }
    }

    // Fallback: If logic creates negative or zero scores (rare), take top ADP
    return bestPlayer || candidates[0];
}

/**
 * Internal function to execute a single pick without triggering auto-continue.
 * Used by both user picks and AI picks.
 */
async function executePickInternal(
    leagueId: string,
    draftId: string,
    teamId: string,
    playerId: string
): Promise<{ success: boolean; draftComplete?: boolean }> {
    // 1. Get the draft state
    const draft = await db.draft.findUnique({
        where: { id: draftId },
        include: { picks: true },
    });

    if (!draft || draft.status !== "drafting") {
        return { success: false };
    }

    // 2. Identify whose turn it is
    const teamsInLeague = await db.team.findMany({
        where: { leagueId },
        orderBy: { createdAt: "asc" },
    });

    const numTeams = teamsInLeague.length;
    const currentPickIndex = draft.currentPick - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;

    // Snake logic
    let activeTeamIndex;
    if (draft.format === "snake") {
        const isEvenRound = round % 2 === 0;
        activeTeamIndex = isEvenRound
            ? numTeams - pickInRound
            : pickInRound - 1;
    } else {
        activeTeamIndex = pickInRound - 1;
    }

    const activeTeam = teamsInLeague[activeTeamIndex];

    if (activeTeam.id !== teamId) {
        return { success: false };
    }

    // 3. Verify player availability
    const isTaken = await db.rosterSlot.findFirst({
        where: {
            playerId,
            team: { leagueId },
        },
    });

    if (isTaken) {
        console.log(`❌ Pick Failed: Player ${playerId} is already taken.`);
        return { success: false };
    }

    // 4. Find an open slot for this player
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) return { success: false };

    console.log(`Attempting to draft ${player.name} (${player.position}) to team ${teamId}`);

    // Slot priority logic
    let targetSlot;
    if (player.position === "QB" || player.position === "K" || player.position === "DST") {
        // Try specific slot first
        targetSlot = await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        });

        if (!targetSlot) {
            console.log(`No ${player.position} slot found. Checking BENCH.`);
            targetSlot = await db.rosterSlot.findFirst({
                where: { teamId, playerId: null, slotType: "BENCH" }
            });
        }
    } else {
        // RB, WR, TE can go to their slot, FLEX, or BENCH
        targetSlot = await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "FLEX" }
        }) || await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    }

    if (!targetSlot) {
        console.log(`❌ Pick Failed: No suitable slot found for ${player.position}.`);
        return { success: false };
    }

    console.log(`✅ Found slot: ${targetSlot.slotType} (${targetSlot.id})`);

    // 5. Execute the pick
    await db.$transaction([
        db.draftPick.create({
            data: {
                draftId,
                teamId,
                playerId,
                pickNumber: draft.currentPick,
                round,
            },
        }),
        db.rosterSlot.update({
            where: { id: targetSlot.id },
            data: { playerId },
        }),
        db.draft.update({
            where: { id: draftId },
            data: { currentPick: draft.currentPick + 1 },
        }),
    ]);

    // 6. Check if draft is finished (15 rounds for 10 teams = 150 picks)
    const totalSlotsPerTeam = 15;
    if (draft.currentPick >= numTeams * totalSlotsPerTeam) {
        await db.draft.update({
            where: { id: draftId },
            data: { status: "completed" }
        });
        return { success: true, draftComplete: true };
    }

    return { success: true };
}

/**
 * Main function called when the USER makes a pick.
 * After the user's pick, it automatically runs AI picks until it's the user's turn again.
 */
export async function pickPlayer(
    leagueId: string,
    draftId: string,
    teamId: string,
    playerId: string
) {
    // Execute the user's pick
    const result = await executePickInternal(leagueId, draftId, teamId, playerId);

    if (!result.success) {
        throw new Error("Failed to execute pick");
    }

    if (result.draftComplete) {
        revalidatePath(`/league/${leagueId}/draft`);
        return;
    }

    // Auto-continue: Run AI picks until it's the user's turn again
    // In a 10-team snake draft, worst case is 19 picks (9 to end round + 10 back)
    for (let i = 0; i < 20; i++) {
        const aiResult = await runSingleAIPick(leagueId, draftId);
        if (!aiResult.success || aiResult.isUserTurn || aiResult.draftComplete) {
            break;
        }
    }

    revalidatePath(`/league/${leagueId}/draft`);
}

/**
 * Internal function to run a single AI pick.
 * Returns info about whether to continue or stop.
 */
async function runSingleAIPick(leagueId: string, draftId: string): Promise<{
    success: boolean;
    isUserTurn?: boolean;
    draftComplete?: boolean;
}> {
    const draft = await db.draft.findUnique({
        where: { id: draftId },
    });

    if (!draft || draft.status !== "drafting") {
        return { success: false };
    }

    const teamsInLeague = await db.team.findMany({
        where: { leagueId },
        orderBy: { createdAt: "asc" },
    });

    const numTeams = teamsInLeague.length;
    const currentPickIndex = draft.currentPick - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;

    // Snake logic
    let activeTeamIndex;
    if (draft.format === "snake") {
        const isEvenRound = round % 2 === 0;
        activeTeamIndex = isEvenRound
            ? numTeams - pickInRound
            : pickInRound - 1;
    } else {
        activeTeamIndex = pickInRound - 1;
    }

    const activeTeam = teamsInLeague[activeTeamIndex];

    // If it's the user's team, don't auto-draft
    if (activeTeam.name === USER_TEAM_NAME) {
        return { success: false, isUserTurn: true };
    }

    // Get best available player for AI
    const bestPlayer = await getBestAvailablePlayer(leagueId, activeTeam.id);

    if (!bestPlayer) {
        return { success: false };
    }

    // Execute the AI pick
    const pickResult = await executePickInternal(leagueId, draftId, activeTeam.id, bestPlayer.id);

    return {
        success: pickResult.success,
        draftComplete: pickResult.draftComplete,
    };
}

/**
 * Public auto-draft function (for manual button if needed)
 * Loops through all AI picks until it's the user's turn
 */
export async function autoDraft(leagueId: string, draftId: string) {
    // Run up to 20 AI picks (handles 2 rounds max in case user is in corner)
    for (let i = 0; i < 20; i++) {
        const result = await runSingleAIPick(leagueId, draftId);

        // If it's the user's turn, stop and return
        if (result.isUserTurn) {
            revalidatePath(`/league/${leagueId}/draft`);
            return { success: true, message: "It's your turn!", isUserTurn: true };
        }

        // If draft is complete, stop
        if (result.draftComplete) {
            revalidatePath(`/league/${leagueId}/draft`);
            return { success: true, draftComplete: true };
        }

        // If the pick failed for another reason (no players, invalid state), stop
        if (!result.success) {
            break;
        }
    }

    revalidatePath(`/league/${leagueId}/draft`);
    return { success: true };
}

/**
 * Returns info about whose turn it is
 */
export async function getDraftTurnInfo(leagueId: string, draftId: string) {
    const draft = await db.draft.findUnique({
        where: { id: draftId },
    });

    if (!draft) return null;

    const teamsInLeague = await db.team.findMany({
        where: { leagueId },
        orderBy: { createdAt: "asc" },
    });

    const numTeams = teamsInLeague.length;
    const currentPickIndex = draft.currentPick - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;

    let activeTeamIndex;
    if (draft.format === "snake") {
        const isEvenRound = round % 2 === 0;
        activeTeamIndex = isEvenRound
            ? numTeams - pickInRound
            : pickInRound - 1;
    } else {
        activeTeamIndex = pickInRound - 1;
    }

    const activeTeam = teamsInLeague[activeTeamIndex];
    const isUserTurn = activeTeam.name === USER_TEAM_NAME;
    const userTeam = teamsInLeague.find(t => t.name === USER_TEAM_NAME);

    return {
        activeTeamId: activeTeam.id,
        activeTeamName: activeTeam.name,
        isUserTurn,
        userTeamId: userTeam?.id,
        round,
        pick: draft.currentPick,
        status: draft.status,
    };
}

export async function startDraft(draftId: string, leagueId: string) {
    await db.draft.update({
        where: { id: draftId },
        data: { status: "drafting" }
    });

    // After starting, auto-run AI picks until it's user's turn
    // In a 10-team snake draft, worst case is 19 picks if user is last
    const draft = await db.draft.findUnique({ where: { id: draftId } });
    if (draft) {
        for (let i = 0; i < 20; i++) {
            const result = await runSingleAIPick(leagueId, draftId);
            if (!result.success || result.isUserTurn || result.draftComplete) {
                break;
            }
        }
    }

    revalidatePath(`/league/${leagueId}/draft`);
}
