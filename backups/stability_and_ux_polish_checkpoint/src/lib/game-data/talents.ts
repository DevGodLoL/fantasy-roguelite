
export interface Talent {
    code: string;
    name: string;
    description: string;
    tier: number;
    pointsToUnlock: number;
    dependencies?: string[]; // codes of talents required
    levelRequired: number;
    effect: {
        type: 'xp_boost' | 'gold_boost' | 'score_boost' | 'shop_discount' | 'reroll_bonus' | 'gold_bonus' | 'mutation_boost';
        value: number;
        targetPos?: string[]; // for score_boost
    };
}

export const TALENT_REGISTRY: Talent[] = [
    // Tier 1 (Level 1)
    {
        code: 'SCHOLAR',
        name: 'Scholar',
        description: '+5% Commander Experience gained from all battles.',
        tier: 1,
        pointsToUnlock: 1,
        levelRequired: 1,
        effect: { type: 'xp_boost', value: 0.05 }
    },
    {
        code: 'MERCHANT',
        name: 'Merchant',
        description: '+10% Gold earned from all league matchups.',
        tier: 1,
        pointsToUnlock: 1,
        levelRequired: 1,
        effect: { type: 'gold_boost', value: 0.10 }
    },
    {
        code: 'PROPHET',
        name: 'Prophet',
        description: 'Begin every new league with 1 additional Reroll Token.',
        tier: 1,
        pointsToUnlock: 1,
        levelRequired: 1,
        effect: { type: 'reroll_bonus', value: 1 }
    },

    // Tier 2 (Level 5)
    {
        code: 'BRAWLER',
        name: 'Brawler',
        description: '+1.5% Offensive Power (QB, RB, WR, TE score).',
        tier: 2,
        pointsToUnlock: 1,
        levelRequired: 5,
        dependencies: ['SCHOLAR'],
        effect: { type: 'score_boost', value: 0.015, targetPos: ['QB', 'RB', 'WR', 'TE'] }
    },
    {
        code: 'BASTION',
        name: 'Bastion',
        description: '+3% Defensive Power (DST and Kicker score).',
        tier: 2,
        pointsToUnlock: 1,
        levelRequired: 5,
        dependencies: ['MERCHANT'],
        effect: { type: 'score_boost', value: 0.03, targetPos: ['DST', 'K'] }
    },
    {
        code: 'HAGGLER',
        name: 'Haggler',
        description: 'The Black Market offers a 5% discount on all items.',
        tier: 2,
        pointsToUnlock: 1,
        levelRequired: 5,
        dependencies: ['PROPHET'],
        effect: { type: 'shop_discount', value: 0.05 }
    },

    // Tier 3 (Level 10)
    {
        code: 'GENETICIST',
        name: 'Geneticist',
        description: '+10% chance for players to gain positive traits during mutations.',
        tier: 3,
        pointsToUnlock: 1,
        levelRequired: 10,
        dependencies: ['BRAWLER'],
        effect: { type: 'mutation_boost', value: 0.10 }
    },
    {
        code: 'CURATOR',
        name: 'Curator',
        description: 'Persistent Relic effects are 10% more effective.',
        tier: 3,
        pointsToUnlock: 1,
        levelRequired: 10,
        dependencies: ['BASTION'],
        effect: { type: 'score_boost', value: 0.10 } // Handled specially in sim logic
    },
    {
        code: 'INVESTOR',
        name: 'Investor',
        description: 'Begin every new league with 50 additional Gold.',
        tier: 3,
        pointsToUnlock: 1,
        levelRequired: 10,
        dependencies: ['HAGGLER'],
        effect: { type: 'gold_bonus', value: 50 }
    }
];

export function getTalentByCode(code: string): Talent | undefined {
    return TALENT_REGISTRY.find(t => t.code === code);
}
