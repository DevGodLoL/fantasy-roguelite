import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import { resolve } from "path";

const root = process.cwd();
const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
let url = rawUrl;

if (rawUrl.startsWith("file:")) {
    const dbPath = rawUrl.slice(rawUrl.indexOf(":") + 1);
    url = `file:${resolve(root, dbPath)}`;
}

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const USER_TEAM_NAME = "The DevGods";

async function getBestAvailablePlayer(leagueId: string, teamId: string) {
    const draftedPlayerIds = await prisma.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const teamSlots = await prisma.rosterSlot.findMany({
        where: { teamId },
        include: { player: true },
    });

    const filledPositions: Record<string, number> = {};
    const emptySlots: Record<string, number> = {};

    for (const slot of teamSlots) {
        if (slot.playerId) {
            filledPositions[slot.slotType] = (filledPositions[slot.slotType] || 0) + 1;
        } else {
            emptySlots[slot.slotType] = (emptySlots[slot.slotType] || 0) + 1;
        }
    }

    const positionPriority = ["RB", "WR", "QB", "TE", "FLEX", "K", "DST"];

    let targetPosition: string | null = null;
    for (const pos of positionPriority) {
        if ((emptySlots[pos] || 0) > 0) {
            targetPosition = pos;
            break;
        }
    }

    let availablePlayers;
    if (targetPosition && targetPosition !== "FLEX") {
        availablePlayers = await prisma.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: targetPosition,
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else if (targetPosition === "FLEX") {
        availablePlayers = await prisma.player.findMany({
            where: {
                id: { notIn: draftedPlayerIds },
                position: { in: ["RB", "WR", "TE"] },
            },
            orderBy: { name: "asc" },
            take: 10,
        });
    } else {
        availablePlayers = await prisma.player.findMany({
            where: { id: { notIn: draftedPlayerIds } },
            orderBy: { name: "asc" },
            take: 10,
        });
    }

    if (availablePlayers.length > 0) {
        return availablePlayers[Math.floor(Math.random() * Math.min(3, availablePlayers.length))];
    }

    const anyPlayer = await prisma.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        take: 5,
    });

    return anyPlayer.length > 0 ? anyPlayer[0] : null;
}

async function executePick(
    draftId: string,
    teamId: string,
    playerId: string,
    pickNumber: number
): Promise<boolean> {
    const numTeams = 10;
    const currentPickIndex = pickNumber - 1;
    const round = Math.floor(currentPickIndex / numTeams) + 1;

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) return false;

    let targetSlot;
    if (player.position === "QB" || player.position === "K" || player.position === "DST") {
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    } else {
        targetSlot = await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: player.position }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "FLEX" }
        }) || await prisma.rosterSlot.findFirst({
            where: { teamId, playerId: null, slotType: "BENCH" }
        });
    }

    if (!targetSlot) {
        console.error(`No slot available for ${player.name} (${player.position}) on team ${teamId}`);
        return false;
    }

    try {
        await prisma.$transaction([
            prisma.draftPick.create({
                data: {
                    draftId,
                    teamId,
                    playerId,
                    pickNumber,
                    round,
                },
            }),
            prisma.rosterSlot.update({
                where: { id: targetSlot.id },
                data: { playerId },
            }),
            prisma.draft.update({
                where: { id: draftId },
                data: { currentPick: pickNumber + 1 },
            }),
        ]);
    } catch (error) {
        console.error(`Transaction error for pick ${pickNumber}:`, error);
        throw error;
    }

    return true;
}

async function main() {
    console.log("\n=== STARTING MOCK DRAFT ===\n");

    const league = await prisma.league.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (!league) {
        console.error("No league found!");
        process.exit(1);
    }

    console.log(`League: ${league.name} (${league.id})`);

    const draft = await prisma.draft.findFirst({
        where: { leagueId: league.id },
    });

    if (!draft) {
        console.error("No draft found!");
        process.exit(1);
    }

    // Start the draft
    await prisma.draft.update({
        where: { id: draft.id },
        data: { status: "drafting", currentPick: 1 },
    });

    const teams = await prisma.team.findMany({
        where: { leagueId: league.id },
        orderBy: { createdAt: "asc" },
    });

    console.log(`Teams: ${teams.length}`);

    const numTeams = teams.length;
    const totalPicks = numTeams * 15;

    console.log(`Total picks needed: ${totalPicks}\n`);

    for (let pickNumber = 1; pickNumber <= totalPicks; pickNumber++) {
        const currentPickIndex = pickNumber - 1;
        const round = Math.floor(currentPickIndex / numTeams) + 1;
        const pickInRound = (currentPickIndex % numTeams) + 1;

        const isEvenRound = round % 2 === 0;
        const activeTeamIndex = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
        const activeTeam = teams[activeTeamIndex];

        const bestPlayer = await getBestAvailablePlayer(league.id, activeTeam.id);

        if (!bestPlayer) {
            console.error(`\n❌ No players available for pick ${pickNumber}!`);
            process.exit(1);
        }

        // Log what we're about to do
        console.log(`Attempting pick ${pickNumber}: ${activeTeam.name} -> ${bestPlayer.name} (${bestPlayer.position})`);

        const success = await executePick(draft.id, activeTeam.id, bestPlayer.id, pickNumber);

        if (!success) {
            console.error(`\n❌ Failed to execute pick ${pickNumber}`);
            process.exit(1);
        }

        const isUser = activeTeam.name === USER_TEAM_NAME;
        const emoji = isUser ? "👤" : "🤖";
        console.log(
            `${emoji} Pick ${String(pickNumber).padStart(3)}: R${round}P${String(pickInRound).padStart(2)} | ${activeTeam.name.padEnd(25)} → ${bestPlayer.name} (${bestPlayer.position})`
        );
    }

    // Complete the draft
    await prisma.draft.update({
        where: { id: draft.id },
        data: { status: "completed" },
    });

    console.log("\n✅ MOCK DRAFT COMPLETE!\n");

    // Summary
    const finalState = await prisma.team.findMany({
        where: { leagueId: league.id },
        include: {
            rosterSlots: {
                include: { player: true },
            },
        },
    });

    for (const team of finalState) {
        const players = team.rosterSlots.filter((s: any) => s.player).map((s: any) => s.player!.position);
        const posCount: Record<string, number> = {};
        for (const pos of players) {
            posCount[pos] = (posCount[pos] || 0) + 1;
        }
        console.log(`${team.name}: ${team.rosterSlots.filter((s: any) => s.playerId).length}/15 slots filled | ${JSON.stringify(posCount)}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
