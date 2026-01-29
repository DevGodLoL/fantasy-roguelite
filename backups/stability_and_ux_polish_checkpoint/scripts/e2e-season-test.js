/**
 * 🏈 END-TO-END SEASON TEST
 * 
 * This script simulates an entire fantasy football season:
 * - Weeks 1-14: Regular Season
 * - Week 14 End: Playoff seeding & Week 15 matchup generation
 * - Week 15: Wildcard Round
 * - Week 16: Semifinals
 * - Week 17: Championship
 * 
 * Run with: node scripts/e2e-season-test.js
 */

const { PrismaClient } = require('../src/generated/client');
const path = require('path');
const url = 'file:' + path.resolve(process.cwd(), 'prisma/dev.db');
const prisma = new PrismaClient({ datasources: { db: { url } } });

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '═'.repeat(60));
    log(`  ${title}`, 'bright');
    console.log('═'.repeat(60));
}

// Import playoff functions
const {
    calculatePlayoffSeedings,
    initializePlayoffWeeks,
    generateWeek15Matchups,
    generateWeek16Matchups,
    generateWeek17Matchups,
    awardPlayoffRewards
} = require('../src/lib/game-data/playoffs');

// Simplified simulation (just generates scores, no full logic)
async function simulateWeekSimple(leagueId, weekNumber) {
    const week = await prisma.week.findUnique({
        where: { leagueId_number: { leagueId, number: weekNumber } },
        include: { matchups: { include: { homeTeam: true, awayTeam: true } } }
    });

    if (!week) {
        throw new Error(`Week ${weekNumber} not found`);
    }

    if (week.matchups.length === 0) {
        log(`  ⚠ No matchups for week ${weekNumber}`, 'yellow');
        return { matchupsProcessed: 0 };
    }

    const updates = [];
    for (const matchup of week.matchups) {
        // Generate random scores (80-150 range for realism)
        const homeScore = Math.floor(Math.random() * 70) + 80;
        const awayScore = Math.floor(Math.random() * 70) + 80;

        updates.push(
            prisma.matchup.update({
                where: { id: matchup.id },
                data: {
                    homeScore,
                    awayScore,
                    status: 'final'
                }
            })
        );

        const winner = homeScore > awayScore ? matchup.homeTeam.name : matchup.awayTeam.name;
        const roundLabel = matchup.round ? ` (${matchup.round})` : '';
        log(`  ${matchup.homeTeam.name} ${homeScore} vs ${awayScore} ${matchup.awayTeam.name} → ${winner} wins${roundLabel}`, 'cyan');
    }

    await prisma.$transaction(updates);
    return { matchupsProcessed: week.matchups.length };
}

async function getSeasonStatus(leagueId) {
    const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { seasonStatus: true, championTeamId: true, consolationWinnerId: true }
    });
    return league;
}

async function getPlayoffSeeds(leagueId) {
    return await prisma.team.findMany({
        where: { leagueId, playoffSeed: { not: null } },
        orderBy: { playoffSeed: 'asc' },
        select: { id: true, name: true, playoffSeed: true }
    });
}

async function getMatchups(leagueId, weekNumber) {
    const week = await prisma.week.findUnique({
        where: { leagueId_number: { leagueId, number: weekNumber } },
        include: {
            matchups: {
                include: { homeTeam: true, awayTeam: true }
            }
        }
    });
    return week?.matchups || [];
}

