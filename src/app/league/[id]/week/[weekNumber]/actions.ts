"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Rarity weights (cumulative)
const RARITY_WEIGHTS = [
    { type: "common", threshold: 0.7 },
    { type: "rare", threshold: 0.9 }, // 0.7 + 0.2
    { type: "epic", threshold: 0.99 }, // 0.9 + 0.09
    { type: "legendary", threshold: 1.0 }, // 0.99 + 0.01
];

function selectRarity(): string {
    const r = Math.random();
    if (r < 0.7) return "common";
    if (r < 0.9) return "rare";
    if (r < 0.99) return "epic";
    return "legendary";
}

export async function ensurePackOffers(leagueId: string, teamId: string, weekId: string) {
    if (!leagueId || !teamId || !weekId) return;

    // 1. Check if offers already exist
    const existingOffers = await prisma.teamPowerupOffer.findMany({
        where: { teamId, weekId },
        include: { powerup: true },
    });

    if (existingOffers.length > 0) {
        return existingOffers;
    }

    // 2. Fetch all powerups
    const allPowerups = await prisma.powerup.findMany();

    // 3. Select 4 distinct powerups
    const selected: typeof allPowerups = [];
    const needed = 4;

    // Safety: if total powerups < needed, just return all of them
    if (allPowerups.length <= needed) {
        selected.push(...allPowerups);
    } else {
        // Try to pick by rarity
        while (selected.length < needed) {
            const targetRarity = selectRarity();

            // Find candidates of this rarity not yet selected
            const candidates = allPowerups.filter(
                (p) => p.rarity === targetRarity && !selected.find((s) => s.id === p.id)
            );

            if (candidates.length > 0) {
                const pick = candidates[Math.floor(Math.random() * candidates.length)];
                selected.push(pick);
            } else {
                // Fallback: Pick any unselected powerup regardless of rarity
                const anyCandidates = allPowerups.filter(
                    (p) => !selected.find((s) => s.id === p.id)
                );
                if (anyCandidates.length > 0) {
                    const pick = anyCandidates[Math.floor(Math.random() * anyCandidates.length)];
                    selected.push(pick);
                } else {
                    break; // No more available
                }
            }
        }
    }

    // 4. Create offers
    if (selected.length > 0) {
        await prisma.teamPowerupOffer.createMany({
            data: selected.map((p) => ({
                teamId,
                weekId,
                powerupId: p.id,
                isChosen: false,
            })),
        });
    }

    revalidatePath(`/league/${leagueId}/week/${(await prisma.week.findUnique({ where: { id: weekId } }))?.number}`);
    return await prisma.teamPowerupOffer.findMany({
        where: { teamId, weekId },
        include: { powerup: true },
    });
}

export async function selectPowerup(formData: FormData) {
    const teamId = formData.get("teamId") as string;
    const powerupId = formData.get("powerupId") as string;
    const weekId = formData.get("weekId") as string;
    const leagueId = formData.get("leagueId") as string;
    const weekNumber = formData.get("weekNumber") as string;

    if (!teamId || !powerupId || !weekId) {
        throw new Error("Missing required fields");
    }

    // NEW: Check if this powerup is actually offered to this team for this week
    const offer = await prisma.teamPowerupOffer.findFirst({
        where: {
            teamId,
            weekId,
            powerupId,
        },
    });

    if (!offer) {
        throw new Error("Invalid powerup selection: Not in your pack!");
    }

    // Check if team already has a powerup for this week
    const existing = await prisma.teamPowerup.findFirst({
        where: { teamId, weekId },
    });

    if (existing) {
        throw new Error("Team already has a powerup for this week");
    }

    // Transaction: Create TeamPowerup and mark offer as chosen
    await prisma.$transaction([
        prisma.teamPowerup.create({
            data: {
                teamId,
                powerupId,
                weekId,
                isConsumed: false,
            },
        }),
        prisma.teamPowerupOffer.update({
            where: { id: offer.id },
            data: { isChosen: true },
        }),
    ]);

    // Revalidate the week page
    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
}

export async function consumePowerup(formData: FormData) {
    const teamPowerupId = formData.get("teamPowerupId") as string;
    const leagueId = formData.get("leagueId") as string;
    const weekNumber = formData.get("weekNumber") as string;

    if (!teamPowerupId) {
        throw new Error("Missing teamPowerupId");
    }

    // Mark the powerup as consumed
    await prisma.teamPowerup.update({
        where: { id: teamPowerupId },
        data: { isConsumed: true },
    });

    // Revalidate the week page
    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
}
