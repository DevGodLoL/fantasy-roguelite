import { db } from "@/lib/prisma";

export const LEVEL_CURVE = 1000; // XP per level (linear for now)

export interface CommanderProfile {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    totalXP: number;
    progressPercent: number;
}

export async function getCommanderProfile(userId: string): Promise<CommanderProfile> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { commanderLevel: true, experience: true }
    });

    if (!user) throw new Error("Commander not found");

    // Calculate level based on total XP (if we want to re-verify)
    // For now, trust the DB, but calc progress
    const level = user.commanderLevel;
    const currentXP = user.experience;
    const nextLevelXP = LEVEL_CURVE; // Fixed curve for MVP
    const progressPercent = Math.min(100, Math.floor((currentXP / nextLevelXP) * 100));

    return {
        level,
        currentXP,
        nextLevelXP,
        totalXP: (level - 1) * LEVEL_CURVE + currentXP,
        progressPercent
    };
}

export async function grantCommanderXP(userId: string, amount: number) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Apply Talent Bonuses (Scholar +5% XP)
    const talents = JSON.parse(user.unlockedTalents || "[]") as string[];
    let rewardAmount = amount;
    if (talents.includes('SCHOLAR')) {
        rewardAmount = Math.ceil(amount * 1.05);
    }

    let newXP = user.experience + rewardAmount;
    let newLevel = user.commanderLevel;
    let newTalentPoints = user.talentPoints;

    // Level Up Logic
    while (newXP >= LEVEL_CURVE) {
        newXP -= LEVEL_CURVE;
        newLevel++;
        newTalentPoints++; // Award 1 point per level
    }

    await db.user.update({
        where: { id: userId },
        data: {
            commanderLevel: newLevel,
            experience: newXP,
            talentPoints: newTalentPoints
        }
    });

    return {
        newLevel,
        newXP,
        leveledUp: newLevel > user.commanderLevel,
        addedTalentPoints: newLevel - user.commanderLevel
    };
}
