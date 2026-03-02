/**
 * create-league.ts
 * 
 * Creates a FRESH league alongside any existing ones.
 * Does NOT delete existing data.
 * Reuses the player pool already in the database.
 * 
 * Usage: npx tsx scripts/create-league.ts
 */
import { db } from '../src/lib/prisma';

const LEAGUE_NAME = "NFL Roguelite - Season 2";
const TEAM_NAMES = [
    "The DevGods",
    "Metropolis Titans",
    "Gotham Knights",
    "Central City Speedsters",
    "Star City Archers",
    "Coast City Lanterns",
    "Atlantis Royals",
    "Themiscyra Warriors",
    "Wakanda Forever",
    "Asgardian Thunder"
];

async function main() {
    console.log("=== Creating Fresh League ===");
    console.log(`League Name: ${LEAGUE_NAME}`);

    // Check players exist
    const playerCount = await db.player.count();
    if (playerCount === 0) {
        console.error("ERROR: No players in database. Run the full seed first.");
        process.exit(1);
    }
    console.log(`Found ${playerCount} players in database.`);

    // Check powerups exist
    const powerupCount = await db.powerup.count();
    if (powerupCount === 0) {
        console.error("ERROR: No powerups in database. Run the full seed first.");
        process.exit(1);
    }
    console.log(`Found ${powerupCount} powerups in database.`);

    // Create admin user for new league
    const admin = await db.user.create({
        data: {
            email: `admin-s2@fantasy.com`,
            displayName: "The Commissioner S2",
        },
    });
    console.log(`Created admin user: ${admin.id}`);

    // Create league
    const league = await db.league.create({
        data: {
            name: LEAGUE_NAME,
            ownerId: admin.id,
        },
    });
    console.log(`Created league: ${league.id}`);

    await db.leagueMember.create({
        data: {
            leagueId: league.id,
            userId: admin.id,
            role: "owner",
        },
    });

    await db.leagueSettings.create({
        data: {
            leagueId: league.id,
            rosterQB: 1,
            rosterRB: 2,
            rosterWR: 2,
            rosterTE: 1,
            rosterFlex: 1,
            rosterDST: 1,
            rosterK: 1,
            rosterBench: 6,
        },
    });

    // Create 10 teams
    console.log("Creating 10 teams...");
    for (let i = 0; i < 10; i++) {
        const owner = await db.user.create({
            data: {
                email: `team-s2-${i + 1}@example.com`,
                displayName: `Manager ${i + 1}`,
            },
        });

        const team = await db.team.create({
            data: {
                leagueId: league.id,
                ownerId: owner.id,
                name: TEAM_NAMES[i],
                faabBalance: 100,
                waiverPriority: i + 1,
            },
        });

        // Create standard roster slots
        const slots = [
            { type: "QB", count: 1 },
            { type: "RB", count: 2 },
            { type: "WR", count: 2 },
            { type: "TE", count: 1 },
            { type: "FLEX", count: 1 },
            { type: "DST", count: 1 },
            { type: "K", count: 1 },
            { type: "BENCH", count: 6 },
        ];

        for (const slot of slots) {
            for (let j = 0; j < slot.count; j++) {
                await db.rosterSlot.create({
                    data: {
                        teamId: team.id,
                        slotType: slot.type,
                        isStarter: slot.type !== "BENCH",
                    },
                });
            }
        }

        console.log(`  Created team: ${TEAM_NAMES[i]} (${team.id})`);
    }

    // Create draft
    console.log("Initializing draft...");
    await db.draft.create({
        data: {
            leagueId: league.id,
            status: "pre_draft",
            format: "snake",
        },
    });

    // Create 14 regular season weeks
    console.log("Creating 14 season weeks...");
    for (let i = 1; i <= 14; i++) {
        await db.week.create({
            data: {
                leagueId: league.id,
                number: i,
            },
        });
    }

    console.log("\n=== LEAGUE CREATED SUCCESSFULLY ===");
    console.log(`League ID: ${league.id}`);
    console.log(`Navigate to: http://localhost:3000/league/${league.id}`);
    console.log("\nNext steps:");
    console.log("  1. Go to the draft page");
    console.log("  2. Complete the draft");
    console.log("  3. Navigate to Week 1");
}

main()
    .catch((e) => {
        console.error("Failed to create league:", e);
        process.exit(1);
    });
