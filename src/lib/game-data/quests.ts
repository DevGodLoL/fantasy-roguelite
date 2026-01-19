// Quest Definitions for Roguelite Meta-Progression
// These are evaluated against actual game state

export interface QuestDefinition {
    id: string;
    name: string;
    description: string;
    lore?: string; // Flavor text for immersion
    category: 'weekly' | 'season' | 'hidden' | 'legendary';
    icon: string;
    reward: {
        type: 'gold' | 'artifact' | 'reroll' | 'title' | 'bonus_next_season';
        amount?: number;
        itemId?: string;
        itemName?: string;
    };
    requirement: {
        type: 'wins' | 'losses' | 'points_single' | 'points_total' | 'streak' | 'win_streak' | 'artifacts_owned' | 'gold_earned' | 'gold_spent' | 'waiver_claims' | 'playoff_seed' | 'trades' | 'close_wins' | 'blowout_wins' | 'comeback_wins' | 'games_played';
        target: number;
    };
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    tier?: number; // For progressive quests (1, 2, 3)
    prerequisiteId?: string; // Must complete this quest first
}

export const QUESTS: QuestDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // LEGENDARY QUESTS - Ultimate Achievements
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'perfect_season',
        name: 'The Undefeated',
        description: 'Complete an entire season without a single loss.',
        lore: 'Legends speak of warriors who never fell in battle... You shall become one.',
        category: 'legendary',
        icon: '👑',
        reward: { type: 'title', itemName: 'The Undefeated' },
        requirement: { type: 'wins', target: 14 },
        rarity: 'legendary'
    },
    {
        id: 'champion_throne',
        name: 'Throne of Glory',
        description: 'Claim the #1 playoff seed and prove your dominance.',
        lore: 'The throne awaits its rightful ruler. Will you sit upon it?',
        category: 'legendary',
        icon: '🏰',
        reward: { type: 'artifact', itemName: 'Throne of Glory' },
        requirement: { type: 'playoff_seed', target: 1 },
        rarity: 'legendary'
    },
    {
        id: 'point_god',
        name: 'The Point God',
        description: 'Score 200+ points in a single week.',
        lore: 'Such power... it radiates from your warriors like divine light.',
        category: 'legendary',
        icon: '⚡',
        reward: { type: 'artifact', itemName: 'Lightning Crown' },
        requirement: { type: 'points_single', target: 200 },
        rarity: 'legendary'
    },
    {
        id: 'season_mvp',
        name: 'Season MVP',
        description: 'Accumulate 2000 total points across the season.',
        lore: 'Your army has carved a path of destruction through the realm.',
        category: 'legendary',
        icon: '🌟',
        reward: { type: 'bonus_next_season', amount: 500, itemName: '+500 Starting Gold' },
        requirement: { type: 'points_total', target: 2000 },
        rarity: 'legendary'
    },

    // ═══════════════════════════════════════════════════════════════
    // EPIC QUESTS - Major Achievements
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'domination',
        name: 'Domination',
        description: 'Win 7 matchups in a single season.',
        lore: 'Your enemies tremble at the mere mention of your name.',
        category: 'season',
        icon: '⚔️',
        reward: { type: 'artifact', itemName: 'Crown of the Conqueror' },
        requirement: { type: 'wins', target: 7 },
        rarity: 'epic'
    },
    {
        id: 'playoff_bound',
        name: 'Playoff Bound',
        description: 'Qualify for the playoffs (Top 4 seed).',
        lore: 'The tournament awaits. Only the worthy may enter.',
        category: 'season',
        icon: '🏆',
        reward: { type: 'gold', amount: 500 },
        requirement: { type: 'playoff_seed', target: 4 },
        rarity: 'epic'
    },
    {
        id: 'unstoppable_force',
        name: 'Unstoppable Force',
        description: 'Maintain a 5-game winning streak.',
        lore: 'Like a storm that cannot be contained, you sweep across the battlefield.',
        category: 'season',
        icon: '🔥',
        reward: { type: 'gold', amount: 400 },
        requirement: { type: 'win_streak', target: 5 },
        rarity: 'epic'
    },
    {
        id: 'point_explosion',
        name: 'Point Explosion',
        description: 'Score 150+ points in a single week.',
        lore: 'The scoreboard bends to your will.',
        category: 'season',
        icon: '💥',
        reward: { type: 'reroll', amount: 3 },
        requirement: { type: 'points_single', target: 150 },
        rarity: 'epic'
    },
    {
        id: 'blowout_artist',
        name: 'Blowout Artist',
        description: 'Win a matchup by 50+ points.',
        lore: 'Mercy is for the weak. You showed none.',
        category: 'season',
        icon: '💀',
        reward: { type: 'gold', amount: 300 },
        requirement: { type: 'blowout_wins', target: 1 },
        rarity: 'epic'
    },
    {
        id: 'hoarder_supreme',
        name: 'Hoarder Supreme',
        description: 'Own 10 artifacts simultaneously.',
        lore: 'Your vault overflows with mystical treasures.',
        category: 'season',
        icon: '🗝️',
        reward: { type: 'artifact', itemName: 'Collector\'s Vault' },
        requirement: { type: 'artifacts_owned', target: 10 },
        rarity: 'epic'
    },

    // ═══════════════════════════════════════════════════════════════
    // RARE QUESTS - Solid Achievements
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'win_streak_3',
        name: 'Hot Streak',
        description: 'Win 3 matchups in a row.',
        lore: 'The flames of victory burn brighter with each conquest.',
        category: 'season',
        icon: '🔥',
        reward: { type: 'gold', amount: 250 },
        requirement: { type: 'win_streak', target: 3 },
        rarity: 'rare'
    },
    {
        id: 'century_plus',
        name: 'Century Plus',
        description: 'Score 120+ points in a single week.',
        lore: 'A performance worthy of the ancient champions.',
        category: 'season',
        icon: '📈',
        reward: { type: 'gold', amount: 200 },
        requirement: { type: 'points_single', target: 120 },
        rarity: 'rare'
    },
    {
        id: 'season_scorer',
        name: 'Season Scorer',
        description: 'Accumulate 1000 total points across the season.',
        lore: 'Consistency is the mark of true greatness.',
        category: 'season',
        icon: '📊',
        reward: { type: 'gold', amount: 300 },
        requirement: { type: 'points_total', target: 1000 },
        rarity: 'rare'
    },
    {
        id: 'artifact_collector',
        name: 'Artifact Collector',
        description: 'Own 5 artifacts at once.',
        lore: 'Your collection grows... and so does your power.',
        category: 'season',
        icon: '✨',
        reward: { type: 'gold', amount: 200 },
        requirement: { type: 'artifacts_owned', target: 5 },
        rarity: 'rare'
    },
    {
        id: 'big_spender',
        name: 'Big Spender',
        description: 'Spend 500 gold in the shop.',
        lore: 'Gold is meant to be spent... on power.',
        category: 'season',
        icon: '💸',
        reward: { type: 'reroll', amount: 2 },
        requirement: { type: 'gold_spent', target: 500 },
        rarity: 'rare'
    },
    {
        id: 'close_call',
        name: 'Heart Attack',
        description: 'Win a matchup by less than 5 points.',
        lore: 'Victory snatched from the jaws of defeat!',
        category: 'season',
        icon: '💓',
        reward: { type: 'gold', amount: 150 },
        requirement: { type: 'close_wins', target: 1 },
        rarity: 'rare'
    },
    {
        id: 'waiver_master',
        name: 'Waiver Master',
        description: 'Successfully claim 5 players from waivers.',
        lore: 'The mercenary camp knows you by name.',
        category: 'season',
        icon: '📜',
        reward: { type: 'gold', amount: 250 },
        requirement: { type: 'waiver_claims', target: 5 },
        rarity: 'rare'
    },
    {
        id: 'resilience',
        name: 'Resilience',
        description: 'Bounce back with a win after 2 consecutive losses.',
        lore: 'True warriors rise from the ashes of defeat.',
        category: 'season',
        icon: '🦅',
        reward: { type: 'gold', amount: 200 },
        requirement: { type: 'comeback_wins', target: 1 },
        rarity: 'rare'
    },

    // ═══════════════════════════════════════════════════════════════
    // COMMON QUESTS - Entry Level
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Win your first matchup of the season.',
        lore: 'Every legend begins with a single victory.',
        category: 'season',
        icon: '⚔️',
        reward: { type: 'gold', amount: 100 },
        requirement: { type: 'wins', target: 1 },
        rarity: 'common'
    },
    {
        id: 'triple_threat',
        name: 'Triple Threat',
        description: 'Win 3 matchups.',
        lore: 'Three times you fought. Three times you conquered.',
        category: 'season',
        icon: '🔱',
        reward: { type: 'gold', amount: 150 },
        requirement: { type: 'wins', target: 3 },
        rarity: 'common'
    },
    {
        id: 'five_victories',
        name: 'Battle Hardened',
        description: 'Win 5 matchups.',
        lore: 'Experience forges the strongest warriors.',
        category: 'season',
        icon: '🛡️',
        reward: { type: 'gold', amount: 200 },
        requirement: { type: 'wins', target: 5 },
        rarity: 'common'
    },
    {
        id: 'century_club',
        name: 'Century Club',
        description: 'Score 100+ points in a single week.',
        lore: 'Welcome to the club. Membership has its privileges.',
        category: 'season',
        icon: '💯',
        reward: { type: 'gold', amount: 100 },
        requirement: { type: 'points_single', target: 100 },
        rarity: 'common'
    },
    {
        id: 'treasure_hunter_1',
        name: 'Treasure Hunter I',
        description: 'Earn 300 gold throughout the season.',
        lore: 'Gold glitters in your pockets.',
        category: 'season',
        icon: '💰',
        reward: { type: 'gold', amount: 50 },
        requirement: { type: 'gold_earned', target: 300 },
        rarity: 'common',
        tier: 1
    },
    {
        id: 'treasure_hunter_2',
        name: 'Treasure Hunter II',
        description: 'Earn 600 gold throughout the season.',
        lore: 'Your vault begins to fill.',
        category: 'season',
        icon: '💰',
        reward: { type: 'gold', amount: 100 },
        requirement: { type: 'gold_earned', target: 600 },
        rarity: 'common',
        tier: 2,
        prerequisiteId: 'treasure_hunter_1'
    },
    {
        id: 'treasure_hunter_3',
        name: 'Treasure Hunter III',
        description: 'Earn 1000 gold throughout the season.',
        lore: 'Wealth beyond measure!',
        category: 'season',
        icon: '💰',
        reward: { type: 'reroll', amount: 1 },
        requirement: { type: 'gold_earned', target: 1000 },
        rarity: 'common',
        tier: 3,
        prerequisiteId: 'treasure_hunter_2'
    },
    {
        id: 'waiver_warrior',
        name: 'Waiver Warrior',
        description: 'Successfully claim 3 players from waivers.',
        lore: 'The mercenary camp welcomes you.',
        category: 'season',
        icon: '📜',
        reward: { type: 'gold', amount: 100 },
        requirement: { type: 'waiver_claims', target: 3 },
        rarity: 'common'
    },
    {
        id: 'first_artifact',
        name: 'Artifact Discovery',
        description: 'Acquire your first artifact.',
        lore: 'Power flows through this ancient relic.',
        category: 'season',
        icon: '🔮',
        reward: { type: 'gold', amount: 75 },
        requirement: { type: 'artifacts_owned', target: 1 },
        rarity: 'common'
    },
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Complete 10 matchups.',
        lore: 'You have seen battle. You know its ways.',
        category: 'season',
        icon: '🎖️',
        reward: { type: 'gold', amount: 150 },
        requirement: { type: 'games_played', target: 10 },
        rarity: 'common'
    },
    {
        id: 'full_season',
        name: 'Marathon Runner',
        description: 'Complete all 14 regular season matchups.',
        lore: 'You endured the long road. Respect.',
        category: 'season',
        icon: '🏃',
        reward: { type: 'gold', amount: 250 },
        requirement: { type: 'games_played', target: 14 },
        rarity: 'common'
    },

    // ═══════════════════════════════════════════════════════════════
    // HIDDEN QUESTS - Secrets
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'hidden_perfectionist',
        name: 'The Perfectionist',
        description: 'Win every single matchup of the season.',
        lore: 'Perfection achieved. The realm bows before you.',
        category: 'hidden',
        icon: '💎',
        reward: { type: 'title', itemName: 'The Perfectionist' },
        requirement: { type: 'wins', target: 14 },
        rarity: 'legendary'
    },
    {
        id: 'hidden_underdog',
        name: 'The Underdog',
        description: 'Win after being down 30+ points at halftime.',
        lore: 'Against all odds, you rose.',
        category: 'hidden',
        icon: '🐺',
        reward: { type: 'title', itemName: 'The Underdog' },
        requirement: { type: 'comeback_wins', target: 1 },
        rarity: 'epic'
    },
    {
        id: 'hidden_broke',
        name: 'Rags to Riches',
        description: 'Win a matchup while having 0 gold.',
        lore: 'Wealth means nothing. Skill is everything.',
        category: 'hidden',
        icon: '🪙',
        reward: { type: 'gold', amount: 500 },
        requirement: { type: 'wins', target: 1 },
        rarity: 'rare'
    },
];

