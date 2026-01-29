"use server";

import { db } from "@/lib/prisma";
import { calculateSeasonScore } from "@/lib/game-logic/scoring";
import { grantCommanderXP } from "@/lib/game-logic/progression";
import { revalidatePath } from "next/cache";

export async function claimSeasonRewards(leagueId: string, teamId: string) {
    const team = await db.team.findUnique({
        where: { id: teamId }
    });

    if (!team) throw new Error("Team not found");
    if (team.rewardsClaimed) throw new Error("Rewards already claimed");

    // 1. Calculate Score & XP
    const scoreData = await calculateSeasonScore(leagueId, teamId);

    // 2. Grant XP to User
    const result = await grantCommanderXP(team.ownerId, scoreData.prestigeXP);

    // 3. Mark as Claimed
    await db.team.update({
        where: { id: teamId },
        data: { rewardsClaimed: true }
    });

    revalidatePath(`/league/${leagueId}/hall-of-valor`);
    return result;
}
