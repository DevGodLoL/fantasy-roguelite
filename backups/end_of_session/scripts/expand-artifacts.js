// Massive Artifact Collection Expansion
// Adds 50+ unique powerups across all rarity tiers

const { PrismaClient } = require("../src/generated/client");
const { resolve } = require("path");

const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;
const prisma = new PrismaClient({
    datasources: { db: { url } }
});

async function main() {
    console.log("🎴 EXPANDING ARTIFACT COLLECTION...\n");

    const powerups = [
        // ═══════════════════════════════════════════════════════════════
        // 👑 LEGENDARY TIER (8 cards) - Game-changing, ultra-rare
        // ═══════════════════════════════════════════════════════════════
        {
            code: "INFINITY_GAUNTLET",
            name: "Infinity Gauntlet",
            description: "Doubles your entire team's score. Ultimate power at your fingertips.",
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
        {
            code: "CHRONOS_BLESSING",
            name: "Chronos Blessing",
            description: "Your highest-scoring player's points are doubled this week.",
            rarity: "legendary",
            kind: "multiplier",
            value: 2.0,
        },
        {
            code: "DIVINE_INTERVENTION",
            name: "Divine Intervention",
            description: "Negate all opponent powerups this week. Absolute protection.",
            rarity: "legendary",
            scope: "opponent",
            kind: "penalty",
            value: 0.0,
        },
        {
            code: "GOLDEN_AGE",
            name: "Golden Age",
            description: "+75 bonus points. An era of unprecedented prosperity.",
            rarity: "legendary",
            kind: "bonus_points",
            value: 75.0,
        },
        {
            code: "MJOLNIR",
            name: "Mjolnir",
            description: "1.8x score multiplier. Only the worthy may wield it.",
            rarity: "legendary",
            kind: "multiplier",
            value: 1.8,
        },
        {
            code: "VOID_EMPEROR",
            name: "Void Emperor",
            description: "Reduce opponent's score by 40 points. Embrace the darkness.",
            rarity: "legendary",
            scope: "opponent",
            kind: "penalty",
            value: 40.0,
        },
        {
            code: "EXCALIBUR",
            name: "Excalibur",
            description: "1.65x multiplier + 20 bonus points. The legendary blade of kings.",
            rarity: "legendary",
            kind: "multiplier",
            value: 1.65,
        },

        // ═══════════════════════════════════════════════════════════════
        // 💎 EPIC TIER (12 cards) - Powerful effects, rare finds
        // ═══════════════════════════════════════════════════════════════
        {
            code: "CURSE_OF_THE_FUMBLE",
            name: "Cursed Totem",
            description: "Opponent loses 5 points per fumble. Their mistakes are your gain.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 5.0,
        },
        {
            code: "DARK_RITUAL",
            name: "Dark Ritual",
            description: "Sacrifice 20 points to reduce opponent by 35. Dark magic demands payment.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 35.0,
        },
        {
            code: "BERSERKER_RAGE",
            name: "Berserker Rage",
            description: "1.35x score multiplier. Unleash unbridled fury.",
            rarity: "epic",
            kind: "multiplier",
            value: 1.35,
        },
        {
            code: "FROST_NOVA",
            name: "Frost Nova",
            description: "Freeze opponent's highest scorer. They score 50% less.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 0.5,
        },
        {
            code: "BLOOD_PACT",
            name: "Blood Pact",
            description: "+40 bonus points. A deal sealed in crimson.",
            rarity: "epic",
            kind: "bonus_points",
            value: 40.0,
        },
        {
            code: "SHADOW_STEP",
            name: "Shadow Step",
            description: "1.3x multiplier. Move unseen through the darkness.",
            rarity: "epic",
            kind: "multiplier",
            value: 1.3,
        },
        {
            code: "ARCANE_SURGE",
            name: "Arcane Surge",
            description: "+30 bonus points. Channel pure magical energy.",
            rarity: "epic",
            kind: "bonus_points",
            value: 30.0,
        },
        {
            code: "CHAIN_LIGHTNING",
            name: "Chain Lightning",
            description: "Opponent loses 25 points. The storm finds its mark.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 25.0,
        },
        {
            code: "WARRIORS_SPIRIT",
            name: "Warrior's Spirit",
            description: "1.25x multiplier + 10 bonus. The heart of a champion.",
            rarity: "epic",
            kind: "multiplier",
            value: 1.25,
        },
        {
            code: "NECROMANCY",
            name: "Necromancy",
            description: "Revive your bench. Bench players score at 50% to your total.",
            rarity: "epic",
            kind: "multiplier",
            value: 1.15,
        },
        {
            code: "DRAGONS_BREATH",
            name: "Dragon's Breath",
            description: "+35 bonus points. Burn everything in your path.",
            rarity: "epic",
            kind: "bonus_points",
            value: 35.0,
        },
        {
            code: "HEX_OF_WEAKNESS",
            name: "Hex of Weakness",
            description: "Opponent's score is reduced by 15%. A crippling curse.",
            rarity: "epic",
            scope: "opponent",
            kind: "penalty",
            value: 0.85,
        },

        // ═══════════════════════════════════════════════════════════════
        // ✨ RARE TIER (18 cards) - Solid advantages
        // ═══════════════════════════════════════════════════════════════
        {
            code: "XP_BOOST_15",
            name: "Experience Relic",
            description: "1.15x score multiplier. Wisdom of the ancients.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.15,
        },
        {
            code: "PASS_YDS_X15",
            name: "Aerial Assault",
            description: "1.5x passing yards multiplier. Dominate the skies.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.5,
        },
        {
            code: "RUSH_YDS_X15",
            name: "Ground Game",
            description: "1.5x rushing yards multiplier. Pound the rock.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.5,
        },
        {
            code: "REC_YDS_X15",
            name: "Sticky Hands",
            description: "1.5x receiving yards multiplier. Nothing gets dropped.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.5,
        },
        {
            code: "TD_CELEBRATION",
            name: "Touchdown Dance",
            description: "+3 bonus per touchdown. Celebrate in style.",
            rarity: "rare",
            kind: "bonus_points",
            value: 3.0,
        },
        {
            code: "MIDAS_TOUCH",
            name: "Midas Touch",
            description: "+20 bonus points. Everything turns to gold.",
            rarity: "rare",
            kind: "bonus_points",
            value: 20.0,
        },
        {
            code: "SWIFT_STRIKE",
            name: "Swift Strike",
            description: "1.12x multiplier. Speed is the ultimate weapon.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.12,
        },
        {
            code: "BATTLE_CRY",
            name: "Battle Cry",
            description: "+18 bonus points. Rally your forces.",
            rarity: "rare",
            kind: "bonus_points",
            value: 18.0,
        },
        {
            code: "POISON_DAGGER",
            name: "Poison Dagger",
            description: "Opponent loses 15 points. A subtle but deadly blow.",
            rarity: "rare",
            scope: "opponent",
            kind: "penalty",
            value: 15.0,
        },
        {
            code: "IRON_FORTRESS",
            name: "Iron Fortress",
            description: "Negate 20 points of opponent penalties. Unbreakable defense.",
            rarity: "rare",
            kind: "bonus_points",
            value: 20.0,
        },
        {
            code: "ELVEN_ACCURACY",
            name: "Elven Accuracy",
            description: "1.18x multiplier. Precision beyond mortal limits.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.18,
        },
        {
            code: "GOBLIN_GOLD",
            name: "Goblin's Gold",
            description: "+22 bonus points. Plundered treasures.",
            rarity: "rare",
            kind: "bonus_points",
            value: 22.0,
        },
        {
            code: "VENOM_STRIKE",
            name: "Venom Strike",
            description: "Opponent loses 12 points. Toxic payload delivered.",
            rarity: "rare",
            scope: "opponent",
            kind: "penalty",
            value: 12.0,
        },
        {
            code: "SPIRIT_ANIMAL",
            name: "Spirit Animal",
            description: "1.15x multiplier. Channel your inner beast.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.15,
        },
        {
            code: "RUNIC_POWER",
            name: "Runic Power",
            description: "+25 bonus points. Ancient symbols of strength.",
            rarity: "rare",
            kind: "bonus_points",
            value: 25.0,
        },
        {
            code: "WINDWALKER",
            name: "Windwalker",
            description: "1.2x multiplier. Move with the breeze.",
            rarity: "rare",
            kind: "multiplier",
            value: 1.2,
        },
        {
            code: "STONE_SKIN",
            name: "Stone Skin",
            description: "+15 bonus points. Hardened against all attacks.",
            rarity: "rare",
            kind: "bonus_points",
            value: 15.0,
        },
        {
            code: "CURSE_BREAKER",
            name: "Curse Breaker",
            description: "Negate opponent's curse effects. Freedom from hexes.",
            rarity: "rare",
            kind: "bonus_points",
            value: 10.0,
        },

        // ═══════════════════════════════════════════════════════════════
        // ⚙️ COMMON TIER (16 cards) - Reliable basics
        // ═══════════════════════════════════════════════════════════════
        {
            code: "PASS_TD_BONUS_2",
            name: "Quarterback's Tome",
            description: "+2 per passing TD. The playbook of legends.",
            rarity: "common",
            kind: "bonus_points",
            value: 2.0,
        },
        {
            code: "PLUS_10",
            name: "Small Blessing",
            description: "+10 bonus points. Every bit helps.",
            rarity: "common",
            kind: "bonus_points",
            value: 10.0,
        },
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
            description: "1.05x multiplier. Determination pays off.",
            rarity: "common",
            kind: "multiplier",
            value: 1.05,
        },
        {
            code: "MINOR_BLESSING",
            name: "Minor Blessing",
            description: "+7 bonus points. A small gift from above.",
            rarity: "common",
            kind: "bonus_points",
            value: 7.0,
        },
        {
            code: "STEADY_HANDS",
            name: "Steady Hands",
            description: "1.06x multiplier. Calm under pressure.",
            rarity: "common",
            kind: "multiplier",
            value: 1.06,
        },
        {
            code: "QUICK_FEET",
            name: "Quick Feet",
            description: "+8 bonus points. Agility matters.",
            rarity: "common",
            kind: "bonus_points",
            value: 8.0,
        },
        {
            code: "FOCUSED_MIND",
            name: "Focused Mind",
            description: "1.07x multiplier. Clarity brings success.",
            rarity: "common",
            kind: "multiplier",
            value: 1.07,
        },
        {
            code: "COPPER_COIN",
            name: "Copper Coin",
            description: "+6 bonus points. Humble beginnings.",
            rarity: "common",
            kind: "bonus_points",
            value: 6.0,
        },
        {
            code: "APPRENTICE_SPELL",
            name: "Apprentice Spell",
            description: "1.04x multiplier. Every mage starts somewhere.",
            rarity: "common",
            kind: "multiplier",
            value: 1.04,
        },
        {
            code: "WOODEN_SHIELD",
            name: "Wooden Shield",
            description: "+4 bonus points. Basic protection.",
            rarity: "common",
            kind: "bonus_points",
            value: 4.0,
        },
        {
            code: "TRAINING_WEIGHTS",
            name: "Training Weights",
            description: "1.03x multiplier. Hard work compounds.",
            rarity: "common",
            kind: "multiplier",
            value: 1.03,
        },
        {
            code: "HEALTH_POTION",
            name: "Health Potion",
            description: "+9 bonus points. Restoration in a bottle.",
            rarity: "common",
            kind: "bonus_points",
            value: 9.0,
        },
        {
            code: "BRONZE_MEDAL",
            name: "Bronze Medal",
            description: "+12 bonus points. A token of achievement.",
            rarity: "common",
            kind: "bonus_points",
            value: 12.0,
        },
        {
            code: "MINOR_HEX",
            name: "Minor Hex",
            description: "Opponent loses 5 points. A small curse.",
            rarity: "common",
            scope: "opponent",
            kind: "penalty",
            value: 5.0,
        },
        {
            code: "PRACTICE_MAKES_PERFECT",
            name: "Practice Makes Perfect",
            description: "1.08x multiplier. Repetition breeds excellence.",
            rarity: "common",
            kind: "multiplier",
            value: 1.08,
        },
    ];

    // Upsert all powerups
    let counts = { legendary: 0, epic: 0, rare: 0, common: 0 };

    for (const p of powerups) {
        await prisma.powerup.upsert({
            where: { code: p.code },
            update: p,
            create: p,
        });
        counts[p.rarity]++;
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    ARTIFACT COLLECTION COMPLETE");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log(`  👑 LEGENDARY:  ${counts.legendary} cards`);
    console.log(`  💎 EPIC:       ${counts.epic} cards`);
    console.log(`  ✨ RARE:       ${counts.rare} cards`);
    console.log(`  ⚙️  COMMON:     ${counts.common} cards`);
    console.log(`  ─────────────────────────`);
    console.log(`  📦 TOTAL:      ${powerups.length} cards\n`);

    const dbCount = await prisma.powerup.count();
    console.log(`  Database now contains: ${dbCount} artifacts`);
    console.log("\n═══════════════════════════════════════════════════════════════\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
