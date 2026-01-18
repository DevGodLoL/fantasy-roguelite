
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    // Get the first league
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
        const isStarted = statuses.some(s => s !== 'scheduled');
        console.log(`Week ${week.number}: Statuses [${statuses.join(', ')}] -> Complete? ${isComplete}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect());
