"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function resetLeagueDatabase(leagueId: string) {
    try {
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
