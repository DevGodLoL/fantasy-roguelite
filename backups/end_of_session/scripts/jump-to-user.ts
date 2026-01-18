import { db } from '../src/lib/prisma';
async function main() {
    const league = await db.league.findFirst();
    const draft = await db.draft.findFirst({ where: { leagueId: league?.id } });
    // Set to 140 (Last pick of Round 14 - User's Turn)
    await db.draft.update({ where: { id: draft?.id }, data: { currentPick: 140 } });
    console.log('Jumped to Pick 140. It is now User Turn.');
}
main();
