import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Player model fields...");
    const player = await prisma.player.findFirst({
        include: {
            weeklyPerformances: true,
        },
    });
    console.log("Success! Found player with performances:", player);
}

main()
    .catch((e) => {
        console.error("Prisma check failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
