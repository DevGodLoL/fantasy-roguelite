"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTalentByCode } from "@/lib/game-data/talents";

export async function unlockTalent(userId: string, talentCode: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            commanderLevel: true,
            talentPoints: true,
            unlockedTalents: true
        }
    });

    if (!user) throw new Error("Commander not found");

    const talent = getTalentByCode(talentCode);
    if (!talent) throw new Error("Invalid talent code");

    // 1. Check Points
    if (user.talentPoints < talent.pointsToUnlock) {
        throw new Error("Insufficient talent points");
    }

    // 2. Check Level
    if (user.commanderLevel < talent.levelRequired) {
        throw new Error(`Requires Commander Level ${talent.levelRequired}`);
    }

    // 3. Check Dependencies
    const currentTalents = JSON.parse(user.unlockedTalents || "[]") as string[];
    if (currentTalents.includes(talentCode)) {
        throw new Error("Talent already unlocked");
    }

    if (talent.dependencies) {
        const met = talent.dependencies.every(dep => currentTalents.includes(dep));
        if (!met) throw new Error(`Dependencies not met: ${talent.dependencies.join(", ")}`);
    }

    // 4. Persistence
    const updatedTalents = [...currentTalents, talentCode];

    await db.user.update({
        where: { id: userId },
        data: {
            unlockedTalents: JSON.stringify(updatedTalents),
            talentPoints: { decrement: talent.pointsToUnlock }
        }
    });

    revalidatePath("/commander");
    return { success: true, unlockedTalents: updatedTalents };
}

export async function resetTalents(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { commanderLevel: true }
    });

    if (!user) throw new Error("Commander not found");

    // Refund points based on level (1 per level starting at 2)
    // Points = level - 1
    const totalPoints = Math.max(0, user.commanderLevel - 1);

    await db.user.update({
        where: { id: userId },
        data: {
            unlockedTalents: "[]",
            talentPoints: totalPoints
        }
    });

    revalidatePath("/commander");
    return { success: true };
}
