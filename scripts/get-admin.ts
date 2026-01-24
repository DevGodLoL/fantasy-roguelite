import { PrismaClient } from '../src/generated/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({ where: { email: 'admin@fantasy.com' } });
    console.log(JSON.stringify(user, null, 2));
    await prisma.$disconnect();
}
main();
