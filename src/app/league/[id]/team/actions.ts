"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPlayerToRoster(
    leagueId: string,
    teamId: string,
    slotId: string,
    playerId: string
) {
    // 1. Check if player is already on another team in this league
    const existingAssignment = await db.rosterSlot.findFirst({
        where: {
            playerId,
            team: { leagueId },
        },
    });

    if (existingAssignment) {
        throw new Error("Player is already rostered in this league.");
    }

    // 2. Assign player to the specific slot
    await db.rosterSlot.update({
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
    await db.rosterSlot.update({
        where: { id: slotId },
        data: { playerId: null },
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
}

export async function swapRosterSlots(
    leagueId: string,
    teamId: string,
    slot1Id: string,
    slot2Id: string
) {
    const slot1 = await db.rosterSlot.findUnique({ where: { id: slot1Id }, include: { player: true } });
    const slot2 = await db.rosterSlot.findUnique({ where: { id: slot2Id }, include: { player: true } });

    if (!slot1 || !slot2) throw new Error("Slots not found.");
    if (slot1.teamId !== teamId || slot2.teamId !== teamId) throw new Error("Unauthorized access to team roster.");

    // Validate Constraints
    // Helper to check if player fits in slot
    const canFit = (player: { position: string } | null, slotType: string) => {
        if (!player) return true; // Empty player always fits? Yes.
        if (slotType === "BENCH") return true;
        if (slotType === "FLEX") return ["RB", "WR", "TE"].includes(player.position);
        return slotType === player.position;
    };

    // Check if Slot 1's player can go to Slot 2
    if (!canFit(slot1.player, slot2.slotType)) throw new Error(`Cannot move ${slot1.player?.name} (${slot1.player?.position}) to ${slot2.slotType} slot.`);
    // Check if Slot 2's player can go to Slot 1
    if (!canFit(slot2.player, slot1.slotType)) throw new Error(`Cannot move ${slot2.player?.name} (${slot2.player?.position}) to ${slot1.slotType} slot.`);

    // Perform Swap
    await db.$transaction([
        db.rosterSlot.update({ where: { id: slot1Id }, data: { playerId: slot2.playerId } }),
        db.rosterSlot.update({ where: { id: slot2Id }, data: { playerId: slot1.playerId } })
    ]);

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
}
