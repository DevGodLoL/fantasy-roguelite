
const path = require('path');
const { PrismaClient } = require('../src/generated/client');
const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const db = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

async function main() {
    try {
        console.log("Finding active week...");
        const league = await db.league.findFirst({
            include: { weeks: { orderBy: { number: 'asc' }, include: { matchups: true } } }
        });

        const activeWeek = league.weeks.find(w => w.matchups.some(m => m.status !== 'final'));
        if (!activeWeek) { console.log("Season Over"); return; }

        console.log(`Advancing Week ${activeWeek.number}...`);

        for (const m of activeWeek.matchups) {
            console.log(`Finalizing Matchup ${m.id}`);
            await db.matchup.update({
                where: { id: m.id },
                data: {
                    status: 'final',
                    homeScore: Math.floor(Math.random() * 100),
                    awayScore: Math.floor(Math.random() * 100)
                }
            });
        }
        console.log("Week Finalized!");

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}
main();