// Sort quests by rarity (Legendary → Epic → Rare → Common)
const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

export function getQuestsSortedByRarity(quests: QuestDefinition[] = QUESTS) {
    return [...quests].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}

// Helper to get quests by category
export function getQuestsByCategory(category: QuestDefinition['category']) {
    return QUESTS.filter(q => q.category === category);
}

// Get non-hidden quests sorted
export function getVisibleQuestsSorted() {
    const visible = QUESTS.filter(q => q.category !== 'hidden');
    return getQuestsSortedByRarity(visible);
}

// Rarity styling config
export const QUEST_RARITY_CONFIG = {
    common: {
        bg: 'from-zinc-800/50 to-zinc-900/70',
        border: 'border-zinc-700/50',
        text: 'text-zinc-400',
        badge: 'bg-zinc-700/50 text-zinc-300',
        glow: ''
    },
    rare: {
        bg: 'from-blue-900/30 to-blue-950/50',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    },
    epic: {
        bg: 'from-purple-900/30 to-purple-950/50',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        badge: 'bg-purple-500/20 text-purple-300',
        glow: 'shadow-[0_0_20px_rgba(147,51,234,0.15)]'
    },
    legendary: {
        bg: 'from-amber-900/30 to-amber-950/50',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300',
        glow: 'shadow-[0_0_25px_rgba(251,191,36,0.2)]'
    }
};
