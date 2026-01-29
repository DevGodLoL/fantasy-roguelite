const { PrismaClient } = require('../src/generated/client');

const prisma = new PrismaClient();

const LEAGUE_ID = "cmkkduxj7000244874uxowu3o"; // Hardcoded for this session
const TARGET_WEEK = 8;

async function main() {
    console.log(`Rewinding/Fast-forwarding to Week ${TARGET_WEEK}...`);

    // 1. Get all weeks
    const weeks = await prisma.week.findMany({
        where: { leagueId: LEAGUE_ID },
        orderBy: { number: 'asc' }
    });

    // 2. Update Weeks (Skipped as Week has no status field)
    // Status is determined by matchups

    // 3. Update Matchups (Generate random scores for completed weeks if needed)
    const matchups = await prisma.matchup.findMany({
        where: { leagueId: LEAGUE_ID },
        include: { week: true }
    });

    for (const matchup of matchups) {
        if (matchup.week.number < TARGET_WEEK) {
            // Complete past matchups if not already
            if (matchup.status !== 'final') {
                const homeScore = 80 + Math.random() * 60; // 80-140
                const awayScore = 80 + Math.random() * 60;
                await prisma.matchup.update({
                    where: { id: matchup.id },
                    data: {
                        status: 'final',
                        homeScore: parseFloat(homeScore.toFixed(2)),
                        awayScore: parseFloat(awayScore.toFixed(2)),
                    }
                });
            }
        } else if (matchup.week.number === TARGET_WEEK) {
            // Reset current week to scheduled
            await prisma.matchup.update({
                where: { id: matchup.id },
                data: {
                    status: 'scheduled',
                    homeScore: 0,
                    awayScore: 0,
                }
            });
        } else {
            // Future weeks scheduled
            await prisma.matchup.update({
                where: { id: matchup.id },
                data: {
                    status: 'scheduled',
                    homeScore: 0,
                    awayScore: 0,
                }
            });
        }
    }

    // 4. Ensure Playoffs are not active
    await prisma.league.update({
        where: { id: LEAGUE_ID },
        data: {
            championTeamId: null,
            seasonStatus: "regular"
        }
    })

    // 5. Reset any rewards claimed flag if consistent text
    const teams = await prisma.team.findMany({ where: { leagueId: LEAGUE_ID } });
    for (const team of teams) {
        await prisma.team.update({
            where: { id: team.id },
            data: { rewardsClaimed: false }
        });
    }


    console.log("Welcome to Week 8.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
