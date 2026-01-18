import { PrismaClient } from "../src/generated/client";
import { resolve } from "path";

const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;
const db = new PrismaClient({
    datasources: { db: { url } }
});

async function main() {
    console.log("Checking League data...");
    const league = await db.league.findFirst({
        include: { teams: true }
    });

    if (!league) throw new Error("No league found. Run 'npx prisma db seed' first.");
    console.log(`Found League: ${league.name} (${league.teams.length} teams)`);

    const weeksCount = await db.week.count({ where: { leagueId: league.id } });
    if (weeksCount === 0) {
        console.log("Creating 18 weeks...");
        for (let i = 1; i <= 18; i++) {
            await db.week.create({
                data: {
                    leagueId: league.id,
                    number: i
                }
            });
        }
    }

    // Ensure Week 1 Matchups exist
    let week1 = await db.week.findFirst({
        where: { leagueId: league.id, number: 1 },
        include: { matchups: true }
    });

    if (week1 && week1.matchups.length === 0) {
        console.log("Generating Week 1 Matchups...");
        await generateMatchups(league.id, week1.id, league.teams);
    }

    // Refetch Week 1 with full data to Simulate
    week1 = await db.week.findFirst({
        where: { leagueId: league.id, number: 1 },
        include: {
            matchups: {
                include: {
                    homeTeam: { include: { rosterSlots: { include: { player: true } } } },
                    awayTeam: { include: { rosterSlots: { include: { player: true } } } }
                }
            }
        }
    });

    if (!week1) throw new Error("Week 1 missing");

    console.log("Simulating Week 1 scores...");
    for (const m of week1.matchups) {
        let homeScore = 0;
        let awayScore = 0;

        // Auto-assign random points
        for (const slot of m.homeTeam.rosterSlots) {
            if (slot.player) {
                const pts = Math.floor(Math.random() * 25);
                homeScore += pts;
                await db.playerPerformance.upsert({
                    where: { playerId_weekId: { playerId: slot.player.id, weekId: week1.id } },
                    create: { playerId: slot.player.id, weekId: week1.id, points: pts },
                    update: { points: pts }
                });
            }
        }
        for (const slot of m.awayTeam.rosterSlots) {
            if (slot.player) {
                const pts = Math.floor(Math.random() * 25);
                awayScore += pts;
                await db.playerPerformance.upsert({
                    where: { playerId_weekId: { playerId: slot.player.id, weekId: week1.id } },
                    create: { playerId: slot.player.id, weekId: week1.id, points: pts },
                    update: { points: pts }
                });
            }
        }

        await db.matchup.update({
            where: { id: m.id },
            data: { homeScore, awayScore, status: "final" }
        });
    }

    // Ensure Week 2 Matchups exist
    let week2 = await db.week.findFirst({
        where: { leagueId: league.id, number: 2 },
        include: { matchups: true }
    });

    if (week2 && week2.matchups.length === 0) {
        console.log("Generating Week 2 Matchups (Scheduled)...");
        // Rotate teams slightly for variety
        const rotatedTeams = [...league.teams];
        const first = rotatedTeams.shift();
        if (first) rotatedTeams.push(first);

        await generateMatchups(league.id, week2.id, rotatedTeams);
    }

    // Set Week 2 to scheduled
    await db.matchup.updateMany({
        where: { weekId: week2?.id },
        data: { status: "scheduled" }
    });

    console.log("Simulation Complete. Week 1 Final. Week 2 Scheduled.");
}

async function generateMatchups(leagueId: string, weekId: string, teams: any[]) {
    // Simple pairing
    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    for (let i = 0; i < shuffled.length; i += 2) {
        const home = shuffled[i];
        const away = shuffled[i + 1];
        if (home && away) {
            await db.matchup.create({
                data: {
                    leagueId,
                    weekId,
                    homeTeamId: home.id,
                    awayTeamId: away.id,
                    status: "scheduled"
                }
            });
        }
    }
}

main()
    .then(async () => { await db.$disconnect(); })
    .catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
