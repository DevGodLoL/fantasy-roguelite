import { db } from './src/lib/prisma';
async function main() {
    const draft = await db.draft.findFirst();
    console.log('STATUS:', draft?.status);
    console.log('PICK:', draft?.currentPick);
}
main();
