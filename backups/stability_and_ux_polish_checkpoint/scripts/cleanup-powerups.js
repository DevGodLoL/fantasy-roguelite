// Clean up incorrectly pre-assigned powerups
// Only keeps Week 1 and Week 2 powerups (legitimately earned)
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

    // Get weeks 1 and 2 IDs
    const validWeeks = await db.week.findMany({
        where: {
            number: { in: [1, 2] }
        },
        select: { id: true, number: true }
    });

    const validWeekIds = validWeeks.map(w => w.id);
    console.log('Keeping powerups for weeks:', validWeeks.map(w => w.number).join(', '));

    // Delete all TeamPowerups for future weeks (not Week 1 or 2)
    const deleted = await db.teamPowerup.deleteMany({
        where: {
            teamId: team.id,
            weekId: { notIn: validWeekIds }
        }
    });

    console.log(`\n✅ Deleted ${deleted.count} incorrectly pre-assigned powerups`);

    // Show remaining
    const remaining = await db.teamPowerup.findMany({
        where: { teamId: team.id },
        include: { powerup: true, week: true }
    });

    console.log(`\nRemaining TeamPowerups (${remaining.length}):`);
    remaining.forEach(tp => {
        console.log(`  Week ${tp.week?.number}: ${tp.powerup.name}`);
    });
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
