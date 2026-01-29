
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
    try {
        console.log("Fetching league...");
        const league = await db.league.findFirst({
            include: {
                weeks: {
                    orderBy: { number: 'asc' },
                    include: {
                        matchups: true
                    }
                }
            }
        });

        if (!league) {
            console.log("No league found.");
            return;
        }

        console.log(`League ID: ${league.id}`);
        console.log(`Total Weeks: ${league.weeks.length}`);

        for (const week of league.weeks) {
            const statuses = week.matchups.map(m => m.status);
            const isComplete = statuses.every(s => s === 'final');
            console.log(`Week ${week.number}: [${statuses.join(', ')}] -> Complete? ${isComplete}`);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.$disconnect();
    }
}

main();
