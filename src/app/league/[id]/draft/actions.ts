"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// The user's team name - this is the only team the human controls
const USER_TEAM_NAME = "The DevGods";

/**
 * Get the best available player for AI auto-drafting.
 * Uses a simple priority: QB > RB > WR > TE > DST > K
 * Considers team roster needs.
 */
async function getBestAvailablePlayer(leagueId: string, teamId: string) {
    // Get already-drafted player IDs in this league
    const draftedPlayerIds = await db.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    // Get team's current roster to determine needs
    const teamSlots = await db.rosterSlot.findMany({
        where: { teamId },
        include: { player: true },
    });

    const filledPositions: Record<string, number> = {};
    const emptySlots: Record<string, number> = {};

    for (const slot of teamSlots) {
        if (slot.playerId) {
            filledPositions[slot.slotType] = (filledPositions[slot.slotType] || 0) + 1;
        } else {
            emptySlots[slot.slotType] = (emptySlots[slot.slotType] || 0) + 1;
        }
    }

    // Priority order for drafting (RB and WR first since they have 2 slots each)
    const positionPriority = ["RB", "WR", "QB", "TE", "FLEX", "DST", "K"];

    // Find position with most need (empty starter slots first)
    let targetPosition: string | null = null;
    for (const pos of positionPriority) {
        if ((emptySlots[pos] || 0) > 0) {
            targetPosition = pos;
            break;
        }
    }

    // If all starters filled, go for bench
    if (!targetPosition && (emptySlots["BENCH"] || 0) > 0) {
        targetPosition = null; // Any position for bench
    }

    // Find available players
    let availablePlayers;
    if (targetPosition && targetPosition !== "FLEX") {
        availablePlayers = await db.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: targetPosition,
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else if (targetPosition === "FLEX") {
        // FLEX can be RB, WR, or TE
        availablePlayers = await db.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: { in: ["RB", "WR", "TE"] },
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else {
        // Just get any available player
        availablePlayers = await db.player.findMany({
            where: { id: { notIn: draftedPlayerIds } },
            orderBy: { name: "asc" },
            take: 10,
        });
    }

    // Return a random player from top available (adds variety to AI picks)
    if (availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(3, availablePlayers.length));
        return availablePlayers[randomIndex];
    }

    // Fallback: if no players found for target position, get any available player
    const anyPlayer = await db.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        orderBy: { name: "asc" },
        take: 5,
    });

    if (anyPlayer.length > 0) {
        return anyPlayer[Math.floor(Math.random() * anyPlayer.length)];
    }

    return null;
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
        return { success: false };
    }

    // 4. Find an open slot for this player
    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) return { success: false };

    // Slot priority logic
    let targetSlot;
    if (player.position === "QB" || player.position === "K" || player.position === "DST") {
        targetSlot = await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await db.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
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
        return { success: false };
    }

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
