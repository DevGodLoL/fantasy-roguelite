import { db } from '../src/lib/prisma';

async function main() {
    const league = await db.league.findFirst();
    const userTeam = await db.team.findFirst({ where: { name: "The DevGods", leagueId: league?.id }, include: { rosterSlots: { include: { player: true } } } });

    console.log("User Roster Slots:");
    userTeam?.rosterSlots.forEach(s => {
        console.log(`- ${s.slotType} (Starter: ${s.isStarter}): ${s.player ? s.player.name : 'EMPTY'}`);
    });
}
main();
