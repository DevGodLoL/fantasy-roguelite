import "dotenv/config";
import { PrismaClient } from '../src/generated/client/index';
import { resolve } from "path";

const root = process.cwd();
const defaultDbPath = resolve(root, "prisma/dev.db");
const url = process.env.DATABASE_URL || `file:${defaultDbPath}`;

const prisma = new PrismaClient({
    datasources: { db: { url } }
});

const ARCHETYPES = [
    'AGGRESSIVE',
    'CONSERVATIVE',
    'MASTERMIND',
    'GREEDY',
    'HOARDER',
    'CHAOTIC'
];

async function main() {
    const teams = await prisma.team.findMany();

    console.log(`Setting archetypes for ${teams.length} teams...`);

    for (const team of teams) {
        if (team.name === "The DevGods") {
            // Player team is ALWAYS Balanced or special
            await prisma.team.update({
                where: { id: team.id },
                data: { archetype: 'BALANCED' }
            });
            continue;
        }

        const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        console.log(`Team: ${team.name} -> ${archetype}`);

        await prisma.team.update({
            where: { id: team.id },
            data: { archetype }
        });
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
