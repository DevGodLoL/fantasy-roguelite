// Script to discover all artifacts for inspection
// This version removes the unique constraint issue by using one powerup per week-team combo
// Run: node scripts/discover-all-artifacts.js

const { PrismaClient } = require("../src/generated/client");
const { resolve } = require("path");

const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;
const prisma = new PrismaClient({
    datasources: { db: { url } }
});

async function main() {
    console.log("🔓 Discovering ALL artifacts for inspection...\n");

    // Get the DevGods team
    const team = await prisma.team.findFirst({
        where: { name: "The DevGods" },
        include: { league: { include: { weeks: { orderBy: { number: 'asc' } } } } },
    });

    if (!team) {
        console.log("❌ Team not found!");
        return;
    }

    const weeks = team.league.weeks;
    console.log(`Found ${weeks.length} weeks available\n`);

    // Get all powerups
    const allPowerups = await prisma.powerup.findMany({
        orderBy: { code: 'asc' },
    });
    console.log(`Total powerups in database: ${allPowerups.length}\n`);

    // Get already owned powerup IDs
    const existingTeamPowerups = await prisma.teamPowerup.findMany({
        where: { teamId: team.id },
        select: { powerupId: true },
    });
    const ownedIds = new Set(existingTeamPowerups.map(tp => tp.powerupId));
    console.log(`Already discovered: ${ownedIds.size}\n`);

    // Track which week-team combos are used
    const usedCombos = new Set();
    const existingCombos = await prisma.teamPowerup.findMany({
        where: { teamId: team.id },
        select: { weekId: true },
    });
    existingCombos.forEach(c => usedCombos.add(c.weekId));

    // Find unowned powerups
    const unownedPowerups = allPowerups.filter(p => !ownedIds.has(p.id));
    console.log(`Need to discover: ${unownedPowerups.length}\n`);

    // We need more weeks if we have more unowned powerups than available weeks
    // Let's batch create entries using direct SQL to bypass constraints

    let added = 0;

    for (const powerup of unownedPowerups) {
        // Find a week that hasn't been used yet for this team
        const availableWeek = weeks.find(w => !usedCombos.has(w.id));

        if (!availableWeek) {
            // All weeks used, need to use raw SQL approach to bypass unique constraint
            // Actually, let's modify the constraint - it should be on teamId+powerupId+weekId (all three)
            console.log(`⚠ No more weeks available. Running direct insert...`);

            // Use the first week and just try to add it anyway
            try {
                await prisma.$executeRaw`
          INSERT INTO TeamPowerup (id, teamId, powerupId, weekId, isConsumed, createdAt, updatedAt)
          VALUES (${`tp_discover_${powerup.code}_${Date.now()}`}, ${team.id}, ${powerup.id}, ${weeks[0].id}, 0, datetime('now'), datetime('now'))
        `;
                added++;
                console.log(`  ✓ Force discovered: ${powerup.name}`);
            } catch (e) {
                console.log(`  ⚠ Could not add ${powerup.name}: ${e.code || e.message}`);
            }
        } else {
            try {
                await prisma.teamPowerup.create({
                    data: {
                        teamId: team.id,
                        powerupId: powerup.id,
                        weekId: availableWeek.id,
                        isConsumed: false,
                    },
                });
                usedCombos.add(availableWeek.id);
                added++;
                console.log(`  ✓ Discovered: ${powerup.name} (${powerup.rarity})`);
            } catch (e) {
                console.log(`  ⚠ Skipped ${powerup.name}: ${e.code}`);
            }
        }
    }

    // Count final discovered
    const finalCount = await prisma.teamPowerup.findMany({
        where: { teamId: team.id },
        select: { powerupId: true },
    });
    const uniqueDiscovered = new Set(finalCount.map(tp => tp.powerupId)).size;

    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`  ✅ Added ${added} new artifacts`);
    console.log(`  📦 Total unique artifacts discovered: ${uniqueDiscovered} / ${allPowerups.length}`);
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`\n🎮 Refresh the inventory page to see all cards face-up!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
