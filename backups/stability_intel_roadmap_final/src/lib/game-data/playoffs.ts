import { db } from "@/lib/prisma";

/**
 * Calculates and updates playoff seedings for all teams in a league
 * based on regular season performance.
 */
export async function calculatePlayoffSeedings(leagueId: string) {
    // 1. Get all teams and their final regular season stats
    const teams = await db.team.findMany({
        where: { leagueId },
        include: {
            homeMatchups: {
                where: {
                    status: "final",
                    week: { number: { lte: 14 } }
                },
                include: { week: true }
            },
            awayMatchups: {
                where: {
                    status: "final",
                    week: { number: { lte: 14 } }
                },
                include: { week: true }
            },
        }
    });

    // 2. Calculate records (Wins, Points Scored)
    const teamsWithRecords = teams.map(team => {
        let wins = 0;
        let pointsScored = 0;

        const allPlayed = [...team.homeMatchups, ...team.awayMatchups];
        for (const m of allPlayed) {
            if (m.homeTeamId === team.id) {
                pointsScored += m.homeScore;
                if (m.homeScore > m.awayScore) wins++;
            } else {
                pointsScored += m.awayScore;
                if (m.awayScore > m.homeScore) wins++;
            }
        }

        return {
            id: team.id,
            wins,
            pointsScored,
            name: team.name
        };
    });

    // 3. Sort by wins (primary) then points scored (tiebreaker)
    teamsWithRecords.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.pointsScored - a.pointsScored;
    });

    // 4. Update seeds in database
    const updates = teamsWithRecords.map((team, index) => {
        return db.team.update({
            where: { id: team.id },
            data: { playoffSeed: index + 1 }
        });
    });

    await db.$transaction(updates);

    return teamsWithRecords;
}

/**
 * Initializes playoff weeks (15, 16, 17) for the league
 */
export async function initializePlayoffWeeks(leagueId: string) {
    const regularSeasonWeeks = 14;

    for (let i = 1; i <= 3; i++) {
        const weekNum = regularSeasonWeeks + i;
        let type = "regular";
        if (i === 1) type = "wildcard";
        else if (i === 2) type = "semifinal";
        else if (i === 3) type = "championship";

        await db.week.upsert({
            where: { leagueId_number: { leagueId, number: weekNum } },
            update: { type },
            create: {
                leagueId,
                number: weekNum,
                type
            }
        });
    }
}

/**
 * Generates initial matchups for the first round of playoffs (Week 15)
 */
export async function generateWeek15Matchups(leagueId: string) {
    const seeds = await db.team.findMany({
        where: { leagueId, playoffSeed: { not: null } },
        orderBy: { playoffSeed: "asc" }
    });

    const week15 = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: 15 } }
    });

    if (!week15) throw new Error("Week 15 not initialized");

    const transactions = [];

    // WINNERS BRACKET (Seeds 1-6)
    // #1 and #2 get BYE (no matchup created for them in Week 15)

    // Matchup: #3 vs #6
    const seed3 = seeds.find(t => t.playoffSeed === 3);
    const seed6 = seeds.find(t => t.playoffSeed === 6);
    if (seed3 && seed6) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week15.id,
                homeTeamId: seed3.id,
                awayTeamId: seed6.id,
                bracket: "winners",
                round: "wildcard"
            }
        }));
    }

    // Matchup: #4 vs #5
    const seed4 = seeds.find(t => t.playoffSeed === 4);
    const seed5 = seeds.find(t => t.playoffSeed === 5);
    if (seed4 && seed5) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week15.id,
                homeTeamId: seed4.id,
                awayTeamId: seed5.id,
                bracket: "winners",
                round: "wildcard"
            }
        }));
    }

    // LOSERS BRACKET (Seeds 7-10)
    // Matchup: #7 vs #10
    // Matchup: #8 vs #9

    const seed7 = seeds.find(t => t.playoffSeed === 7);
    const seed10 = seeds.find(t => t.playoffSeed === 10);
    if (seed7 && seed10) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week15.id,
                homeTeamId: seed7.id,
                awayTeamId: seed10.id,
                bracket: "losers",
                round: "consolation_semi"
            }
        }));
    }

    const seed8 = seeds.find(t => t.playoffSeed === 8);
    const seed9 = seeds.find(t => t.playoffSeed === 9);
    if (seed8 && seed9) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week15.id,
                homeTeamId: seed8.id,
                awayTeamId: seed9.id,
                bracket: "losers",
                round: "consolation_semi"
            }
        }));
    }

    if (transactions.length > 0) {
        await db.$transaction(transactions);
    }

    // Set league status to playoffs
    await db.league.update({
        where: { id: leagueId },
        data: { seasonStatus: "playoffs" }
    });
}

/**
 * Generates matchups for Week 16 based on Week 15 results
 */
