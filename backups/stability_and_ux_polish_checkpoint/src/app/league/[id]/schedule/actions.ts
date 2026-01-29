"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Generates a 14-week round-robin schedule for a league.
 * Uses a rotation algorithm to ensure fair matchups.
 */
export async function generateSchedule(leagueId: string) {
    // Check if schedule already exists
    const existingWeeks = await db.week.findMany({
        where: { leagueId },
    });

    if (existingWeeks.length > 0) {
        // Clear existing schedule first
        await db.matchup.deleteMany({ where: { leagueId } });
        await db.week.deleteMany({ where: { leagueId } });
    }

    // Get all teams in the league
    const teams = await db.team.findMany({
        where: { leagueId },
        orderBy: { createdAt: "asc" },
    });

    if (teams.length < 2) {
        throw new Error("Need at least 2 teams to create a schedule");
    }

    // --- APPLY ROGUELITE BONUSES & RESET ---
    for (const team of teams) {
        if (team.nextSeasonBonusGold > 0 || team.nextSeasonBonusRerolls > 0) {
            await db.team.update({
                where: { id: team.id },
                data: {
                    gold: { increment: team.nextSeasonBonusGold },
                    rerolls: { increment: team.nextSeasonBonusRerolls },
                    nextSeasonBonusGold: 0,
                    nextSeasonBonusRerolls: 0,
                    playoffSeed: null
                }
            });
        } else {
            // Just reset seed
            await db.team.update({
                where: { id: team.id },
                data: { playoffSeed: null }
            });
        }
    }

    // Reset league status
    await db.league.update({
        where: { id: leagueId },
        data: {
            seasonStatus: "regular",
            championTeamId: null,
            consolationWinnerId: null
        }
    });

    const numTeams = teams.length;
    const numWeeks = 14; // Standard NFL fantasy regular season

    // Create weeks
    const weeks = [];
    for (let w = 1; w <= numWeeks; w++) {
        const week = await db.week.create({
            data: {
                leagueId,
                number: w,
            },
        });
        weeks.push(week);
    }

    // Round-robin scheduling algorithm
    // For n teams, we need n-1 rounds to have everyone play everyone once
    // For 14 weeks with 10 teams, we'll do the full round-robin (9 weeks) + partial second round

    const teamIds = teams.map(t => t.id);

    // If odd number of teams, add a "bye" placeholder
    const scheduleTeams = [...teamIds];
    if (scheduleTeams.length % 2 !== 0) {
        scheduleTeams.push("BYE");
    }

    const n = scheduleTeams.length;
    const matchupsPerWeek = n / 2;

    // Generate all possible matchups using circle method
    const allRounds: { home: string; away: string }[][] = [];

    for (let round = 0; round < n - 1; round++) {
        const roundMatchups: { home: string; away: string }[] = [];

        for (let match = 0; match < matchupsPerWeek; match++) {
            const home = scheduleTeams[match];
            const away = scheduleTeams[n - 1 - match];

            // Skip bye weeks
            if (home !== "BYE" && away !== "BYE") {
                // Alternate home/away for fairness
                if (round % 2 === 0) {
                    roundMatchups.push({ home, away });
                } else {
                    roundMatchups.push({ home: away, away: home });
                }
            }
        }

        allRounds.push(roundMatchups);

        // Rotate: keep first element fixed, rotate the rest
        const last = scheduleTeams.pop()!;
        scheduleTeams.splice(1, 0, last);
    }

    // Create matchups for each week
    for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
        const week = weeks[weekIndex];
        // Cycle through rounds (repeat if necessary)
        const roundIndex = weekIndex % allRounds.length;
        const roundMatchups = allRounds[roundIndex];

        for (const { home, away } of roundMatchups) {
            await db.matchup.create({
                data: {
                    leagueId,
                    weekId: week.id,
                    homeTeamId: home,
                    awayTeamId: away,
                    status: "scheduled",
                },
            });
        }
    }

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/schedule`);

    return { success: true, weeksCreated: numWeeks };
}

/**
 * Get the current week based on schedule
 */
export async function getCurrentWeek(leagueId: string) {
    // Find the first week with scheduled matchups (not all final)
    const week = await db.week.findFirst({
        where: {
            leagueId,
            matchups: {
                some: {
                    status: { not: "final" },
                },
            },
        },
        orderBy: { number: "asc" },
        include: {
            matchups: {
                include: {
                    homeTeam: true,
                    awayTeam: true,
                },
            },
        },
    });

    return week;
}
