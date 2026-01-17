"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Submits a new waiver claim for a player.
 * If the team is full, they MUST specify a dropPlayerId.
 */
export async function submitWaiverClaim(
    leagueId: string,
    teamId: string,
    playerId: string,
    bidAmount: number,
    dropPlayerId?: string
) {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { faabBalance: true },
    });

    if (!team) throw new Error("Team not found.");
    if (bidAmount < 0) throw new Error("Bid cannot be negative.");
    if (bidAmount > team.faabBalance) throw new Error("Insufficient FAAB funds.");

    // Check if player is already rostered
    const isRostered = await prisma.rosterSlot.findFirst({
        where: { playerId, team: { leagueId } },
    });
    if (isRostered) throw new Error("Player is already on a team.");

    // Create the claim
    await prisma.waiverClaim.create({
        data: {
            teamId,
            playerId,
            dropPlayerId,
            bidAmount,
            status: "pending",
        },
    });

    revalidatePath(`/league/${leagueId}/waivers`);
}

/**
 * Processes all pending waiver claims for a league.
 * This is "The Waiver Run".
 */
export async function processWaivers(leagueId: string) {
    // 1. Fetch all pending claims for this league
    const claims = await prisma.waiverClaim.findMany({
        where: {
            status: "pending",
            team: { leagueId },
        },
        include: {
            team: true,
            playerToAdd: true,
            playerToDrop: true,
        },
        orderBy: [
            { bidAmount: "desc" },
            { team: { waiverPriority: "asc" } },
            { createdAt: "asc" },
        ],
    });

    if (claims.length === 0) return { message: "No pending claims found." };

    const results = [];
    const processedPlayerIds = new Set<string>();

    for (const claim of claims) {
        // If player was already awarded in this run, skip
        if (processedPlayerIds.has(claim.playerId)) {
            await prisma.waiverClaim.update({
                where: { id: claim.id },
                data: { status: "failed", reason: "Player already claimed by higher bid." },
            });
            continue;
        }

        // Refresh team data (FAAB might have changed during this loop)
        const currentTeam = await prisma.team.findUnique({
            where: { id: claim.teamId },
            include: { rosterSlots: true },
        });

        if (!currentTeam) continue;

        // Check FAAB again
        if (claim.bidAmount > currentTeam.faabBalance) {
            await prisma.waiverClaim.update({
                where: { id: claim.id },
                data: { status: "failed", reason: "Insufficient FAAB balance." },
            });
            continue;
        }

        // Handle Drop-to-Add logic
        let targetSlot;
        if (claim.dropPlayerId) {
            targetSlot = await prisma.rosterSlot.findFirst({
                where: { teamId: claim.teamId, playerId: claim.dropPlayerId }
            });
            if (!targetSlot) {
                await prisma.waiverClaim.update({
                    where: { id: claim.id },
                    data: { status: "failed", reason: "Drop player no longer on roster." }
                });
                continue;
            }
        } else {
            // Find an empty slot
            targetSlot = await prisma.rosterSlot.findFirst({
                where: { teamId: claim.teamId, playerId: null, slotType: { in: [claim.playerToAdd.position, "FLEX", "BENCH"] } },
                orderBy: { isStarter: "desc" }
            });

            if (!targetSlot) {
                await prisma.waiverClaim.update({
                    where: { id: claim.id },
                    data: { status: "failed", reason: "No roster space available. Use drop-to-add." }
                });
                continue;
            }
        }

        // Execute the claim
        try {
            await prisma.$transaction(async (tx) => {
                // Deduct FAAB
                await tx.team.update({
                    where: { id: claim.teamId },
                    data: { faabBalance: { decrement: claim.bidAmount } }
                });

                // Update Slot
                await tx.rosterSlot.update({
                    where: { id: targetSlot.id },
                    data: { playerId: claim.playerId }
                });

                // Mark claim successful
                await tx.waiverClaim.update({
                    where: { id: claim.id },
                    data: { status: "successful", processedAt: new Date() }
                });

                // Rotate Waiver Priority for this team (move to back)
                // Need a way to move them to the end of the line...
                // Simple logic: find max priority and set this team to max + 1
                const maxPriority = await tx.team.aggregate({
                    where: { leagueId },
                    _max: { waiverPriority: true }
                });

                await tx.team.update({
                    where: { id: claim.teamId },
                    data: { waiverPriority: (maxPriority._max.waiverPriority || 0) + 1 }
                });
            });

            processedPlayerIds.add(claim.playerId);
            results.push(`Successfully added ${claim.playerToAdd.name} to ${claim.team.name} for $${claim.bidAmount}.`);
        } catch (e) {
            console.error("Waiver transaction failed:", e);
        }
    }

    revalidatePath(`/league/${leagueId}/waivers`);
    return { results };
}

export async function cancelClaim(claimId: string, leagueId: string) {
    await prisma.waiverClaim.delete({ where: { id: claimId } });
    revalidatePath(`/league/${leagueId}/waivers`);
}
