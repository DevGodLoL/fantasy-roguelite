/**
 * Script to advance a league to Week 14 (end of regular season)
 * and trigger playoff generation
 */
const { PrismaClient } = require('../src/generated/client');
const path = require('path');
const url = 'file:' + path.resolve(process.cwd(), 'prisma/dev.db');
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
    console.log('🏈 Advancing league to playoffs...\n');

    // Find the first league
    const league = await prisma.league.findFirst({
        include: {
            teams: true,
            weeks: { orderBy: { number: 'asc' } }
        }
    });

    if (!league) {
        console.log('❌ No league found');
        return;
    }

    console.log(`Found league: ${league.name}`);
    console.log(`Teams: ${league.teams.length}`);
    console.log(`Weeks: ${league.weeks.length}`);

    // Check current status
    console.log(`\nCurrent status: ${league.seasonStatus}`);

    // Count completed weeks
    const completedWeeks = await prisma.matchup.groupBy({
        by: ['weekId'],
        where: { leagueId: league.id, status: 'final' }
    });

    console.log(`Completed weeks: ${completedWeeks.length}`);

    // If we already have playoff matchups, show them
    const playoffMatchups = await prisma.matchup.findMany({
        where: {
            leagueId: league.id,
            round: { not: null }
        },
        include: {
            homeTeam: true,
            awayTeam: true,
            week: true
        }
    });

    if (playoffMatchups.length > 0) {
        console.log('\n🏆 PLAYOFF MATCHUPS:');
        for (const m of playoffMatchups) {
            console.log(`  Week ${m.week.number} (${m.round}): ${m.homeTeam.name} vs ${m.awayTeam.name} [${m.status}]`);
        }
    } else {
        console.log('\n📋 No playoff matchups yet.');
        console.log('Run simulation through Week 14 to trigger playoff generation.');
    }

    // Show playoff seeds if any
    const seededTeams = await prisma.team.findMany({
        where: { leagueId: league.id, playoffSeed: { not: null } },
        orderBy: { playoffSeed: 'asc' }
    });

    if (seededTeams.length > 0) {
        console.log('\n🥇 PLAYOFF SEEDS:');
        for (const t of seededTeams) {
            console.log(`  #${t.playoffSeed} - ${t.name}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
