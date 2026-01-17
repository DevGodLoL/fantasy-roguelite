"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPlayerToRoster(
    leagueId: string,
    teamId: string,
    slotId: string,
    playerId: string
) {
    // 1. Check if player is already on another team in this league
    const existingAssignment = await prisma.rosterSlot.findFirst({
        where: {
            playerId,
            team: { leagueId },
        },
    });

    if (existingAssignment) {
        throw new Error("Player is already rostered in this league.");
    }

    // 2. Assign player to the specific slot
    await prisma.rosterSlot.update({
        where: { id: slotId },
        data: { playerId },
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
}

export async function dropPlayer(
    leagueId: string,
    teamId: string,
    slotId: string
) {
    await prisma.rosterSlot.update({
        where: { id: slotId },
        data: { playerId: null },
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
}
