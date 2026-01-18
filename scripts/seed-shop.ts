import { db } from "@/lib/prisma"; // Adjust import to your actual db location
import { SHOP_RELICS } from "@/lib/game-data/shop-items";

async function seedShopRelics() {
    console.log("🏪 Seeding Shop Relics...");

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

    console.log("✅ Shop Relics seeded!");
}

seedShopRelics()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
