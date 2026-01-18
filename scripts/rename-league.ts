import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function renameLeague() {
    const leagueId = "cmkivakpt0002r4dxth8q7xfn";
    const newName = "The Eternal Gridiron";

    try {
        const updated = await db.league.update({
            where: { id: leagueId },
            data: { name: newName }
        });
        console.log(`Success: Renamed league ${leagueId} to "${newName}"`);
    } catch (error) {
        // If ID is different, just find the first league
        const league = await db.league.findFirst();
        if (league) {
            await db.league.update({
                where: { id: league.id },
                data: { name: newName }
            });
            console.log(`Success: Renamed first found league ${league.id} to "${newName}"`);
        } else {
            console.error("No league found to rename.");
        }
    } finally {
        await db.$disconnect();
    }
}

renameLeague();
