import "dotenv/config";
import { PrismaClient } from "../src/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { execSync } from "child_process";

// REPLICATED SCORING LOGIC
function computeEffectiveScore(
    stats: { passYds: number; rushYds: number; recYds: number },
    powerup: { code: string; value: number | null } | null
): number {
    const base = stats.passYds + stats.rushYds + stats.recYds;
    if (!powerup) return base;

    let effPass = stats.passYds;
    let effRush = stats.rushYds;
    let effRec = stats.recYds;
    let bonus = 0;

    if (powerup.code === "PASS_YDS_X15") {
        effPass = stats.passYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "RUSH_YDS_X15") {
        effRush = stats.rushYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "REC_YDS_X15") {
        effRec = stats.recYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "PLUS_10") {
        bonus = 10;
    }

    return effPass + effRush + effRec + bonus;
}

// Helpers must accept prisma instance to avoid global state / lock collision
async function ensurePowerupAvailable(prisma: PrismaClient, teamId: string, weekId: string, code: string) {
    const existing = await prisma.teamPowerupOffer.findFirst({
        where: { teamId, weekId, powerup: { code } }
    });
    if (existing) return existing;

    const p = await prisma.powerup.findUniqueOrThrow({ where: { code } });
    return await prisma.teamPowerupOffer.create({
        data: {
            teamId,
            weekId,
            powerupId: p.id,
            isChosen: false
        }
    });
}

async function selectPowerup(prisma: PrismaClient, teamId: string, weekId: string, offerId: string, powerupId: string) {
    await prisma.$transaction([
        prisma.teamPowerup.create({
            data: { teamId, weekId, powerupId, isConsumed: false }
        }),
        prisma.teamPowerupOffer.update({
            where: { id: offerId },
            data: { isChosen: true }
        })
    ]);
}

async function consumePowerup(prisma: PrismaClient, teamId: string, weekId: string) {
    await prisma.teamPowerup.updateMany({
        where: { teamId, weekId },
        data: { isConsumed: true }
    });
}

async function main() {
    let prisma: PrismaClient | null = null;

    try {
        // 1. Run Seed (if needed) - BEFORE connecting Prisma to avoid locking the DB
        if (!process.env.SKIP_SEED) {
            console.log("🔄 Resetting data via npm run seed...");
            // execSync runs in a child process. If we initialize Prisma here, it will lock the file.
            execSync("npm run seed", { stdio: "inherit" });
        } else {
            console.log("⏭️ Skipping seed...");
        }

        // 2. Init Prisma (Adapter) - AFTER seed child process is finished
        const url = process.env.DATABASE_URL;
        if (!url || url.trim() === "") {
            throw new Error("DATABASE_URL is missing or empty. Ensure .env exists.");
        }
        const adapter = new PrismaBetterSqlite3({ url });
        prisma = new PrismaClient({ adapter });

        console.log("\n🔍 Verifying Stat-Based Scoring Logic...");

        // 3. Context setup
        const teamA = await prisma.team.findFirstOrThrow({ where: { name: "Team A" } });
        const week1 = await prisma.week.findFirstOrThrow({ where: { number: 1 } });

        // CLEANUP (Idempotency)
        console.log("   [cleanup] Resetting state for Team A / Week 1...");
        await prisma.teamPowerup.deleteMany({ where: { teamId: teamA.id, weekId: week1.id } });
        await prisma.teamPowerupOffer.deleteMany({ where: { teamId: teamA.id, weekId: week1.id } });
        await prisma.teamWeekStats.deleteMany({ where: { teamId: teamA.id, weekId: week1.id } });

        // SETUP STATS (Deterministic)
        // Team A: 100 Pass / 40 Rush / 60 Rec = 200 Base
        await prisma.teamWeekStats.create({
            data: {
                teamId: teamA.id,
                weekId: week1.id,
                passYds: 100,
                rushYds: 40,
                recYds: 60
            }
        });
        const stats = { passYds: 100, rushYds: 40, recYds: 60 };
        const baseScore = 200;
        console.log(`   Base Stats: 100/40/60 (Sum: ${baseScore})`);

        // TEST PERSISTENT OFFERS
        console.log("   Testing Persistent Offers...");
        const p1 = await prisma.powerup.findUniqueOrThrow({ where: { code: "PLUS_10" } });
        const p1Offer = await prisma.teamPowerupOffer.create({
            data: { teamId: teamA.id, weekId: week1.id, powerupId: p1.id }
        });

        const offersFetch1 = await prisma.teamPowerupOffer.findMany({ where: { teamId: teamA.id, weekId: week1.id } });
        const offersFetch2 = await prisma.teamPowerupOffer.findMany({ where: { teamId: teamA.id, weekId: week1.id } });
        if (offersFetch1.length !== offersFetch2.length || offersFetch1[0].id !== offersFetch2[0].id) {
            throw new Error("Persistence check failed: Offers changed between fetches");
        }
        console.log("     ✅ Offers are persistent");

        // TEST CASES
        const cases = [
            { code: "PLUS_10", expected: 210 },
            { code: "PASS_YDS_X15", expected: 250 },
            { code: "RUSH_YDS_X15", expected: 220 },
            { code: "REC_YDS_X15", expected: 230 },
        ];

        for (const c of cases) {
            console.log(`   Testing ${c.code}...`);

            // 1. Ensure Offer
            const offer = await ensurePowerupAvailable(prisma, teamA.id, week1.id, c.code);

            // 2. Select
            await selectPowerup(prisma, teamA.id, week1.id, offer.id, offer.powerupId);

            // 3. Verify Active Score
            const active = await prisma.teamPowerup.findFirstOrThrow({
                where: { teamId: teamA.id, weekId: week1.id },
                include: { powerup: true }
            });

            const actual = computeEffectiveScore(stats, active.powerup);
            if (actual !== c.expected) {
                throw new Error(`Failed ${c.code}: Expected ${c.expected}, got ${actual}`);
            }
            console.log(`     ✅ Score Match: ${actual}`);

            // 4. Consume & Verify Reset
            await consumePowerup(prisma, teamA.id, week1.id);
            const consumed = await prisma.teamPowerup.findFirstOrThrow({
                where: { teamId: teamA.id, weekId: week1.id },
                include: { powerup: true }
            });

            const scoreConsumed = computeEffectiveScore(stats, consumed.isConsumed ? null : consumed.powerup);
            if (scoreConsumed !== baseScore) {
                throw new Error(`Failed Consume Logic ${c.code}: Expected ${baseScore}, got ${scoreConsumed}`);
            }
            console.log(`     ✅ Consumed Reset: ${scoreConsumed}`);

            // Cleanup for next loop
            await prisma.teamPowerup.deleteMany({ where: { teamId: teamA.id, weekId: week1.id } });
            await prisma.teamPowerupOffer.deleteMany({ where: { teamId: teamA.id, weekId: week1.id } });
        }

        console.log("\n✅ ALL CHECKS PASSED");

    } catch (e) {
        console.error("\n❌ VERIFICATION FAILED:", e);
        process.exitCode = 1;
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

main();
