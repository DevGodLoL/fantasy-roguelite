
// --- TRAIT DEFINITIONS ---
export const TRAIT_DEFINITIONS: Record<string, any> = {
    // Basic Positive
    HOT_HAND: { code: 'HOT_HAND', name: "Hot Hand", description: "In the zone! +10% Points.", kind: "multiplier", value: 1.1, duration: 1, rarity: "uncommon" },
    GENIUS: { code: 'GENIUS', name: "Genius", description: "High IQ play. +15% Points.", kind: "multiplier", value: 1.15, duration: 2, rarity: "rare" },
    CLUTCH: { code: 'CLUTCH', name: "Clutch", description: "Performs under pressure. +5 pts.", kind: "bonus_flat", value: 5.0, duration: 3, rarity: "epic" },
    LEGENDARY_AURA: { code: 'LEGENDARY_AURA', name: "Legendary Aura", description: "Permanent +2 pts.", kind: "bonus_flat", value: 2.0, duration: null, rarity: "legendary" },

    // Specializations
    SHADOW_RUNNER: { code: 'SHADOW_RUNNER', name: "Shadow Runner", description: "Unstoppable on the ground. +20% Rushing Points.", kind: "multiplier", value: 1.2, duration: 2, rarity: "rare" },
    GUNSLINGER: { code: 'GUNSLINGER', name: "Gunslinger", description: "Air raid specialist. +15% Passing Points.", kind: "multiplier", value: 1.15, duration: 2, rarity: "rare" },
    IRON_LUNG: { code: 'IRON_LUNG', name: "Iron Lung", description: "Never tires. +5% points permanently.", kind: "multiplier", value: 1.05, duration: null, rarity: "epic" },

    // Negative / Curses
    COLD: { code: 'COLD', name: "Cold Streak", description: "Sluggish. -10% Points.", kind: "multiplier", value: 0.9, duration: 1, rarity: "common" },
    SHOOK: { code: 'SHOOK', name: "Shook", description: "Confidence shattered. -20% Points.", kind: "multiplier", value: 0.8, duration: 2, rarity: "uncommon" },
    VULNERABLE: { code: 'VULNERABLE', name: "Vulnerable", description: "Prone to mistakes. -3 pts.", kind: "bonus_flat", value: -3.0, duration: 1, rarity: "common" },
    BUTTERFINGERS: { code: 'BUTTERFINGERS', name: "Butterfingers", description: "Loves to drop the ball. -5 pts on fumbles.", kind: "bonus_flat", value: -5.0, duration: 3, rarity: "curse" },
    CURSE_OF_THE_FALLEN: { code: 'CURSE_OF_THE_FALLEN', name: "Curse of the Fallen", description: "Slow decay. -10% points permanently.", kind: "multiplier", value: 0.9, duration: null, rarity: "curse" },
};

/**
 * Check for new mutations based on player performance
 */
export function checkMutations(
    playerId: string,
    points: number,
    stats: any,
    position: string,
    leagueId: string,
    currentWeekNumber: number,
    archetype?: string,
    commanderTalents: string[] = []
) {
    const mutations = [];

    // Increase variance for mutation roll if CHAOTIC
    let mutationRollBonus = archetype === 'CHAOTIC' ? 1.5 : 1.0;

    // T3: Geneticist talent (+10% chance for positive traits)
    if (commanderTalents.includes('GENETICIST')) {
        mutationRollBonus *= 1.1;
    }

    // 1. POSITIVE SCORE TRIGGERS
    if (points >= 25) {
        const roll = Math.random() / mutationRollBonus;
        if (roll < 0.1) mutations.push(TRAIT_DEFINITIONS.GENIUS);
        else if (roll < 0.4) mutations.push(TRAIT_DEFINITIONS.HOT_HAND);
    }
    if (points >= 35) {
        if (Math.random() / mutationRollBonus < 0.05) mutations.push(TRAIT_DEFINITIONS.LEGENDARY_AURA);
        else if (Math.random() / mutationRollBonus < 0.2) mutations.push(TRAIT_DEFINITIONS.CLUTCH);
    }

    // 2. STAT-SPECIFIC TRIGGERS
    if (position === 'RB' && stats.rushYds >= 100) {
        if (Math.random() / mutationRollBonus < 0.3) mutations.push(TRAIT_DEFINITIONS.SHADOW_RUNNER);
    }
    if (position === 'QB' && stats.passYds >= 300) {
        if (Math.random() / mutationRollBonus < 0.3) mutations.push(TRAIT_DEFINITIONS.GUNSLINGER);
    }
    if (stats.fumbles > 0) {
        if (Math.random() / mutationRollBonus < 0.4) mutations.push(TRAIT_DEFINITIONS.BUTTERFINGERS);
    }

    // 3. NEGATIVE SCORE TRIGGERS
    if (points < 5 && points > -5) {
        if (Math.random() / mutationRollBonus < 0.25) mutations.push(TRAIT_DEFINITIONS.COLD);
    }
    if (points < 0) {
        mutations.push(TRAIT_DEFINITIONS.SHOOK);
        if (Math.random() / mutationRollBonus < 0.1) mutations.push(TRAIT_DEFINITIONS.CURSE_OF_THE_FALLEN);
    }

    // Permanent high performance bonus
    if (points >= 40 && Math.random() / mutationRollBonus < 0.1) {
        mutations.push(TRAIT_DEFINITIONS.IRON_LUNG);
    }

    // Helper to format for DB
    return mutations.map(def => ({
        playerId,
        leagueId,
        code: def.code,
        name: def.name,
        description: def.description,
        rarity: def.rarity,
        kind: def.kind,
        value: def.value,
        expiresAtWeek: def.duration ? currentWeekNumber + def.duration : null
    }));
}
