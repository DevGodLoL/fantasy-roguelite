"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAutoCheckpoint } from "@/lib/server/backup-utils";
import { validateLeagueHealth } from "@/lib/server/schedule-validator";
import { generateSchedule } from "../schedule/actions";

export async function resetLeagueDatabase(leagueId: string) {
    try {
        // Create safety checkpoint before erasure
        await createAutoCheckpoint('reset_narrative');

        // Clear dependent data
        await db.teamPowerupOffer.deleteMany({ where: { week: { leagueId } } });
        await db.teamPowerup.deleteMany({ where: { team: { leagueId } } });
        await db.playerPerformance.deleteMany({ where: { week: { leagueId } } });
        await db.teamWeekStats.deleteMany({ where: { week: { leagueId } } });
        await db.teamMission.deleteMany({ where: { team: { leagueId } } });

        // Finalize matchups and reset everything to Week 1 state
        await db.matchup.updateMany({
            where: { leagueId },
            data: {
                status: 'scheduled',
                homeScore: 0,
                awayScore: 0,
                simulationLogs: null
            }
        });

        // Reset teams
        await db.team.updateMany({
            where: { leagueId },
            data: {
                gold: 100,
                rerolls: 1,
                rewardsClaimed: false,
                playoffSeed: null
            }
        });

        revalidatePath(`/league/${leagueId}`);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function getLeagueHealth(leagueId: string) {
    try {
        return await validateLeagueHealth(leagueId);
    } catch (error) {
        console.error("Failed to validate health:", error);
        throw new Error("Validation failed.");
    }
}

export async function repairLeagueSchedule(leagueId: string) {
    try {
        // Create a safety checkpoint before manual repair
        await createAutoCheckpoint('manual_repair');

        // Re-run schedule generation for missing weeks/matchups
        await generateSchedule(leagueId);

        revalidatePath(`/league/${leagueId}/admin`);
        return { success: true };
    } catch (error) {
        console.error("Failed to repair schedule:", error);
        throw new Error("Repair failed.");
    }
}
