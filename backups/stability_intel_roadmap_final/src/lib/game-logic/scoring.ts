import { db } from "@/lib/prisma";
import { QUESTS } from "@/lib/game-data/quests";

export interface RunReward {
    type: 'gold' | 'reroll' | 'artifact' | 'buff';
    value: string;
    label: string;
    icon: string;
}

export interface SeasonScoreBreakdown {
    baseScore: number;
    winsScore: number;
    championshipBonus: number;
    questBonus: number;
    goldBonus: number;
    artifactBonus: number;
    totalScore: number;
    rankGrade: string; // S+, S, A, B, C, D, F

    // Meta Progression
    prestigeXP: number;
    achievements: string[];
    rewards: RunReward[];

    // Summary Stats
    summary: {
        wins: number;
        losses: number;
        finalGold: number;
        artifactsCount: number;
    };
}

export async function calculateSeasonScore(leagueId: string, teamId: string): Promise<SeasonScoreBreakdown> {
    const team = await db.team.findUnique({
        where: { id: teamId },
        include: {
            powerups: true,
            homeMatchups: { where: { status: 'final' } },
            awayMatchups: { where: { status: 'final' } }
        }
    });

    if (!team) throw new Error("Team not found");

    // 1. Calculate Record
    let wins = 0;
    let losses = 0;
    const allMatchups = [
        ...team.homeMatchups,
        ...team.awayMatchups
    ];

    for (const m of allMatchups) {
        const isHome = m.homeTeamId === teamId;
        const myScore = isHome ? m.homeScore : m.awayScore;
        const oppScore = isHome ? m.awayScore : m.homeScore;
        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
    }

    // 2. Scoring Components
    const WINS_MULTIPLIER = 100;
    const winsScore = wins * WINS_MULTIPLIER;
    const championshipBonus = team.playoffSeed === 1 ? 500 : 0; // Simplified

    // Quest Heuristic (placeholder: +50 per win > 10)
    let questBonus = wins > 10 ? 300 : 0;
    if (team.gold > 1000) questBonus += 200;

    // Gold & Artifacts
    const goldBonus = Math.floor(team.gold * 0.5);
    const artifactBonus = team.powerups.length * 150;

    // Total Score
    const total = winsScore + championshipBonus + questBonus + goldBonus + artifactBonus;

    // 3. Rank & Prestige
    let rank = 'F';
    let prestigeXP = Math.floor(total / 10);

    if (total > 3500) { rank = 'S+'; prestigeXP = Math.floor(total / 5); }
    else if (total > 3000) { rank = 'S'; prestigeXP = Math.floor(total / 6); }
    else if (total > 2500) rank = 'A';
    else if (total > 2000) rank = 'B';
    else if (total > 1500) rank = 'C';
    else if (total > 1000) rank = 'D';

    // 4. Generate Achievements
    const achievements: string[] = [];
    if (wins >= 14) achievements.push("Perfect Regular Season");
    if (wins >= 10) achievements.push("Dominant Force");
    if (team.gold >= 1000) achievements.push("Dragon's Hoard");
    if (team.powerups.length >= 8) achievements.push("Artifact Collector");
    if (championshipBonus > 0) achievements.push("Seed #1 Conqueror");
    if (achievements.length === 0) achievements.push("Participant");

    // 5. Calculate Next Run Rewards
    const rewards: RunReward[] = [];

    // Base Reward: Legacy Gold
    const legacyGold = Math.floor(team.gold * 0.1);
    if (legacyGold > 0) {
        rewards.push({
            type: 'gold',
            value: `+${legacyGold}`,
            label: 'Legacy Gold',
            icon: '💰'
        });
    }

    // Rank Based Rewards
    if (['S+', 'S', 'A'].includes(rank)) {
        rewards.push({
            type: 'artifact',
            value: 'Keeper',
            label: 'Keep 1 Artifact',
            icon: '💎'
        });
    }

    if (['S+', 'S'].includes(rank)) {
        rewards.push({
            type: 'buff',
            value: '+5% XP',
            label: 'Veteran Status',
            icon: '⭐'
        });
    }

    // Pity Reward
    if (rank === 'F' || rank === 'D') {
        rewards.push({
            type: 'reroll',
            value: '+3',
            label: 'Pity Rerolls',
            icon: '🎲'
        });
    }

    return {
        baseScore: 0,
        winsScore,
        championshipBonus,
        questBonus,
        goldBonus,
        artifactBonus,
        totalScore: total,
        rankGrade: rank,
        prestigeXP,
        achievements,
        rewards,
        summary: {
            wins,
            losses,
            finalGold: team.gold,
            artifactsCount: team.powerups.length
        }
    };
}
