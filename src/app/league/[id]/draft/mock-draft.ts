"use server";

/**
 * Mock Draft Runner - Runs the entire draft automatically for testing
 * This simulates the draft without needing the UI
 */

import { prisma } from "@/lib/prisma";

const USER_TEAM_NAME = "The DevGods";

async function getBestAvailablePlayer(leagueId: string, teamId: string) {
    // Get already-drafted player IDs in this league
    const draftedPlayerIds = await prisma.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    // Get team's current roster to determine needs
    const teamSlots = await prisma.rosterSlot.findMany({
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

    // Priority order for drafting
    const positionPriority = ["RB", "WR", "QB", "TE", "FLEX", "K", "DST"];

    // Find position with most need
    let targetPosition: string | null = null;
    for (const pos of positionPriority) {
        if ((emptySlots[pos] || 0) > 0) {
            targetPosition = pos;
            break;
        }
    }

    // Find available players
    let availablePlayers;
    if (targetPosition && targetPosition !== "FLEX") {
        availablePlayers = await prisma.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: targetPosition,
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else if (targetPosition === "FLEX") {
        availablePlayers = await prisma.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: { in: ["RB", "WR", "TE"] },
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else {
        // Any position for bench
        availablePlayers = await prisma.player.findMany({
            where: { id: { notIn: draftedPlayerIds } },
            orderBy: { name: "asc" },
            take: 10,
        });
    }

    if (availablePlayers.length > 0) {
        return availablePlayers[Math.floor(Math.random() * Math.min(3, availablePlayers.length))];
    }

    // Fallback: any available player
    const anyPlayer = await prisma.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        take: 5,
    });

    return anyPlayer.length > 0 ? anyPlayer[0] : null;
}

async function executePick(
    draftId: string,
    teamId: string,
    playerId: string,
    pickNumber: number
): Promise<boolean> {
    const numTeams = 10;
    const currentPickIndex = pickNumber - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;

    // Get player and find slot
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return false;

    // Slot priority logic
    let targetSlot;
    if (player.position === "QB" || player.position === "K" || player.position === "DST") {
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    } else {
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "FLEX" }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    }

    if (!targetSlot) {
        console.error(`No slot available for ${player.name} (${player.position}) on team ${teamId}`);
        return false;
    }

    await prisma.$transaction([
        prisma.draftPick.create({
            data: {
                draftId,
                teamId,
                playerId,
                pickNumber,
                round,
            },
        }),
        prisma.rosterSlot.update({
            where: { id: targetSlot.id },
            data: { playerId },
        }),
        prisma.draft.update({
            where: { id: draftId },
            data: { currentPick: pickNumber + 1 },
        }),
    ]);

    return true;
}

export async function runMockDraft(leagueId: string): Promise<{ success: boolean; message: string }> {
    console.log("\n=== STARTING MOCK DRAFT ===\n");

    const draft = await prisma.draft.findFirst({
        where: { leagueId },
    });

    if (!draft) {
        return { success: false, message: "No draft found for this league" };
    }

    // Start the draft
    await prisma.draft.update({
        where: { id: draft.id },
        data: { status: "drafting" },
    });

    const teams = await prisma.team.findMany({
        where: { leagueId },
        orderBy: { createdAt: "asc" },
    });

    const numTeams = teams.length;
    const totalPicks = numTeams * 15; // 15 rounds

    for (let pickNumber = 1; pickNumber <= totalPicks; pickNumber++) {
        const currentPickIndex = pickNumber - 1;
        const round = Math.floor(currentPickIndex / numTeams) + 1;
        const pickInRound = (currentPickIndex % numTeams) + 1;

        // Snake logic
        const isEvenRound = round % 2 === 0;
        const activeTeamIndex = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
        const activeTeam = teams[activeTeamIndex];

        // Get best player for this team
        const bestPlayer = await getBestAvailablePlayer(leagueId, activeTeam.id);

        if (!bestPlayer) {
            console.error(`No players available for pick ${pickNumber}!`);
            return { success: false, message: `Ran out of players at pick ${pickNumber}` };
        }

        const success = await executePick(draft.id, activeTeam.id, bestPlayer.id, pickNumber);

        if (!success) {
            return { success: false, message: `Failed to execute pick ${pickNumber}` };
        }

        const isUser = activeTeam.name === USER_TEAM_NAME;
        console.log(
            `Pick ${pickNumber} (R${round}P${pickInRound}): ${activeTeam.name}${isUser ? " 👤" : ""} → ${bestPlayer.name} (${bestPlayer.position})`
        );
    }

    // Complete the draft
    await prisma.draft.update({
        where: { id: draft.id },
        data: { status: "completed" },
    });

    console.log("\n=== MOCK DRAFT COMPLETE ===\n");

    return { success: true, message: "Mock draft completed successfully!" };
}
