
import { Archetype } from "../game-data/personalities";

/**
 * CORE TYPES
 */
export interface PlayerStats {
    passYds: number;
    rushYds: number;
    recYds: number;
    tds: number;
    fumbles: number;
}

export interface PlayerPerformance {
    points: number;
    stats: PlayerStats;
    mutations: any[]; // Potential new traits
}

export interface SimTeam {
    id: string;
    ownerId: string;
    archetype: Archetype;
    rosterSlots: any[];
    powerups: any[];
    commanderTalents?: string[]; // Array of talent codes
}

export interface SimResult {
    // ... same as before
    score: number;
    fumbles: number;
    goldMultiplier: number;
    bonusGold: number;
    highestPlayerScore: number;
    positionScores: Record<string, number>;
    log: string[];
    playerPerformances: Record<string, PlayerPerformance>; // playerId -> performance
}

/**
 * 1. PLAYER STAT GENERATOR (The Mock Engine)
 * Centralized logic for generating deterministic-style random stats.
 */
export function generatePlayerStats(pos: string, archetype: Archetype = 'BALANCED'): { points: number; stats: PlayerStats } {
    let points = 0;
    const stats: PlayerStats = { passYds: 0, rushYds: 0, recYds: 0, tds: 0, fumbles: 0 };

    // Variance factor based on archetype
    let variance = 1.0;
    if (archetype === 'AGGRESSIVE') variance = 1.2;
    if (archetype === 'CONSERVATIVE') variance = 0.8;
    if (archetype === 'CHAOTIC') variance = 0.5 + Math.random() * 1.5;

    switch (pos) {
        case "QB":
            stats.passYds = Math.floor((Math.random() * 250 + 150) * variance);
            stats.rushYds = Math.floor(Math.random() * 40 * variance);
            stats.tds = Math.floor(Math.random() * 3 * variance);
            points = (stats.passYds * 0.04) + (stats.rushYds * 0.1) + (stats.tds * 4);
            break;
        case "RB":
            stats.rushYds = Math.floor((Math.random() * 100 + 40) * variance);
            stats.recYds = Math.floor(Math.random() * 30 * variance);
            stats.tds = Math.floor(Math.random() * 2 * variance);
            points = (stats.rushYds * 0.1) + (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "WR":
            stats.recYds = Math.floor((Math.random() * 110 + 30) * variance);
            stats.tds = Math.floor(Math.random() * 2 * variance);
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "TE":
            stats.recYds = Math.floor((Math.random() * 70 + 10) * variance);
            stats.tds = Math.random() > (0.7 / variance) ? 1 : 0;
            points = (stats.recYds * 0.1) + (stats.tds * 6);
            break;
        case "K":
            points = Math.floor(Math.random() * 15 * variance);
            break;
        case "DST":
            points = Math.floor(Math.random() * 20 * variance);
            break;
        default:
            points = Math.random() * 10 * variance;
    }

    // Fumble Logic
    const fumbleChance = archetype === 'CONSERVATIVE' ? 0.03 : (archetype === 'AGGRESSIVE' ? 0.08 : 0.05);
    if (Math.random() < fumbleChance) {
        stats.fumbles = 1;
        // Archetype impact on fumble penalty
        const penalty = (archetype === 'CONSERVATIVE') ? 1 : (archetype === 'AGGRESSIVE' ? 4 : 2);
        points -= penalty;
    }

    return { points: parseFloat(points.toFixed(2)), stats };
}

/**
 * 2. TEAM SIMULATION ENGINE
 */
export async function simulateTeamPerformance(
    team: SimTeam,
    opponent: SimTeam,
    weekNumber: number
): Promise<SimResult> {
    let totalScore = 0;
    let totalFumbles = 0;
    let goldMultiplier = 1.0;
    let bonusGold = 0;
    let highestPlayerScore = 0;
    const positionScores: Record<string, number> = {};
    const log: string[] = [];
    const playerPerformances: Record<string, PlayerPerformance> = {};

    const archetype = team.archetype;
    const talents = team.commanderTalents || [];

    // T1: Merchant talent (+10% Gold)
    if (talents.includes('MERCHANT')) {
        goldMultiplier *= 1.1;
        log.push("[Talent: Merchant] +10% Gold Multiplier");
    }

    // A. Archetype Global Effects (Pre-Roster)
    if (archetype === 'GREEDY') {
        bonusGold += 20;
        totalScore -= 5;
        log.push("The Miser: +20 Gold, -5 Pts (Distracted by wealth)");
    }
    if (archetype === 'CHAOTIC') {
        const chaosRoll = 0.7 + Math.random() * 0.7; // 0.7x to 1.4x
        totalScore *= (chaosRoll); // Simplified for now
        log.push(`The Mutant: Chaos Multiplier x${chaosRoll.toFixed(2)} applied`);
    }

    // B. Player-Level Simulation
    for (const slot of team.rosterSlots) {
        if (!slot.player) continue;

        const { points: rawPoints, stats } = generatePlayerStats(slot.player.position, archetype);
        let finalPoints = rawPoints;

        // 1. Apply Persistent Traits
        if (slot.player.traits) {
            for (const trait of slot.player.traits) {
                if (trait.kind === 'multiplier') finalPoints *= trait.value;
                if (trait.kind === 'bonus_flat') finalPoints += trait.value;
            }
        }

        // T2: Brawler talent (+1.5% Offense)
        if (talents.includes('BRAWLER') && ['QB', 'RB', 'WR', 'TE'].includes(slot.player.position)) {
            finalPoints *= 1.015;
        }
        // T2: Bastion talent (+3% Defense/Kicker)
        if (talents.includes('BASTION') && ['DST', 'K'].includes(slot.player.position)) {
            finalPoints *= 1.03;
        }

        // 2. Relic Effects (Position-Specific)
        const activeRelics = team.powerups.filter(p => p.powerup.type === 'relic' && !p.isConsumed);
        let relicMod = (archetype === 'MASTERMIND') ? 1.25 : 1.0;

        // T3: Curator talent (Relics +10% stronger)
        if (talents.includes('CURATOR')) {
            relicMod *= 1.1;
        }

        for (const tp of activeRelics) {
            const p = tp.powerup;
            if (p.code === 'relic_necromancy') {
                if (slot.player.position === 'TE') finalPoints *= (1.5 * relicMod);
                if (slot.player.position === 'WR') finalPoints *= (0.9 / relicMod); // Nerf WRs
            }
            if (p.code === 'relic_vampire_fang' && slot.player.position === 'DST') {
                finalPoints += (5 * relicMod);
            }
            if (p.code === 'relic_rush_bonus' && stats.rushYds > 0) {
                finalPoints += Math.floor(stats.rushYds / 10) * relicMod;
            }
        }

        // Only add to score if NOT on bench
        if (slot.slotType !== "BENCH") {
            totalScore += finalPoints;
            totalFumbles += stats.fumbles;

            // Track for missions/stats
            positionScores[slot.player.position] = (positionScores[slot.player.position] || 0) + finalPoints;
            if (finalPoints > highestPlayerScore) highestPlayerScore = finalPoints;
        }

        // Store performance for DB persistence
        playerPerformances[slot.player.id] = {
            points: parseFloat(finalPoints.toFixed(2)),
            stats,
            mutations: []
        };
    }

    // C. Team-Level Powerups (Consumables)
    const myActivePowerups = team.powerups.filter(p => p.powerup.type === 'card' && !p.isConsumed);
    for (const tp of myActivePowerups) {
        const p = tp.powerup;
        if (p.kind === 'points_flat' && p.scope === 'self') {
            totalScore += (p.value || 0);
            log.push(`Used ${p.name}: +${p.value} pts`);
        }
        if (p.kind === 'points_multiplier' && p.scope === 'self') {
            totalScore *= (p.value || 1);
            log.push(`Used ${p.name}: x${p.value} score`);
        }
        if (p.kind === 'gold_multiplier') {
            goldMultiplier *= (p.value || 1);
        }
    }

    // D. Enemy Interference
    const enemyCurses = opponent.powerups.filter(p => !p.isConsumed && p.powerup.scope === 'opponent');
    for (const tp of enemyCurses) {
        const p = tp.powerup;
        if (p.kind === 'points_flat_penalty') {
            totalScore -= (p.value || 0);
            log.push(`Cursed by ${p.name}: -${p.value} pts`);
        }
        if (p.kind === 'points_multiplier_penalty') {
            totalScore *= (p.value || 1);
            log.push(`Cursed by ${p.name}: x${p.value} multiplier`);
        }
    }

    // E. Archetype Global Effects (Post-Simulation)
    if (archetype === 'HOARDER') {
        const relicCount = team.powerups.filter(p => p.powerup.type === 'relic').length;
        totalScore += relicCount;
        log.push(`The Collector: +${relicCount} Pts for owned relics`);
    }
    if (archetype === 'GREEDY') {
        goldMultiplier *= 1.5;
        log.push("The Miser: x1.5 Gold Multiplier");
    }

    return {
        score: Math.max(0, parseFloat(totalScore.toFixed(2))),
        fumbles: totalFumbles,
        goldMultiplier,
        bonusGold,
        highestPlayerScore,
        positionScores,
        log,
        playerPerformances
    };
}
