import { db } from "@/lib/prisma";
import { SHOP_RELICS, SHOP_CONSUMABLES } from "@/lib/game-data/shop-items";

async function seedShopItems() {
    console.log("🏪 Seeding Shop Items...");

    // 1. Seed Relics
    console.log("  - Seeding Relics...");
    for (const relic of SHOP_RELICS) {
        await db.powerup.upsert({
            where: { code: relic.id },
            update: {
                price: relic.cost,
                type: "relic",
                rarity: relic.rarity,
                description: relic.description,
                name: relic.name
            },
            create: {
                code: relic.id,
                name: relic.name,
                description: relic.description,
                rarity: relic.rarity,
                scope: "self", // Relics usually target self
                duration: "season", // Relics last for the season
                type: "relic",
                price: relic.cost,
            }
        });
    }

    // 2. Seed Consumables
    console.log("  - Seeding Consumables...");
    for (const item of SHOP_CONSUMABLES) {
        await db.powerup.upsert({
            where: { code: item.id },
            update: {
                price: item.cost,
                type: "card", // We treat these as buyable cards
                rarity: item.rarity,
                description: item.description,
                name: item.name,
                kind: item.kind,
                value: item.value,
                duration: item.duration,
                scope: item.scope || "self" // Default to self if not specified
            },
            create: {
                code: item.id,
                name: item.name,
                description: item.description,
                rarity: item.rarity,
                scope: item.scope || "self",
                duration: item.duration,
                type: "card",
                price: item.cost,
                kind: item.kind,
                value: item.value
            }
        });
    }

    console.log("✅ Shop Items seeded successfully!");
}

seedShopItems()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
