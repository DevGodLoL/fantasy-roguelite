"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateMissionProgress, BattleResults } from "@/lib/game-data/missions";
import {
    calculatePlayoffSeedings,
    initializePlayoffWeeks,
    generateWeek15Matchups,
    generateWeek16Matchups,
    generateWeek17Matchups,
    awardPlayoffRewards
} from "@/lib/game-data/playoffs";
import { simulateTeamPerformance } from "@/lib/game-logic/simulation";
import { checkMutations } from "@/lib/game-logic/mutations";
import { grantCommanderXP } from "@/lib/game-logic/progression";
import { createAutoCheckpoint } from "@/lib/server/backup-utils";

// --- HELPERS ---

const selectRarity = (): string => {
    const r = Math.random();
    if (r < 0.7) return "common";
    if (r < 0.9) return "rare";
    if (r < 0.99) return "epic";
    return "legendary";
};

export async function ensurePackOffers(leagueId: string, teamId: string, weekId: string) {
    if (!leagueId || !teamId || !weekId) return;

    const existingOffers = await db.teamPowerupOffer.findMany({
        where: { teamId, weekId },
        include: { powerup: true },
    });

    if (existingOffers.length > 0) return existingOffers;

    const currentWeek = await db.week.findUnique({ where: { id: weekId } });
    const isPlayoffs = currentWeek && currentWeek.number > 14;

    const allPowerups = await db.powerup.findMany({
        where: isPlayoffs ? {} : { isPlayoffOnly: false }
    });

    const selected: typeof allPowerups = [];
    const needed = 4;

    if (allPowerups.length <= needed) {
        selected.push(...allPowerups);
    } else {
        while (selected.length < needed) {
            const targetRarity = selectRarity();
            const candidates = allPowerups.filter(
                (p) => p.rarity === targetRarity && !selected.find((s) => s.id === p.id)
            );

            if (candidates.length > 0) {
                selected.push(candidates[Math.floor(Math.random() * candidates.length)]);
            } else {
                const anyCandidates = allPowerups.filter((p) => !selected.find((s) => s.id === p.id));
                if (anyCandidates.length > 0) {
                    selected.push(anyCandidates[Math.floor(Math.random() * anyCandidates.length)]);
                } else break;
            }
        }
    }

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

    revalidatePath(`/league/${leagueId}/week/${currentWeek?.number}`);
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

    const offer = await db.teamPowerupOffer.findFirst({
        where: { teamId, weekId, powerupId },
    });

    if (!offer) throw new Error("Invalid powerup selection");

    const existing = await db.teamPowerup.findFirst({
        where: { teamId, weekId },
    });

    if (existing) throw new Error("Already selected a powerup for this week");

    await db.$transaction([
        db.teamPowerup.create({
            data: { teamId, powerupId, weekId, isConsumed: false },
        }),
        db.teamPowerupOffer.update({
            where: { id: offer.id },
            data: { isChosen: true },
        }),
    ]);

    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
}

export async function rerollOffers(leagueId: string, teamId: string, weekId: string, weekNumber: number) {
    const team = await db.team.findUnique({
        where: { id: teamId },
        select: { rerolls: true }
    });

    if (!team || team.rerolls <= 0) return { success: false, error: "No rerolls available" };

    const existing = await db.teamPowerup.findFirst({ where: { teamId, weekId } });
    if (existing) return { success: false, error: "Already selected an artifact" };

    await db.teamPowerupOffer.deleteMany({ where: { teamId, weekId } });

    const isPlayoffs = weekNumber > 14;
    const allPowerups = await db.powerup.findMany({
        where: { type: 'card', isPlayoffOnly: isPlayoffs ? undefined : false }
    });

    const selected: typeof allPowerups = [];
    while (selected.length < 4 && selected.length < allPowerups.length) {
        const targetRarity = selectRarity();
        const candidates = allPowerups.filter(p => p.rarity === targetRarity && !selected.find(s => s.id === p.id));
        if (candidates.length > 0) {
            selected.push(candidates[Math.floor(Math.random() * candidates.length)]);
        } else {
            const any = allPowerups.filter(p => !selected.find(s => s.id === p.id));
            if (any.length > 0) selected.push(any[Math.floor(Math.random() * any.length)]);
        }
    }

    await db.$transaction([
        db.teamPowerupOffer.createMany({
            data: selected.map(p => ({ teamId, weekId, powerupId: p.id, isChosen: false }))
        }),
        db.team.update({
            where: { id: teamId },
            data: { rerolls: { decrement: 1 } }
        })
    ]);

    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
    return { success: true, rerollsRemaining: team.rerolls - 1 };
}

export async function consumePowerup(formData: FormData) {
    const teamPowerupId = formData.get("teamPowerupId") as string;
    const leagueId = formData.get("leagueId") as string;
    const weekNumber = formData.get("weekNumber") as string;

    await db.teamPowerup.update({
        where: { id: teamPowerupId },
        data: { isConsumed: true },
    });

    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
}

// --- CORE SIMULATION ---

