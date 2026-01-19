export const SHOP_RELICS = [
    {
        id: "relic_rush_bonus",
        name: "Boots of Haste",
        description: "+1 Point for every 10 Rushing Yards (Team Wide)",
        cost: 300,
        rarity: "rare",
        type: "passive",
        icon: "👢"
    },
    {
        id: "relic_pass_mastery",
        name: "Wizard's Hat",
        description: "QBs get +50% Points, but INTs are -4",
        cost: 500,
        rarity: "epic",
        type: "passive",
        icon: "🧙‍♂️"
    },
    {
        id: "relic_underdog",
        name: "Coin of Despair",
        description: "Gain +10% Points if opponent has a higher win rate.",
        cost: 150,
        rarity: "common",
        type: "passive",
        icon: "🪙"
    },
    {
        id: "relic_necromancy",
        name: "Necromancer's Cowl",
        description: "TE points are doubled. WR points are halved.",
        cost: 800,
        rarity: "legendary",
        type: "passive",
        icon: "💀"
    },
    {
        id: "relic_blood_thirst",
        name: "Vampire's Fang",
        description: "Defensive TDs grant +10 points.",
        cost: 400,
        rarity: "rare",
        type: "passive",
        icon: "🧛"
    },
    {
        id: "relic_midas_touch",
        name: "Golden Gauntlet",
        description: "Earn +50 Gold for every victory.",
        cost: 600,
        rarity: "epic",
        type: "passive",
        icon: "🧤"
    }
];

export const SHOP_CONSUMABLES = [
    {
        id: "item_reroll_token",
        name: "Scroll of Fate",
        description: "Grants +1 Reroll for pack openings.",
        cost: 50,
        rarity: "common",
        type: "consumable",
        kind: "reroll_add",
        value: 1,
        duration: "instant",
        icon: "📜"
    },
    {
        id: "card_rage_potion",
        name: "Potion of Rage",
        description: "Team gains +5% points for one week.",
        cost: 100,
        rarity: "common",
        type: "card",
        kind: "multiplier",
        value: 1.05,
        duration: "week",
        icon: "🧪"
    },
    {
        id: "card_mercenary",
        name: "Mercenary Contract",
        description: "Add a 20-point bonus to your score this week.",
        cost: 250,
        rarity: "uncommon",
        type: "card",
        kind: "flat_bonus",
        value: 20,
        duration: "week",
        icon: "🗡️"
    },
    {
        id: "card_sniper",
        name: "Sniper's Mark",
        description: "Opponent loses 10 points this week.",
        cost: 200,
        rarity: "rare",
        type: "card",
        kind: "flat_malus",
        value: 10,
        duration: "week",
        scope: "opponent",
        icon: "🎯"
    }
];
