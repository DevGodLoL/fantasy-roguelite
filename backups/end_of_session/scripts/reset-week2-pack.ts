import { db } from '../src/lib/prisma';

async function main() {
    console.log("🔄 Resetting Week 2 Pack for User...");

    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: 'The DevGods', leagueId: league?.id } });
    if (!userTeam) throw new Error("User team not found");

    const week2 = await db.week.findFirst({ where: { leagueId: league?.id, number: 2 } });
    if (!week2) throw new Error("Week 2 not found");

    // 1. Delete the "Chosen" Powerup (if any)
    const activePowerup = await db.teamPowerup.findFirst({ where: { teamId: userTeam.id, weekId: week2.id } });
    if (activePowerup) {
        await db.teamPowerup.delete({ where: { id: activePowerup.id } });
        console.log(`- Removed active powerup: ${activePowerup.powerupId}`);
    }

    // 2. Reset Offers to Unchosen
    const updateResult = await db.teamPowerupOffer.updateMany({
        where: { teamId: userTeam.id, weekId: week2.id },
        data: { isChosen: false }
    });

    console.log(`- Reset ${updateResult.count} offers to 'unnumbered'.`);
    console.log("✅ Pack is ready to open again!");
}

main();
