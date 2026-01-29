// Clear Week 3 offers for fresh testing
const { PrismaClient } = require('../src/generated/client');
const db = new PrismaClient();

async function main() {
    const week3 = await db.week.findFirst({ where: { number: 3 } });
    if (!week3) {
        console.log('Week 3 not found');
        return;
    }

    const deleted = await db.teamPowerupOffer.deleteMany({
        where: { weekId: week3.id }
    });

    console.log(`Deleted ${deleted.count} offers for Week 3`);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
