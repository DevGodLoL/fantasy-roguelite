"use server";

import { db } from "@/lib/prisma";
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
    const existingOffers = await db.teamPowerupOffer.findMany({
        where: { teamId, weekId },
        include: { powerup: true },
    });

    if (existingOffers.length > 0) {
        return existingOffers;
    }

    // 2. Fetch all powerups
    const allPowerups = await db.powerup.findMany();

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
        await db.teamPowerupOffer.createMany({
            data: selected.map((p) => ({
                teamId,
                weekId,
                powerupId: p.id,
                isChosen: false,
            })),
        });
    }

    revalidatePath(`/league/${leagueId}/week/${(await db.week.findUnique({ where: { id: weekId } }))?.number}`);
    return await db.teamPowerupOffer.findMany({
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
    const offer = await db.teamPowerupOffer.findFirst({
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
    const existing = await db.teamPowerup.findFirst({
        where: { teamId, weekId },
    });

    if (existing) {
        throw new Error("Team already has a powerup for this week");
    }

    // Transaction: Create TeamPowerup and mark offer as chosen
    await db.$transaction([
        db.teamPowerup.create({
            data: {
                teamId,
                powerupId,
                weekId,
                isConsumed: false,
            },
        }),
        db.teamPowerupOffer.update({
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
    await db.teamPowerup.update({
        where: { id: teamPowerupId },
        data: { isConsumed: true },
    });

    // Revalidate the week page
    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
}

/**
 * Simulate a week by generating individual player performances and summing them up
 */
// Helper to generate random player stats based on position
const generateStats = (pos: string) => {
    let points = 0;
    let stats = { passYds: 0, rushYds: 0, recYds: 0, tds: 0, fumbles: 0 };

    switch (pos) {
        case "QB":
            stats.passYds = Math.floor(Math.random() * 250 + 150);
            stats.rushYds = Math.floor(Math.random() * 40);
            stats.tds = Math.floor(Math.random() * 3);
            points = (stats.passYds * 0.04) + (stats.rushYds * 0.1) + (stats.tds * 4);
            break;
        case "RB":
            stats.rushYds = Math.floor(Math.random() * 100 + 40);
            stats.recYds = Math.floor(Math.random() * 30);
            stats.tds = Math.floor(Math.random() * 2);
            points = (stats.rushYds * 0.1) + (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "WR":
            stats.recYds = Math.floor(Math.random() * 110 + 30);
            stats.tds = Math.floor(Math.random() * 2);
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "TE":
            stats.recYds = Math.floor(Math.random() * 70 + 10);
            stats.tds = Math.random() > 0.7 ? 1 : 0;
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        default:
            points = Math.random() * 15 + 5;
    }

    // Random fumble chance (5% per player)
    if (Math.random() < 0.05) {
        stats.fumbles = 1;
        points -= 2; // Standard fumble penalty
    }

    return { points: parseFloat(points.toFixed(2)), stats };
};

/**
 * Simulate a week by generating individual player performances and summing them up
 */
export async function simulateWeek(leagueId: string, weekNumber: number) {
    try {
        console.log(`Starting simulation for league ${leagueId} week ${weekNumber}`);

        // 1. Get Week ID first to filter powerups
        const weekRef = await db.week.findUnique({
            where: { leagueId_number: { leagueId, number: weekNumber } },
        });

        if (!weekRef) {
            console.error("Week not found (weekRef is null)");
            throw new Error("Week not found");
        }
        console.log(`Found weekRef: ${weekRef.id}`);

        // 2. Fetch full data
        const week = await db.week.findUnique({
            where: { id: weekRef.id },
            include: {
                matchups: {
                    include: {
                        homeTeam: {
                            include: {
                                rosterSlots: {
                                    include: { player: true },
                                },
                                powerups: {
                                    where: { weekId: weekRef.id, isConsumed: false },
                                    include: { powerup: true }
                                }
                            },
                        },
                        awayTeam: {
                            include: {
                                rosterSlots: {
                                    include: { player: true },
                                },
                                powerups: {
                                    where: { weekId: weekRef.id, isConsumed: false },
                                    include: { powerup: true }
                                }
                            },
                        },
                    },
                },
            },
        });

        if (!week) {
            console.error("Week data load failed (week is null)");
            throw new Error("Week data load failed");
        }
        console.log(`Fetched week with ${week.matchups.length} matchups`);

        const transactions = [];

        for (const matchup of week.matchups) {
            console.log(`Processing matchup ${matchup.id}`);
            let homeTotal = 0;
            let awayTotal = 0;

            // Track stats for penalty calculation (e.g. fumbles)
            let homeFumbles = 0;
            let awayFumbles = 0;

            // --- HOME TEAM STATS ---
            for (const slot of matchup.homeTeam.rosterSlots) {
                if (slot.player) {
                    const { points, stats } = generateStats(slot.player.position);
                    if (slot.slotType !== "BENCH") {
                        homeTotal += points;
                    }
                    homeFumbles += stats.fumbles;

                    transactions.push(
                        db.playerPerformance.upsert({
                            where: { playerId_weekId: { playerId: slot.player.id, weekId: week.id } },
                            create: { playerId: slot.player.id, weekId: week.id, points, ...stats },
                            update: { points, ...stats },
                        })
                    );
                }
            }

            // --- AWAY TEAM STATS ---
            for (const slot of matchup.awayTeam.rosterSlots) {
                if (slot.player) {
                    const { points, stats } = generateStats(slot.player.position);
                    if (slot.slotType !== "BENCH") {
                        awayTotal += points;
                    }
                    awayFumbles += stats.fumbles;

                    transactions.push(
                        db.playerPerformance.upsert({
                            where: { playerId_weekId: { playerId: slot.player.id, weekId: week.id } },
                            create: { playerId: slot.player.id, weekId: week.id, points, ...stats },
                            update: { points, ...stats },
                        })
                    );
                }
            }

            // --- POWERUP LOGIC ---
            let homeMultiplier = 1.0;
            let homeBonus = 0;
            let awayMultiplier = 1.0;
            let awayBonus = 0;

            console.log(`Home powerups: ${matchup.homeTeam.powerups.length}`);
            // Apply Home Powerups
            for (const tp of matchup.homeTeam.powerups) {
                const p = tp.powerup;
                if (p.scope === "self") {
                    if (p.kind === "multiplier" && p.value) homeMultiplier *= p.value;
                    if (p.kind === "bonus_points" && p.value) homeBonus += p.value;
                } else if (p.scope === "opponent") {
                    if (p.kind === "penalty" && p.value && p.code !== "CURSE_OF_THE_FUMBLE") {
                        awayBonus -= p.value; // Generic penalty
                    }
                    // Specific Logic: Fumble Curse
                    if (p.code === "CURSE_OF_THE_FUMBLE" && p.value) {
                        awayBonus -= (awayFumbles * p.value);
                    }
                }
                // Mark consumed
                transactions.push(db.teamPowerup.update({ where: { id: tp.id }, data: { isConsumed: true } }));
            }

            console.log(`Away powerups: ${matchup.awayTeam.powerups.length}`);
            // Apply Away Powerups
            for (const tp of matchup.awayTeam.powerups) {
                const p = tp.powerup;
                if (p.scope === "self") {
                    if (p.kind === "multiplier" && p.value) awayMultiplier *= p.value;
                    if (p.kind === "bonus_points" && p.value) awayBonus += p.value;
                } else if (p.scope === "opponent") {
                    if (p.kind === "penalty" && p.value && p.code !== "CURSE_OF_THE_FUMBLE") {
                        homeBonus -= p.value;
                    }
                    if (p.code === "CURSE_OF_THE_FUMBLE" && p.value) {
                        homeBonus -= (homeFumbles * p.value);
                    }
                }
                // Mark consumed
                transactions.push(db.teamPowerup.update({ where: { id: tp.id }, data: { isConsumed: true } }));
            }

            // Calculate Final Scores
            homeTotal = (homeTotal * homeMultiplier) + homeBonus;
            awayTotal = (awayTotal * awayMultiplier) + awayBonus;

            // Update Matchup
            transactions.push(
                db.matchup.update({
                    where: { id: matchup.id },
                    data: {
                        homeScore: parseFloat(Math.max(0, homeTotal).toFixed(2)),
                        awayScore: parseFloat(Math.max(0, awayTotal).toFixed(2)),
                        status: "final",
                    },
                })
            );
        }

        console.log(`Executing ${transactions.length} transactions`);
        await db.$transaction(transactions);

        revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
        revalidatePath(`/league/${leagueId}/schedule`);

        return { success: true };
    } catch (e: any) {
        console.error("Simulation failed:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}

/**
 * Advance to the next week
 */
export async function advanceToNextWeek(leagueId: string, currentWeekNumber: number) {
    const nextWeek = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: currentWeekNumber + 1 } },
    });

    if (!nextWeek) {
        throw new Error("No more weeks in the season");
    }

    revalidatePath(`/league/${leagueId}/week/${currentWeekNumber + 1}`);
    return { success: true, nextWeekNumber: currentWeekNumber + 1 };
}

/**
 * Swap players between two roster slots
 */
export async function swapLineupSlots(
    leagueId: string,
    weekNumber: number,
    fromSlotId: string,
    toSlotId: string
) {
    // Fetch slots with player details to verify positions
    const [fromSlot, toSlot] = await Promise.all([
        db.rosterSlot.findUnique({ where: { id: fromSlotId }, include: { player: true } }),
        db.rosterSlot.findUnique({ where: { id: toSlotId }, include: { player: true } }),
    ]);

    if (!fromSlot || !toSlot) {
        throw new Error("One or both slots not found");
    }

    // Ensure they belong to the same team
    if (fromSlot.teamId !== toSlot.teamId) {
        throw new Error("Cannot swap players between different teams");
    }

    // HELPER: Check if player fits in slot
    const canFit = (player: { position: string } | null, slotType: string) => {
        if (!player) return true;
        if (slotType === "BENCH") return true;
        if (slotType === "FLEX") return ["RB", "WR", "TE"].includes(player.position);
        return slotType === player.position;
    };

    // Validate Move
    if (!canFit(fromSlot.player, toSlot.slotType)) {
        throw new Error(`Cannot move ${fromSlot.player?.name} (${fromSlot.player?.position}) to ${toSlot.slotType} slot.`);
    }
    if (!canFit(toSlot.player, fromSlot.slotType)) {
        throw new Error(`Cannot move ${toSlot.player?.name} (${toSlot.player?.position}) to ${fromSlot.slotType} slot.`);
    }

    // Perform the swap
    await db.$transaction([
        db.rosterSlot.update({
            where: { id: fromSlotId },
            data: { playerId: toSlot.playerId },
        }),
        db.rosterSlot.update({
            where: { id: toSlotId },
            data: { playerId: fromSlot.playerId },
        }),
    ]);

    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
    return { success: true };
}