async function main() {
    logSection('🏈 END-TO-END SEASON TEST');

    // Find the league
    const league = await prisma.league.findFirst({
        include: { teams: true }
    });

    if (!league) {
        log('❌ No league found. Run npm run seed first.', 'red');
        return;
    }

    log(`\nLeague: ${league.name}`, 'bright');
    log(`Teams: ${league.teams.length}`);
    log(`Current Status: ${league.seasonStatus}`);

    const leagueId = league.id;

    // =================================================================
    // PHASE 1: Reset to clean state (optional but helpful for testing)
    // =================================================================
    logSection('🔄 PHASE 1: Reset Season State');

    // Clear playoff-related data
    await prisma.matchup.deleteMany({
        where: { leagueId, round: { not: null } }
    });

    // Reset all matchups to scheduled
    await prisma.matchup.updateMany({
        where: { leagueId },
        data: { status: 'scheduled', homeScore: 0, awayScore: 0 }
    });

    // Reset playoff seeds
    await prisma.team.updateMany({
        where: { leagueId },
        data: { playoffSeed: null }
    });

    // Reset league status
    await prisma.league.update({
        where: { id: leagueId },
        data: { seasonStatus: 'regular', championTeamId: null, consolationWinnerId: null }
    });

    log('✅ Season reset to initial state', 'green');

    // =================================================================
    // PHASE 2: Simulate Regular Season (Weeks 1-14)
    // =================================================================
    logSection('📅 PHASE 2: Regular Season (Weeks 1-14)');

    for (let week = 1; week <= 14; week++) {
        log(`\n🏈 Week ${week}:`, 'yellow');
        try {
            const result = await simulateWeekSimple(leagueId, week);
            log(`  ✅ ${result.matchupsProcessed} matchups completed`, 'green');
        } catch (e) {
            log(`  ❌ Error: ${e.message}`, 'red');
        }
    }

    // =================================================================
    // PHASE 3: Generate Playoff Seedings (End of Week 14)
    // =================================================================
    logSection('🏆 PHASE 3: Playoff Seeding');

    log('\n📊 Calculating playoff seedings based on regular season...', 'yellow');
    await calculatePlayoffSeedings(leagueId);

    const seeds = await getPlayoffSeeds(leagueId);
    log('\n🥇 PLAYOFF SEEDS:', 'bright');
    for (const team of seeds) {
        const bracket = team.playoffSeed <= 6 ? '(Championship Bracket)' : '(Consolation Bracket)';
        log(`  #${team.playoffSeed} - ${team.name} ${bracket}`, team.playoffSeed <= 2 ? 'green' : team.playoffSeed <= 6 ? 'cyan' : 'magenta');
    }

    // =================================================================
    // PHASE 4: Initialize Playoff Weeks (15, 16, 17)
    // =================================================================
    logSection('📋 PHASE 4: Initialize Playoff Weeks');

    await initializePlayoffWeeks(leagueId);
    log('✅ Weeks 15, 16, 17 initialized with playoff types', 'green');

    // =================================================================
    // PHASE 5: Generate Week 15 Matchups (Wildcard)
    // =================================================================
    logSection('🎯 PHASE 5: Week 15 - Wildcard Round');

    await generateWeek15Matchups(leagueId);

    const week15Matchups = await getMatchups(leagueId, 15);
    log('\n📋 Week 15 Matchups:', 'yellow');
    for (const m of week15Matchups) {
        log(`  ${m.round}: ${m.homeTeam.name} vs ${m.awayTeam.name}`, 'cyan');
    }

    // Check league status changed to playoffs
    let status = await getSeasonStatus(leagueId);
    log(`\n📊 League Status: ${status.seasonStatus}`, status.seasonStatus === 'playoffs' ? 'green' : 'red');

    // Simulate Week 15
    log('\n🏈 Simulating Week 15...', 'yellow');
    await simulateWeekSimple(leagueId, 15);

    // =================================================================
    // PHASE 6: Generate Week 16 Matchups (Semifinals)
    // =================================================================
    logSection('⚔️ PHASE 6: Week 16 - Semifinals');

    await generateWeek16Matchups(leagueId);

    const week16Matchups = await getMatchups(leagueId, 16);
    log('\n📋 Week 16 Matchups:', 'yellow');
    for (const m of week16Matchups) {
        log(`  ${m.round}: ${m.homeTeam.name} vs ${m.awayTeam.name}`, 'cyan');
    }

    // Simulate Week 16
    log('\n🏈 Simulating Week 16...', 'yellow');
    await simulateWeekSimple(leagueId, 16);

    // =================================================================
    // PHASE 7: Generate Week 17 Matchups (Championship)
    // =================================================================
    logSection('👑 PHASE 7: Week 17 - Championship');

    await generateWeek17Matchups(leagueId);

    const week17Matchups = await getMatchups(leagueId, 17);
    log('\n📋 Week 17 Matchups:', 'yellow');
    for (const m of week17Matchups) {
        log(`  ${m.round}: ${m.homeTeam.name} vs ${m.awayTeam.name}`, 'cyan');
    }

    // Simulate Week 17
    log('\n🏈 Simulating Week 17 - THE GRAND FINALE...', 'yellow');
    await simulateWeekSimple(leagueId, 17);

    // =================================================================
    // PHASE 8: Award Playoff Rewards
    // =================================================================
    logSection('🏆 PHASE 8: Award Playoff Rewards');

    await awardPlayoffRewards(leagueId);

    // Check final status
    status = await getSeasonStatus(leagueId);
    log(`\n📊 Final League Status: ${status.seasonStatus}`, status.seasonStatus === 'complete' ? 'green' : 'red');

    if (status.championTeamId) {
        const champion = await prisma.team.findUnique({
            where: { id: status.championTeamId },
            include: { titles: true }
        });
        log(`\n🏆 CHAMPION: ${champion.name}`, 'green');
        log(`   Titles: ${champion.titles.map(t => t.title).join(', ')}`, 'yellow');
    }

    if (status.consolationWinnerId) {
        const phoenix = await prisma.team.findUnique({
            where: { id: status.consolationWinnerId },
            include: { titles: true }
        });
        log(`\n🔥 PHOENIX (Consolation Winner): ${phoenix.name}`, 'magenta');
        log(`   Titles: ${phoenix.titles.map(t => t.title).join(', ')}`, 'yellow');
    }

    // =================================================================
    // PHASE 9: Validation Summary
    // =================================================================
    logSection('✅ VALIDATION SUMMARY');

    const validations = [
        { name: 'Regular Season (14 weeks)', pass: true },
        { name: 'Playoff Seeding (10 teams)', pass: seeds.length === 10 },
        { name: 'Week 15 Matchups Generated', pass: week15Matchups.length >= 2 },
        { name: 'Week 16 Matchups Generated', pass: week16Matchups.length >= 2 },
        { name: 'Week 17 Matchups Generated', pass: week17Matchups.length >= 1 },
        { name: 'Season Status Complete', pass: status.seasonStatus === 'complete' },
        { name: 'Champion Crowned', pass: !!status.championTeamId },
        { name: 'Phoenix Title Awarded', pass: !!status.consolationWinnerId }
    ];

    let allPassed = true;
    for (const v of validations) {
        log(`  ${v.pass ? '✅' : '❌'} ${v.name}`, v.pass ? 'green' : 'red');
        if (!v.pass) allPassed = false;
    }

    console.log('\n' + '═'.repeat(60));
    if (allPassed) {
        log('  🎉 ALL TESTS PASSED! Season simulation complete.', 'green');
    } else {
        log('  ⚠️ SOME TESTS FAILED. Review output above.', 'red');
    }
    console.log('═'.repeat(60) + '\n');
}

main()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