export async function generateWeek16Matchups(leagueId: string) {
    const week15 = await db.week.findFirst({
        where: { leagueId, number: 15 },
        include: { matchups: true }
    });

    const week16 = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: 16 } }
    });

    if (!week15 || !week16) throw new Error("Weeks not found");

    const seeds = await db.team.findMany({
        where: { leagueId, playoffSeed: { not: null } },
        orderBy: { playoffSeed: "asc" }
    });

    const transactions = [];

    // --- WINNERS BRACKET (Semifinals) ---
    const wildcardMatchups = week15.matchups.filter(m => m.bracket === "winners");
    const wildcardWinners = wildcardMatchups.map(m => {
        return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    });

    if (wildcardWinners.length === 2) {
        // Get winner team objects to check seeds for re-seeding
        const winnerTeams = await db.team.findMany({
            where: { id: { in: wildcardWinners } }
        });
        winnerTeams.sort((a, b) => (a.playoffSeed || 0) - (b.playoffSeed || 0));

        const seed1 = seeds.find(t => t.playoffSeed === 1);
        const seed2 = seeds.find(t => t.playoffSeed === 2);

        const lowestSeedWinner = winnerTeams[winnerTeams.length - 1];
        const highestSeedWinner = winnerTeams[0];

        if (seed1 && lowestSeedWinner) {
            transactions.push(db.matchup.create({
                data: {
                    leagueId,
                    weekId: week16.id,
                    homeTeamId: seed1.id,
                    awayTeamId: lowestSeedWinner.id,
                    bracket: "winners",
                    round: "semifinal"
                }
            }));
        }

        if (seed2 && highestSeedWinner) {
            transactions.push(db.matchup.create({
                data: {
                    leagueId,
                    weekId: week16.id,
                    homeTeamId: seed2.id,
                    awayTeamId: highestSeedWinner.id,
                    bracket: "winners",
                    round: "semifinal"
                }
            }));
        }
    }

    // --- LOSERS BRACKET (Consolation Final) ---
    const consolationSemis = week15.matchups.filter(m => m.bracket === "losers");
    const consolationWinners = consolationSemis.map(m => {
        return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    });

    if (consolationWinners.length === 2) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week16.id,
                homeTeamId: consolationWinners[0],
                awayTeamId: consolationWinners[1],
                bracket: "losers",
                round: "consolation_final"
            }
        }));
    }

    if (transactions.length > 0) {
        await db.$transaction(transactions);
    }
}

/**
 * Generates matchups for Week 17 based on Week 16 results
 */
export async function generateWeek17Matchups(leagueId: string) {
    const week16 = await db.week.findFirst({
        where: { leagueId, number: 16 },
        include: { matchups: true }
    });

    const week17 = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: 17 } }
    });

    if (!week16 || !week17) throw new Error("Weeks not found");

    const transactions = [];

    // --- WINNERS BRACKET (Championship) ---
    const semiMatchups = week16.matchups.filter(m => m.bracket === "winners");
    const semiWinners = semiMatchups.map(m => {
        return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    });

    if (semiWinners.length === 2) {
        transactions.push(db.matchup.create({
            data: {
                leagueId,
                weekId: week17.id,
                homeTeamId: semiWinners[0],
                awayTeamId: semiWinners[1],
                bracket: "winners",
                round: "championship"
            }
        }));
    }

    // --- TOILET BOWL (Last Place) ---
    // This is between the LOSERS of the Consolation Semis (Week 15)
    // Wait, the plan said Toilet Bowl is Week 17.
    // Let's get Week 15 losers.
    const week15 = await db.week.findFirst({
        where: { leagueId, number: 15 },
        include: { matchups: true }
    });

    if (week15) {
        const consolationSemis = week15.matchups.filter(m => m.bracket === "losers");
        const consolationLosers = consolationSemis.map(m => {
            return m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
        });

        if (consolationLosers.length === 2) {
            transactions.push(db.matchup.create({
                data: {
                    leagueId,
                    weekId: week17.id,
                    homeTeamId: consolationLosers[0],
                    awayTeamId: consolationLosers[1],
                    bracket: "losers",
                    round: "toilet_bowl"
                }
            }));
        }
    }

    if (transactions.length > 0) {
        await db.$transaction(transactions);
    }
}

/**
 * Awards rewards to the champion and consolation winner after Week 17
 */
export async function awardPlayoffRewards(leagueId: string) {
    const week17 = await db.week.findFirst({
        where: { leagueId, number: 17 },
        include: { matchups: true }
    });

    if (!week17) return;

    // 1. Champion
    const championship = week17.matchups.find(m => m.round === "championship");
    if (championship && championship.status === "final") {
        const championId = championship.homeScore > championship.awayScore
            ? championship.homeTeamId
            : championship.awayTeamId;

        await db.league.update({
            where: { id: leagueId },
            data: {
                championTeamId: championId,
                seasonStatus: "complete"
            }
        });

        // Award rewards
        await db.team.update({
            where: { id: championId },
            data: {
                gold: { increment: 500 },
                titles: {
                    create: {
                        title: "CHAMPION",
                        year: new Date().getFullYear()
                    }
                }
            }
        });
    }

    // 2. Consolation Winner (Redemption Arc)
    // Consolation Final was Week 16
    const week16 = await db.week.findFirst({
        where: { leagueId, number: 16 },
        include: { matchups: true }
    });

    if (week16) {
        const consolationFinal = week16.matchups.find(m => m.round === "consolation_final");
        if (consolationFinal && consolationFinal.status === "final") {
            const winnerId = consolationFinal.homeScore > consolationFinal.awayScore
                ? consolationFinal.homeTeamId
                : consolationFinal.awayTeamId;

            await db.league.update({
                where: { id: leagueId },
                data: { consolationWinnerId: winnerId }
            });

            // Award next season bonuses
            await db.team.update({
                where: { id: winnerId },
                data: {
                    nextSeasonBonusGold: 50,
                    nextSeasonBonusRerolls: 1,
                    titles: {
                        create: {
                            title: "PHOENIX",
                            year: new Date().getFullYear()
                        }
                    }
                }
            });
        }
    }
}


