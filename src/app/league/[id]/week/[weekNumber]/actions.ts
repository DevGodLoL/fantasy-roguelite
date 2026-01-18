"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- TRAIT DEFINITIONS ---
const TRAIT_DEFINITIONS: Record<string, any> = {
    HOT_HAND: { code: 'HOT_HAND', name: "Hot Hand", description: "In the zone! +10% Points.", kind: "multiplier", value: 1.1, duration: 1, rarity: "uncommon" },
    GENIUS: { code: 'GENIUS', name: "Genius", description: "High IQ play. +15% Points.", kind: "multiplier", value: 1.15, duration: 2, rarity: "rare" },
    CLUTCH: { code: 'CLUTCH', name: "Clutch", description: "Performs under pressure. +5 pts.", kind: "bonus_flat", value: 5.0, duration: 3, rarity: "epic" },
    LEGENDARY_AURA: { code: 'LEGENDARY_AURA', name: "Legendary Aura", description: "Permanent +2 pts.", kind: "bonus_flat", value: 2.0, duration: null, rarity: "legendary" },

    COLD: { code: 'COLD', name: "Cold Streak", description: "Sluggish. -10% Points.", kind: "multiplier", value: 0.9, duration: 1, rarity: "common" },
    SHOOK: { code: 'SHOOK', name: "Shook", description: "Confidence shattered. -20% Points.", kind: "multiplier", value: 0.8, duration: 2, rarity: "uncommon" },
    VULNERABLE: { code: 'VULNERABLE', name: "Vulnerable", description: "Prone to mistakes. -3 pts.", kind: "bonus_flat", value: -3.0, duration: 1, rarity: "common" },
};

// Check for new mutations based on performance
function checkMutations(playerId: string, points: number, leagueId: string, currentWeekNumber: number) {
    const mutations = [];

    // POSITIVE MUTATIONS
    if (points >= 25) {
        // High Score Chance
        const roll = Math.random();
        if (roll < 0.4) mutations.push(TRAIT_DEFINITIONS.HOT_HAND);
        else if (roll < 0.1) mutations.push(TRAIT_DEFINITIONS.GENIUS);
    }
    if (points >= 35) {
        // Elite Score Chance
        if (Math.random() < 0.05) mutations.push(TRAIT_DEFINITIONS.LEGENDARY_AURA);
        else mutations.push(TRAIT_DEFINITIONS.CLUTCH);
    }

    // NEGATIVE MUTATIONS
    if (points < 5 && points > -5) {
        // Low Score Chance (but not DNP 0)
        // Assume starters > 0 if they played.
        if (Math.random() < 0.25) mutations.push(TRAIT_DEFINITIONS.COLD);
    }
    if (points < 0) {
        // Negative points = Bad
        mutations.push(TRAIT_DEFINITIONS.SHOOK);
    }

    // Helper to format for DB
    return mutations.map(def => ({
        playerId,
        leagueId,
        code: def.code,
        name: def.name,
        description: def.description,
        rarity: def.rarity,
        kind: def.kind,
        value: def.value,
        expiresAtWeek: def.duration ? currentWeekNumber + def.duration : null
    }));
}

// Rarity weights (cumulative) for Packs
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

    // ... (Stats Logic Same as Before) but reduced boilerplate for readability ...
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

    if (Math.random() < 0.05) {
        stats.fumbles = 1;
        points -= 2;
    }

    return { points: parseFloat(points.toFixed(2)), stats };
};

/**
 * Simulate a week by generating individual player performances and summing them up
 */