export async function simulateWeek(leagueId: string, weekNumber: number) {
    try {
        console.log(`[SimulateWeek] League: ${leagueId}, Week: ${weekNumber}`);

        // Safety backup before complex simulation
        await createAutoCheckpoint(`simulate_floor_${weekNumber}`);

        const weekRef = await db.week.findUnique({
            where: { leagueId_number: { leagueId, number: weekNumber } },
        });
        if (!weekRef) throw new Error("Week not found");

        const week = await db.week.findUnique({
            where: { id: weekRef.id },
            include: {
                matchups: {
                    include: {
                        homeTeam: {
                            include: {
                                owner: { select: { id: true, unlockedTalents: true, experience: true, commanderLevel: true, talentPoints: true } },
                                rosterSlots: { include: { player: { include: { traits: { where: { leagueId, OR: [{ expiresAtWeek: null }, { expiresAtWeek: { gt: weekNumber } }] } } } } } },
                                powerups: { where: { OR: [{ weekId: weekRef.id }, { weekId: null }], isConsumed: false }, include: { powerup: true } }
                            },
                        },
                        awayTeam: {
                            include: {
                                owner: { select: { id: true, unlockedTalents: true, experience: true, commanderLevel: true, talentPoints: true } },
                                rosterSlots: { include: { player: { include: { traits: { where: { leagueId, OR: [{ expiresAtWeek: null }, { expiresAtWeek: { gt: weekNumber } }] } } } } } },
                                powerups: { where: { OR: [{ weekId: weekRef.id }, { weekId: null }], isConsumed: false }, include: { powerup: true } }
                            },
                        },
                    },
                },
            },
        });

        if (!week) throw new Error("Data load failed");

        const transactions: any[] = [];
        const battleResults: BattleResults[] = [];

        for (const matchup of week.matchups) {
            // Prepare with Talent Data
            const homeTeamSim = {
                ...(matchup.homeTeam as any),
                commanderTalents: JSON.parse((matchup.homeTeam.owner as any).unlockedTalents || "[]")
            };
            const awayTeamSim = {
                ...(matchup.awayTeam as any),
                commanderTalents: JSON.parse((matchup.awayTeam.owner as any).unlockedTalents || "[]")
            };

            // Run Core Engine
            const homeRes = await simulateTeamPerformance(homeTeamSim, awayTeamSim, weekNumber);
            const awayRes = await simulateTeamPerformance(awayTeamSim, homeTeamSim, weekNumber);

            // Combine logs for the Matchup Chronicle
            const combinedLogs = [
                ...homeRes.log.map(msg => `[${matchup.homeTeam.name}] ${msg}`),
                ...awayRes.log.map(msg => `[${matchup.awayTeam.name}] ${msg}`)
            ];

            // Persist Player Stats & Check Mutations
            const processPerfs = (team: any, res: any) => {
                for (const playerId in res.playerPerformances) {
                    const p = res.playerPerformances[playerId];
                    transactions.push(db.playerPerformance.upsert({
                        where: { playerId_weekId: { playerId, weekId: week.id } },
                        create: { playerId, weekId: week.id, points: p.points, ...p.stats },
                        update: { points: p.points, ...p.stats },
                    }));

                    const teamTalents = JSON.parse((team.owner as any).unlockedTalents || "[]");
                    const mutations = checkMutations(playerId, p.points, p.stats, team.rosterSlots.find((s: any) => s.playerId === playerId)?.player.position, leagueId, weekNumber, team.archetype, teamTalents);
                    for (const m of mutations) {
                        transactions.push(db.playerTrait.create({ data: m }));
                        transactions.push(db.leagueTransaction.create({
                            data: { leagueId, teamId: team.id, playerId, type: "TRAIT_GAINED", description: `${team.rosterSlots.find((s: any) => s.playerId === playerId)?.player.name} gained ${m.name}` }
                        }));
                    }
                }
            };

            processPerfs(matchup.homeTeam, homeRes);
            processPerfs(matchup.awayTeam, awayRes);

            // ... inside simulateWeek ...

            // Matchup Result
            const homeWon = homeRes.score > awayRes.score;
            transactions.push(db.matchup.update({
                where: { id: matchup.id },
                data: {
                    homeScore: homeRes.score,
                    awayScore: awayRes.score,
                    status: "final",
                    simulationLogs: JSON.stringify(combinedLogs)
                }
            }));

            // Team Updates (Gold) & Commander XP
            const finalizeTeam = async (team: any, won: boolean, res: any) => {
                const gold = Math.floor((won ? 50 : 20) * res.goldMultiplier) + res.bonusGold;
                transactions.push(db.team.update({
                    where: { id: team.id },
                    data: { gold: { increment: gold } }
                }));

                // Grant Commander XP to the user
                const xpAmount = 10 + (won ? 20 : 0);
                const talents = JSON.parse((team.owner as any).unlockedTalents || "[]") as string[];
                let rewardAmount = xpAmount;
                if (talents.includes('SCHOLAR')) {
                    rewardAmount = Math.ceil(xpAmount * 1.05);
                    combinedLogs.push(`[${team.name}] [Talent: Scholar] +5% XP gained`);
                }

                let newXP = team.owner.experience + rewardAmount;
                let newLevel = team.owner.commanderLevel;
                let newTalentPoints = team.owner.talentPoints;

                while (newXP >= 1000) { // LEVEL_CURVE
                    newXP -= 1000;
                    newLevel++;
                    newTalentPoints++;
                    combinedLogs.push(`[${team.name}] COMMANDER LEVEL UP! Reached Level ${newLevel}`);
                }

                transactions.push(db.user.update({
                    where: { id: team.ownerId },
                    data: {
                        experience: newXP,
                        commanderLevel: newLevel,
                        talentPoints: newTalentPoints
                    }
                }));

                // Expire used consumables
                transactions.push(db.teamPowerup.updateMany({
                    where: { teamId: team.id, weekId: week.id, powerup: { type: 'card' } },
                    data: { isConsumed: true }
                }));
            };

            await finalizeTeam(matchup.homeTeam, homeWon, homeRes);
            await finalizeTeam(matchup.awayTeam, !homeWon, awayRes);

            // Collect results for Mission Eval
            battleResults.push({
                totalScore: homeRes.score,
                opponentScore: awayRes.score,
                positionScores: homeRes.positionScores,
                highestPlayerScore: homeRes.highestPlayerScore
            });
            // We need to keep track of which team got which results for mission eval
            // so let's use a temporary map or array.
            (battleResults as any)[battleResults.length - 1].teamId = matchup.homeTeamId;

            battleResults.push({
                totalScore: awayRes.score,
                opponentScore: homeRes.score,
                positionScores: awayRes.positionScores,
                highestPlayerScore: awayRes.highestPlayerScore
            });
            (battleResults as any)[battleResults.length - 1].teamId = matchup.awayTeamId;
        }

        // Mission Evaluation
        const missions = await db.teamMission.findMany({
            where: { team: { leagueId }, isCompleted: false }
        });
        for (const tm of missions) {
            const res = battleResults.find((r: any) => r.teamId === tm.teamId);
            if (res) {
                // Construct a mission-like object for the evaluator from the embedded fields
                const missionDef = {
                    type: tm.type as any,
                    targetPosition: tm.targetPosition,
                    targetValue: tm.targetValue
                };
                const { progress, isCompleted } = calculateMissionProgress(missionDef as any, res as any);
                if (isCompleted) {
                    transactions.push(db.teamMission.update({ where: { id: tm.id }, data: { isCompleted: true, progress: 100 } }));
                    if (tm.rewardType === 'gold') {
                        transactions.push(db.team.update({ where: { id: tm.teamId }, data: { gold: { increment: tm.rewardValue } } }));
                    } else if (tm.rewardType === 'rerolls') {
                        transactions.push(db.team.update({ where: { id: tm.teamId }, data: { rerolls: { increment: tm.rewardValue } } }));
                    }
                } else if (progress > tm.progress) {
                    transactions.push(db.teamMission.update({ where: { id: tm.id }, data: { progress } }));
                }
            }
        }

        await db.$transaction(transactions);

        // Playoff Logic
        if (weekNumber === 14) {
            await calculatePlayoffSeedings(leagueId);
            await initializePlayoffWeeks(leagueId);
            await generateWeek15Matchups(leagueId);
        } else if (weekNumber === 15) await generateWeek16Matchups(leagueId);
        else if (weekNumber === 16) await generateWeek17Matchups(leagueId);
        else if (weekNumber === 17) await awardPlayoffRewards(leagueId);

        // Advance Week - We don't have a currentWeek field on League, 
        // the state is derived from matchups. We might want to update seasonStatus though.
        if (weekNumber === 17) {
            await db.league.update({
                where: { id: leagueId },
                data: { seasonStatus: "complete" },
            });
        }

        revalidatePath(`/league/${leagueId}`);
        return { success: true };
    } catch (e: any) {
        console.error("[SimulateWeek] Error:", e);
        return { success: false, error: e.message || "Temporal anomaly detected" };
    }
}

export async function advanceToNextWeek(leagueId: string, currentWeekNumber: number) {
    const nextWeek = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: currentWeekNumber + 1 } },
    });
    if (!nextWeek) throw new Error("No more weeks");
    revalidatePath(`/league/${leagueId}/week/${currentWeekNumber + 1}`);
    return { success: true, nextWeekNumber: currentWeekNumber + 1 };
}

export async function swapLineupSlots(leagueId: string, weekNumber: number, fromSlotId: string, toSlotId: string) {
    const [fromSlot, toSlot] = await Promise.all([
        db.rosterSlot.findUnique({ where: { id: fromSlotId } }),
        db.rosterSlot.findUnique({ where: { id: toSlotId } }),
    ]);

    if (!fromSlot || !toSlot || fromSlot.teamId !== toSlot.teamId) throw new Error("Invalid swap");

    await db.$transaction([
        db.rosterSlot.update({ where: { id: fromSlotId }, data: { playerId: toSlot.playerId } }),
        db.rosterSlot.update({ where: { id: toSlotId }, data: { playerId: fromSlot.playerId } }),
    ]);

    revalidatePath(`/league/${leagueId}/week/${weekNumber}`);
    return { success: true };
}
