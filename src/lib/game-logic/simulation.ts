
import { db } from "../prisma";

interface MatchupTeam {
    id: string;
    rosterSlots: any[];
    powerups: any[];
}

interface SimResult {
    score: number;
    goldEarned: number;
    fumbles: number;
    log: string[];
}

// Config for Item Logic
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"];

// Helper to generate stats (Mock Engine)
const generateStats = (pos: string) => {
    let points = 0;
    let stats = { passYds: 0, rushYds: 0, recYds: 0, tds: 0, fumbles: 0 };

    switch (pos) {
        case "QB":
            stats.passYds = Math.floor(Math.random() * 250 + 150);
            stats.rushYds = Math.floor(Math.random() * 40);
            stats.tds = Math.floor(Math.random() * 3);
            points = (stats.passYds * 0.04) + (stats.rushYds * 0.1) + (stats.tds * 4);
            break;
        case "RB":
            stats.rushYds = Math.floor(Math.random() * 100 + 40);
            stats.recYds = Math.floor(Math.random() * 30);
            stats.tds = Math.floor(Math.random() * 2);
            points = (stats.rushYds * 0.1) + (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "WR":
            stats.recYds = Math.floor(Math.random() * 110 + 30);
            stats.tds = Math.floor(Math.random() * 2);
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "TE":
            stats.recYds = Math.floor(Math.random() * 70 + 10);
            stats.tds = Math.random() > 0.7 ? 1 : 0;
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "K": points = Math.floor(Math.random() * 15); break;
        case "DST": points = Math.floor(Math.random() * 20); break;
        default: points = Math.random() * 10;
    }

    if (Math.random() < 0.05) {
        stats.fumbles = 1;
        points -= 2;
    }

    return { points: parseFloat(points.toFixed(2)), stats };
};

/**
 * Calculates the total score for a team, applying all Relics and Consumables.
 */
export async function simulateTeamPerformance(
    team: MatchupTeam,
    opponent: MatchupTeam
): Promise<SimResult> {
    let totalScore = 0;
    let totalFumbles = 0;
    let goldMultiplier = 1.0;
    let bonusGold = 0;
    const log: string[] = [];

    // 1. Base Player Performance (Roster)
    for (const slot of team.rosterSlots) {
        if (slot.player && slot.slotType !== "BENCH") {
            const { points, stats } = generateStats(slot.player.position);
            let finalPoints = points;

            // Player Traits (Mutations)
            if (slot.player.traits) {
                for (const trait of slot.player.traits) {
                    if (trait.kind === 'multiplier') finalPoints *= trait.value;
                    if (trait.kind === 'bonus_flat') finalPoints += trait.value;
                }
            }

            // Relic: Position Bonuses (e.g., Necromancer's Cowl)
            const activeRelics = team.powerups.filter(p => p.powerup.type === 'relic' && !p.isConsumed);
            for (const tp of activeRelics) {
                const p = tp.powerup;

                // Example: Necromancer (TE Boost, WR Nerf)
                if (p.code === 'relic_necromancy') {
                    if (slot.player.position === 'TE') finalPoints *= 1.5;
                    // if (slot.player.position === 'WR') finalPoints *= 0.9;
                }

                // Example: Vampire's Fang (Defensive Boost? Or Life Drain?)
                // Let's make it simple: +Points for DST
                if (p.code === 'relic_vampire_fang' && slot.player.position === 'DST') {
                    finalPoints += 5;
                }
            }

            totalScore += finalPoints;
            totalFumbles += stats.fumbles;
        }
    }

    // 2. Apply Team-Level Effects (Consumables & Global Relics)
    // We process both OUR powerups (Self) and OPPONENT powerups (Opponent Scope)

    // A. Self Buffs
    const myActivePowerups = team.powerups.filter(p => !p.isConsumed);
    for (const tp of myActivePowerups) {
        const p = tp.powerup;

        // Gold Bonuses (Golden Gauntlet)
        if (p.kind === 'gold_multiplier' && p.type === 'relic') {
            goldMultiplier *= (p.value || 1);
        }

        // Flat Point Contracts (Mercenary Contract)
        if (p.kind === 'points_flat' && p.scope === 'self') {
            totalScore += (p.value || 0);
            log.push(`Used ${p.name}: +${p.value} pts`);
        }

        // Multiplier Potions (Potion of Rage)
        if (p.kind === 'points_multiplier' && p.scope === 'self') {
            totalScore *= (p.value || 1);
            log.push(`Used ${p.name}: x${p.value} score`);
        }
    }

    // B. Opponent Curses (Applied by Opponent to US)
    const enemyOffensivePowerups = opponent.powerups.filter(p => !p.isConsumed && p.powerup.scope === 'opponent');
    for (const tp of enemyOffensivePowerups) {
        const p = tp.powerup;

        // Sniper's Mark (Flat Penalty)
        if (p.kind === 'points_flat_penalty') {
            totalScore -= (p.value || 0);
            log.push(`Hit by Enemy ${p.name}: -${p.value} pts`);
        }

        // Weakness Potion?
        if (p.kind === 'points_multiplier_penalty') {
            totalScore *= (p.value || 1);
            log.push(`Hit by Enemy ${p.name}: Reduced to ${p.value * 100}%`);
        }
    }

    // 3. Calculate Gold
    // Base gold is handled by the caller (Win/Loss), but we return the multiplier
    // Or we returns the "Earned" amount if we want.
    // Let's return just the multiplier context or handle it in result?
    // We'll return 0 gold here because gold depends on Win/Loss which we don't know yet.
    // Instead we return goldMultiplier to be applied later.

    return {
        score: Math.max(0, parseFloat(totalScore.toFixed(2))),
        goldEarned: 0, // Placeholder, calculated properly in resolution
        fumbles: totalFumbles,
        log
    };
}
