import { db } from '../src/lib/prisma';

// Re-implementing the core logic to test it in isolation
async function testBestAvailablePlayer(teamNeeds: any, round: number) {
    // Mock Drafted Players (Top 5 roughly)
    const draftedNames = ["Christian McCaffrey", "CeeDee Lamb", "Tyreek Hill"];

    // Fetch candidates
    const candidates = await db.player.findMany({
        where: { name: { notIn: draftedNames } },
        orderBy: { adp: "asc" },
        take: 30,
    });

    const filledCounts = teamNeeds; // { QB: 0, RB: 1... }
    let starerSlotsFilled = 0;
    // rough estimate of starters filled
    if (filledCounts['QB'] > 0) starerSlotsFilled++;
    if (filledCounts['RB'] >= 2) starerSlotsFilled += 2; else starerSlotsFilled += filledCounts['RB'];
    if (filledCounts['WR'] >= 2) starerSlotsFilled += 2; else starerSlotsFilled += filledCounts['WR'];
    if (filledCounts['TE'] > 0) starerSlotsFilled++;

    const REQUIRED = { QB: 1, RB: 2, WR: 2, TE: 1, DST: 1, K: 1 };

    let bestPlayer = null;
    let maxScore = -Infinity;

    console.log(`\n--- Simulating Round ${round} Pick ---`);
    console.log(`Team Has: ${JSON.stringify(filledCounts)}`);

    for (const p of candidates) {
        let score = (200 - p.adp);
        let needMultiplier = 1.0;

        const currentCount = filledCounts[p.position] || 0;
        const required = REQUIRED[p.position as keyof typeof REQUIRED] || 0;
        const isStarterNeeded = currentCount < required;

        if (p.position === 'K' || p.position === 'DST') {
            if (starerSlotsFilled < 7) {
                needMultiplier = 0.05;
            } else if (isStarterNeeded) {
                needMultiplier = 2.0;
            } else {
                needMultiplier = 0.01;
            }
        } else {
            if (isStarterNeeded) {
                needMultiplier = 1.5;
                if (p.position === 'RB') needMultiplier *= 1.2;
                if (p.position === 'WR') needMultiplier *= 1.1;
            } else if (filledCounts['RB'] + filledCounts['WR'] + filledCounts['TE'] < 7) {
                needMultiplier = 0.8;
                if ((p.position === 'QB' || p.position === 'TE') && currentCount >= 1) {
                    needMultiplier = 0.2;
                }
            } else {
                needMultiplier = 0.1;
            }
        }

        score *= needMultiplier;

        if (score > maxScore) {
            maxScore = score;
            bestPlayer = p;
        }
    }

    if (bestPlayer) {
        console.log(`✅ AI Recommends: ${bestPlayer.name} (${bestPlayer.position}) - ADP: ${bestPlayer.adp} - Score: ${maxScore.toFixed(2)}`);
    } else {
        console.log("❌ No player found");
    }
}

async function main() {
    // Scenario 1: Fresh Team (Round 1)
    await testBestAvailablePlayer({ QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 }, 1);

    // Scenario 2: Team with 2 RB, 2 WR (Needs QB/TE) - Round 5
    await testBestAvailablePlayer({ QB: 0, RB: 2, WR: 2, TE: 0, DST: 0, K: 0 }, 5);

    // Scenario 3: Full Starters (Needs Depth) - Round 10
    await testBestAvailablePlayer({ QB: 1, RB: 2, WR: 2, TE: 1, DST: 0, K: 0 }, 10);

    // Scenario 4: Late Rounds (Needs DST/K)
    await testBestAvailablePlayer({ QB: 1, RB: 3, WR: 3, TE: 1, DST: 0, K: 0 }, 14);
}

main();
