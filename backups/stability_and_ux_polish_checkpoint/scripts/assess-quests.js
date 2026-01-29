const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const matchups = await prisma.matchup.findMany({
        where: { status: 'final' }
    });

    const homeScores = matchups.map(m => m.homeScore);
    const awayScores = matchups.map(m => m.awayScore);
    const allScores = [...homeScores, ...awayScores];

    const maxScore = Math.max(...allScores);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    console.log('--- SCORE ASSESSMENT ---');
    console.log(`Max Score: ${maxScore}`);
    console.log(`Avg Score: ${avgScore}`);
    console.log(`Scores over 150: ${allScores.filter(s => s >= 150).length}`);
    console.log(`Scores over 200: ${allScores.filter(s => s >= 200).length}`);

    const teams = await prisma.team.findMany({
        include: {
            homeMatchups: { where: { status: 'final' } },
            awayMatchups: { where: { status: 'final' } }
        }
    });

    console.log('\n--- TEAM ASSESSMENT ---');
    teams.forEach(t => {
        const matches = [...t.homeMatchups, ...t.awayMatchups];
        const wins = matches.filter(m => {
            const isHome = m.homeTeamId === t.id;
            return isHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
        }).length;
        const totalPoints = matches.reduce((sum, m) => sum + (m.homeTeamId === t.id ? m.homeScore : m.awayScore), 0);
        console.log(`Team: ${t.name} | Wins: ${wins} | Total Points: ${totalPoints}`);
    });

    await prisma.$disconnect();
}

main();
