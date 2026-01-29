
const path = require('path');
// Import from the generated location
const { PrismaClient } = require('../src/generated/client');

console.log("Loaded PrismaClient from generated/client");

// Explicitly define datasource URL relative to CWD
const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
console.log(`Using DB File: ${dbPath}`);

const db = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function main() {
    try {
        const league = await db.league.findFirst({
            include: { weeks: { include: { matchups: true } } }
        });
        if (!league) { console.log("No League"); return; }

        console.log(`League: ${league.id}`);
        // Log all weeks statuses
        for (const week of league.weeks) {
            const statusCounts = week.matchups.reduce((acc, m) => {
                acc[m.status] = (acc[m.status] || 0) + 1;
                return acc;
            }, {});
            console.log(`Week ${week.number}: ${JSON.stringify(statusCounts)}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await db.$disconnect();
    }
}
main();