export async function simulateWeek(leagueId: string, weekNumber: number) {
    try {
        console.log(`Starting simulation for league ${leagueId} week ${weekNumber}`);

        // 1. Get Week ID
        const weekRef = await db.week.findUnique({
            where: { leagueId_number: { leagueId, number: weekNumber } },
        });

        if (!weekRef) throw new Error("Week not found");

        const transactions = [];

        // 2. Fetch full data including TRAITS
        const week = await db.week.findUnique({
            where: { id: weekRef.id },
            include: {
                matchups: {
                    include: {
                        homeTeam: {
                            include: {
                                rosterSlots: {
                                    include: {
                                        player: {
                                            include: {
                                                traits: {
                                                    where: {
                                                        leagueId,
                                                        OR: [{ expiresAtWeek: null }, { expiresAtWeek: { gt: weekNumber } }]
                                                    }
                                                }
                                            }
                                        }
                                    },
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
                                    include: {
                                        player: {
                                            include: {
                                                traits: {
                                                    where: {
                                                        leagueId,
                                                        OR: [{ expiresAtWeek: null }, { expiresAtWeek: { gt: weekNumber } }]
                                                    }
                                                }
                                            }
                                        }
                                    },
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

        if (!week) throw new Error("Week data load failed");

        // Helper to process a team's performance
        const processTeam = (team: any) => {
            let total = 0;
            let fumbles = 0;

            for (const slot of team.rosterSlots) {
                if (slot.player) {
                    const { points: rawPoints, stats } = generateStats(slot.player.position);
                    let finalPoints = rawPoints;

                    // Apply ACTIVE TRAITS
                    if (slot.player.traits && slot.player.traits.length > 0) {
                        for (const trait of slot.player.traits) {
                            if (trait.kind === 'multiplier') finalPoints *= trait.value;
                            if (trait.kind === 'bonus_flat') finalPoints += trait.value;
                        }
                    }

                    if (slot.slotType !== "BENCH") {
                        total += finalPoints;
                    }
                    fumbles += stats.fumbles;

                    // Log Performance
                    transactions.push(
                        db.playerPerformance.upsert({
                            where: { playerId_weekId: { playerId: slot.player.id, weekId: week.id } },
                            create: { playerId: slot.player.id, weekId: week.id, points: finalPoints, ...stats },
                            update: { points: finalPoints, ...stats },
                        })
                    );

                    // Check for NEW MUTATIONS
                    const newMutations = checkMutations(slot.player.id, finalPoints, leagueId, weekNumber);
                    for (const m of newMutations) {
                        transactions.push(
                            db.playerTrait.create({ data: m })
                        );
                        // Notify League Log
                        transactions.push(
                            db.leagueTransaction.create({
                                data: {
                                    leagueId,
                                    teamId: team.id,
                                    playerId: slot.player.id,
                                    type: "TRAIT_GAINED", // Custom type
                                    description: `${slot.player.name} gained trait: ${m.name} (${m.description})`
                                }
                            })
                        );
                    }
                }
            }
            return { total, fumbles };
        };

        for (const matchup of week.matchups) {
            console.log(`Processing matchup ${matchup.id}`);

            const home = processTeam(matchup.homeTeam);
            const away = processTeam(matchup.awayTeam);

            let homeTotal = home.total;
            let awayTotal = away.total;
            let homeFumbles = home.fumbles;
            let awayFumbles = away.fumbles;

            // --- POWERUP LOGIC (Team Level) ---
            let homeMultiplier = 1.0;
            let homeBonus = 0;
            let awayMultiplier = 1.0;
            let awayBonus = 0;

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
                    if (p.code === "CURSE_OF_THE_FUMBLE" && p.value) {
                        awayBonus -= (awayFumbles * p.value);
                    }
                }
                transactions.push(db.teamPowerup.update({ where: { id: tp.id }, data: { isConsumed: true } }));
            }

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
        // Revalidate Logs
        revalidatePath(`/league/${leagueId}/transactions`);

        return { success: true };
    } catch (e: any) {
        console.error("Simulation failed:", e);
        return { success: false, error: e.message || "Unknown error" };
    }
}

// ... (Rest of file: advanceToNextWeek, swapLineupSlots unchanged)
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
