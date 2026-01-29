// Mission definitions and utilities for the weekly missions system

export interface MissionTemplate {
    code: string;
    name: string;
    description: string;
    type: 'total_score' | 'win_margin' | 'position_score' | 'player_score';
    targetPosition?: string; // For position-based missions
    targetValue: number;
    rewardType: 'gold' | 'rerolls';
    rewardValue: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

// Pool of available missions
export const MISSION_POOL: MissionTemplate[] = [
    // Easy missions (most common, lower rewards)
    {
        code: 'win_game',
        name: 'Victorious',
        description: 'Win this week\'s matchup',
        type: 'win_margin',
        targetValue: 0.1, // Just need positive margin
        rewardType: 'gold',
        rewardValue: 25,
        difficulty: 'easy'
    },
    {
        code: 'score_80',
        name: 'Solid Performance',
        description: 'Score at least 80 points',
        type: 'total_score',
        targetValue: 80,
        rewardType: 'gold',
        rewardValue: 25,
        difficulty: 'easy'
    },
    {
        code: 'rb_20',
        name: 'Ground Game',
        description: 'Score 20+ points from your RBs',
        type: 'position_score',
        targetPosition: 'RB',
        targetValue: 20,
        rewardType: 'gold',
        rewardValue: 30,
        difficulty: 'easy'
    },
    {
        code: 'wr_25',
        name: 'Air Raid',
        description: 'Score 25+ points from your WRs',
        type: 'position_score',
        targetPosition: 'WR',
        targetValue: 25,
        rewardType: 'gold',
        rewardValue: 30,
        difficulty: 'easy'
    },

    // Medium missions (less common, better rewards)
    {
        code: 'score_100',
        name: 'Century Mark',
        description: 'Score at least 100 points',
        type: 'total_score',
        targetValue: 100,
        rewardType: 'gold',
        rewardValue: 50,
        difficulty: 'medium'
    },
    {
        code: 'win_by_15',
        name: 'Dominant Victory',
        description: 'Win by 15+ points',
        type: 'win_margin',
        targetValue: 15,
        rewardType: 'gold',
        rewardValue: 50,
        difficulty: 'medium'
    },
    {
        code: 'qb_20',
        name: 'Field General',
        description: 'Score 20+ points from your QB',
        type: 'position_score',
        targetPosition: 'QB',
        targetValue: 20,
        rewardType: 'gold',
        rewardValue: 40,
        difficulty: 'medium'
    },
    {
        code: 'rb_35',
        name: 'Workhorse',
        description: 'Score 35+ points from your RBs',
        type: 'position_score',
        targetPosition: 'RB',
        targetValue: 35,
        rewardType: 'rerolls',
        rewardValue: 1,
        difficulty: 'medium'
    },
    {
        code: 'player_25',
        name: 'Star Player',
        description: 'Have any player score 25+ points',
        type: 'player_score',
        targetValue: 25,
        rewardType: 'gold',
        rewardValue: 40,
        difficulty: 'medium'
    },

    // Hard missions (rare, great rewards)
    {
        code: 'score_120',
        name: 'Explosion',
        description: 'Score at least 120 points',
        type: 'total_score',
        targetValue: 120,
        rewardType: 'rerolls',
        rewardValue: 1,
        difficulty: 'hard'
    },
    {
        code: 'win_by_30',
        name: 'Crushing Blow',
        description: 'Win by 30+ points',
        type: 'win_margin',
        targetValue: 30,
        rewardType: 'rerolls',
        rewardValue: 1,
        difficulty: 'hard'
    },
    {
        code: 'player_30',
        name: 'Legendary Performance',
        description: 'Have any player score 30+ points',
        type: 'player_score',
        targetValue: 30,
        rewardType: 'gold',
        rewardValue: 75,
        difficulty: 'hard'
    },
    {
        code: 'te_15',
        name: 'Tight End Takeover',
        description: 'Score 15+ points from your TE',
        type: 'position_score',
        targetPosition: 'TE',
        targetValue: 15,
        rewardType: 'gold',
        rewardValue: 50,
        difficulty: 'hard'
    }
];

/**
 * Select random missions for a team's week
 * @param count Number of missions to select (default 3)
 * @returns Array of mission templates
 */
export function selectMissionsForWeek(count: number = 3): MissionTemplate[] {
    // Weight by difficulty: easy 50%, medium 35%, hard 15%
    const weightedPool: MissionTemplate[] = [];

    MISSION_POOL.forEach(mission => {
        const copies = mission.difficulty === 'easy' ? 5
            : mission.difficulty === 'medium' ? 3
                : 1;
        for (let i = 0; i < copies; i++) {
            weightedPool.push(mission);
        }
    });

    // Shuffle and pick unique missions
    const shuffled = weightedPool.sort(() => Math.random() - 0.5);
    const selected: MissionTemplate[] = [];
    const usedCodes = new Set<string>();

    for (const mission of shuffled) {
        if (!usedCodes.has(mission.code) && selected.length < count) {
            selected.push(mission);
            usedCodes.add(mission.code);
        }
    }

    return selected;
}

/**
 * Calculate mission progress based on battle results
 */
export interface BattleResults {
    totalScore: number;
    opponentScore: number;
    positionScores: Record<string, number>; // e.g., { QB: 22.5, RB: 35.2, WR: 28.0, TE: 8.1 }
    highestPlayerScore: number;
}

export function calculateMissionProgress(mission: MissionTemplate, results: BattleResults): {
    progress: number;
    isCompleted: boolean;
} {
    let progress = 0;
    let isCompleted = false;

    switch (mission.type) {
        case 'total_score':
            progress = results.totalScore;
            isCompleted = progress >= mission.targetValue;
            break;

        case 'win_margin':
            progress = results.totalScore - results.opponentScore;
            isCompleted = progress >= mission.targetValue;
            break;

        case 'position_score':
            progress = results.positionScores[mission.targetPosition || ''] || 0;
            isCompleted = progress >= mission.targetValue;
            break;

        case 'player_score':
            progress = results.highestPlayerScore;
            isCompleted = progress >= mission.targetValue;
            break;
    }

    return { progress, isCompleted };
}
