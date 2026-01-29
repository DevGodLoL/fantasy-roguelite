const { PrismaClient } = require('../src/generated/client');
const db = new PrismaClient();

async function main() {
    const team = await db.team.findFirst({
        where: { name: 'The DevGods' }
    });

    if (!team) {
        console.log('Team not found');
        return;
    }

    const tps = await db.teamPowerup.findMany({
        where: { teamId: team.id },
        include: { powerup: true, week: true },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`\nTeamPowerups for DevGods (${tps.length} total):\n`);
    tps.forEach(tp => {
        const weekNum = tp.week ? tp.week.number : 'null';
        console.log(`  Week ${weekNum}: ${tp.powerup.name} (source: ${tp.source}, consumed: ${tp.isConsumed})`);
    });

    // Also check offers
    const offers = await db.teamPowerupOffer.findMany({
        where: { teamId: team.id },
        include: { powerup: true, week: true },
        orderBy: { weekId: 'asc' }
    });

    console.log(`\nOffers for DevGods (${offers.length} total):\n`);
    const offersByWeek = {};
    offers.forEach(o => {
        const wn = o.week.number;
        if (!offersByWeek[wn]) offersByWeek[wn] = [];
        offersByWeek[wn].push(`${o.powerup.name} (chosen: ${o.isChosen})`);
    });
    Object.keys(offersByWeek).sort((a, b) => a - b).forEach(wn => {
        console.log(`  Week ${wn}: ${offersByWeek[wn].join(', ')}`);
    });
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
