"use server";

import { db } from "@/lib/prisma";

export interface PlayerDetails {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
    adp: number;
    performances: { weekNumber: number; points: number; details: any }[];
    seasonTotal: number;
    average: number;
    ownerName: string | null;
    nextMatchup: { week: number; opponent: string } | null;
}

export async function getPlayerDetails(playerId: string): Promise<PlayerDetails | null> {
    const player = await db.player.findUnique({
        where: { id: playerId },
        include: {
            performances: {
                include: { week: true },
                orderBy: { week: { number: "asc" } }
            },
            rosterSlots: {
                include: {
                    team: true
                }
            }
        }
    });

    if (!player) return null;

    // Calculate Stats
    // @ts-ignore - Prisma types sometimes struggle with complex includes in reducer
    const totalPoints = player.performances.reduce((sum: number, p: any) => sum + p.points, 0);
    const average = player.performances.length > 0 ? totalPoints / player.performances.length : 0;

    // Owner Info
    const activeSlot = player.rosterSlots[0];
    const ownerName = activeSlot ? activeSlot.team.name : null;

    // Next Matchup
    let nextMatchup = null;
    if (activeSlot) {
        // Find next scheduled matchup for this team
        const match = await db.matchup.findFirst({
            where: {
                OR: [
                    { homeTeamId: activeSlot.teamId },
                    { awayTeamId: activeSlot.teamId }
                ],
                // For "Upcoming", we want future weeks. Assuming scheduled status implies future.
                // But simplified: Just find the first scheduled one.
                status: "scheduled"
            },
            orderBy: { week: { number: "asc" } },
            include: {
                week: true,
                homeTeam: true,
                awayTeam: true
            }
        });

        if (match) {
            const isHome = match.homeTeamId === activeSlot.teamId;
            const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
            nextMatchup = {
                week: match.week.number,
                opponent
            };
        }
    }

    // Format Performance
    // @ts-ignore
    const performances = player.performances.map((p: any) => ({
        weekNumber: p.week.number,
        points: p.points,
        details: {
            passYds: p.passYds,
            rushYds: p.rushYds,
            recYds: p.recYds,
            tds: p.tds,
            fumbles: p.fumbles
        }
    }));

    return {
        id: player.id,
        name: player.name,
        position: player.position,
        teamAbbr: player.teamAbbr,
        adp: player.adp,
        performances,
        seasonTotal: parseFloat(totalPoints.toFixed(2)),
        average: parseFloat(average.toFixed(2)),
        ownerName,
        nextMatchup
    };
}
