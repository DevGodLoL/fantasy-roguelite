// Quick script to add new powerups to existing database
const { PrismaClient } = require("../src/generated/client");
const { resolve } = require("path");

const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;
const prisma = new PrismaClient({
    datasources: { db: { url } }
});

async function main() {
    console.log("Adding new powerups...");

    const powerups = [
        // === LEGENDARY TIER ===
        {
            code: "INFINITY_GAUNTLET",
            name: "Infinity Gauntlet",
            description: "Doubles your entire team's score this week. Ultimate power.",
            rarity: "legendary",
            kind: "multiplier",
            value: 2.0,
        },
        {
            code: "PHOENIX_REBIRTH",
            name: "Phoenix Rebirth",
            description: "If you lose this week, gain +50 bonus points. Rise from the ashes.",
            rarity: "legendary",
            kind: "bonus_points",
            value: 50.0,
        },

        // === EPIC TIER ===
        {
            code: "DARK_RITUAL",
            name: "Dark Ritual",
            description: "Sacrifice 20 points to reduce opponent's score by 30.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 30.0,
        },
        {
            code: "BERSERKER_RAGE",
            name: "Berserker Rage",
            description: "1.25x multiplier on total score. Unleash the fury.",
            rarity: "epic",
            kind: "multiplier",
            value: 1.25,
        },

        // === RARE TIER ===
        {
            code: "TD_CELEBRATION",
            name: "Touchdown Dance",
            description: "+3 bonus points per touchdown scored by your team.",
            rarity: "rare",
            kind: "bonus_points",
            value: 3.0,
        },

        // === COMMON TIER ===
        {
            code: "LUCKY_CHARM",
            name: "Lucky Charm",
            description: "+5 bonus points. A little luck goes a long way.",
            rarity: "common",
            kind: "bonus_points",
            value: 5.0,
        },
        {
            code: "IRON_WILL",
            name: "Iron Will",
            description: "1.05x multiplier. Consistency is key.",
            rarity: "common",
            kind: "multiplier",
            value: 1.05,
        },
    ];

    const rarityPrices = {
        'legendary': 500,
        'epic': 250,
        'rare': 125,
        'common': 50
    };

    for (const p of powerups) {
        const price = rarityPrices[p.rarity] || 50;
        const powerupData = { ...p, price };

        await prisma.powerup.upsert({
            where: { code: p.code },
            update: powerupData,
            create: powerupData,
        });
        console.log(`  ✓ ${p.rarity.toUpperCase()} - ${p.name}`);
    }

    const count = await prisma.powerup.count();
    console.log(`\nTotal powerups in database: ${count}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
