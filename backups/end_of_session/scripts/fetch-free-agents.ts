import { PrismaClient } from "../src/generated/client";
import { resolve } from "path";

const url = `file:${resolve(process.cwd(), "prisma/dev.db")}`;
const prisma = new PrismaClient({
    datasources: { db: { url } }
});

const POSITIONS_TO_IMPORT = ["QB", "RB", "WR", "TE", "K"];

async function main() {
    console.log("--- FETCHING FREE AGENTS FROM ESPN API ---");

    // 1. Fetch NFL Teams
    console.log("Fetching NFL Teams...");
    const teamsResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32");
    const teamsData = await teamsResponse.json();
    const teams = teamsData.sports[0].leagues[0].teams;

    let totalImported = 0;

    for (const teamItem of teams) {
        const team = teamItem.team;
        const teamId = team.id;
        const teamAbbr = team.abbreviation;
        console.log(`Processing ${team.displayName} (${teamAbbr})...`);

        try {
            // 2. Fetch Roster
            const rosterResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`);
            const rosterData = await rosterResponse.json();
            const athletes = rosterData.athletes; // Array of sections (Offense, Defense, Special Teams)

            const allPlayers = athletes.flatMap((section: any) => section.items);

            for (const player of allPlayers) {
                const position = player.position.abbreviation;

                if (POSITIONS_TO_IMPORT.includes(position)) {
                    const name = player.fullName;
                    const nflPlayerId = `real_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

                    // Upsert Player
                    await prisma.player.upsert({
                        where: { nflPlayerId },
                        update: {
                            teamAbbr, // Update team if changed
                            // Keep existing ADP/stats
                        },
                        create: {
                            name,
                            position,
                            teamAbbr,
                            nflPlayerId,
                            adp: 999, // Default for non-seeded players
                        }
                    });
                    totalImported++;
                }
            }
        } catch (err) {
            console.error(`Failed to process roster for ${teamAbbr}:`, err);
        }
    }

    console.log(`--- IMPORT COMPLETE: Processed ${totalImported} players ---`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
