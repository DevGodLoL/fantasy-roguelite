"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function pickPlayer(
    leagueId: string,
    draftId: string,
    teamId: string,
    playerId: string
) {
    // 1. Get the draft state
    const draft = await prisma.draft.findUnique({
        where: { id: draftId },
        include: { picks: true },
    });

    if (!draft || draft.status !== "drafting") {
        throw new Error("Draft is not active.");
    }

    // 2. Identify whose turn it is
    const teamsInLeague = await prisma.team.findMany({
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
        throw new Error("It is not your turn to pick.");
    }

    // 3. Verify player availability
    const isTaken = await prisma.rosterSlot.findFirst({
        where: {
            playerId,
            team: { leagueId },
        },
    });

    if (isTaken) {
        throw new Error("Player has already been drafted.");
    }

    // 4. Find an open slot for this player
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new Error("Player not found.");

    const openSlot = await prisma.rosterSlot.findFirst({
        where: {
            teamId,
            playerId: null,
            OR: [
                { slotType: player.position },
                { slotType: "FLEX", OR: [{ slotType: "RB" }, { slotType: "WR" }, { slotType: "TE" }] }, // Flex logic simplified
                { slotType: "BENCH" }
            ]
        },
        orderBy: { isStarter: "desc" }
    });

    // Re-check slot logic: FLEX can take RB, WR, TE.
    let targetSlot;
    if (player.position === "QB" || player.position === "K" || player.position === "DST") {
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    } else {
        // RB, WR, TE can go to their slot, FLEX, or BENCH
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "FLEX" }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    }

    if (!targetSlot) {
        throw new Error("No available roster slots for this position.");
    }

    // 5. Execute the pick
    await prisma.$transaction([
        prisma.draftPick.create({
            data: {
                draftId,
                teamId,
                playerId,
                pickNumber: draft.currentPick,
                round,
            },
        }),
        prisma.rosterSlot.update({
            where: { id: targetSlot.id },
            data: { playerId },
        }),
        prisma.draft.update({
            where: { id: draftId },
            data: { currentPick: draft.currentPick + 1 },
        }),
    ]);

    // 6. Check if draft is finished (14 rounds for 10 teams = 140 picks)
    const totalSlotsPerTeam = 14;
    if (draft.currentPick >= numTeams * totalSlotsPerTeam) {
        await prisma.draft.update({
            where: { id: draftId },
            data: { status: "completed" }
        });
    }

    revalidatePath(`/league/${leagueId}/draft`);
}

export async function startDraft(draftId: string, leagueId: string) {
    await prisma.draft.update({
        where: { id: draftId },
        data: { status: "drafting" }
    });
    revalidatePath(`/league/${leagueId}/draft`);
}
