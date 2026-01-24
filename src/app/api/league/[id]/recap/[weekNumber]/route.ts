import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

const WEEK_NAMES = [
    "The Awakening", "Trial of Flames", "Shadow's Descent", "The Iron March",
    "Blood Moon Rising", "Void's Embrace", "Storm of Blades", "The Reckoning",
    "Crimson Tide", "Frost's Grip", "Phoenix Dawn", "The Final Stand",
    "Glory Eternal", "Champions' Ascent"
];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; weekNumber: string }> }
) {
    const { id: leagueId, weekNumber: weekStr } = await params;
    const weekNumber = parseInt(weekStr);

    try {
        // 1. Fetch Week and its Matchups
        const week = await db.week.findUnique({
            where: { leagueId_number: { leagueId, number: weekNumber } },
            include: {
                matchups: {
                    include: { homeTeam: true, awayTeam: true }
                }
            }
        });

        if (!week) {
            return NextResponse.json({ error: "Week not found" }, { status: 404 });
        }

        // 2. Fetch Player Performances for this week
        const performances = await db.playerPerformance.findMany({
            where: { weekId: week.id },
            include: {
                player: {
                    include: {
                        rosterSlots: {
                            where: { team: { leagueId } },
                            include: { team: true }
                        }
                    }
                }
            }
        });

        // 3. Fetch Team Powerups consumed this week
        const artifactsConsumed = await db.teamPowerup.count({
            where: { weekId: week.id, isConsumed: true }
        });

        // 4. Fetch New Traits gained this week in this league
        const newTraitsCount = await db.playerTrait.count({
            where: { leagueId, expiresAtWeek: { gte: weekNumber } } // Simple heuristic for "gained recently"
        });

        // 5. Calculate Highest Scoring Team
        let highestTeam = { name: "None", score: 0 };
        let totalPoints = 0;
        const matchupData = [];

        for (const m of week.matchups) {
            totalPoints += m.homeScore + m.awayScore;

            if (m.homeScore > highestTeam.score) highestTeam = { name: m.homeTeam.name, score: m.homeScore };
            if (m.awayScore > highestTeam.score) highestTeam = { name: m.awayTeam.name, score: m.awayScore };

            matchupData.push({
                homeTeam: m.homeTeam.name,
                awayTeam: m.awayTeam.name,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                winner: m.homeScore > m.awayScore ? m.homeTeam.name : (m.awayScore > m.homeScore ? m.awayTeam.name : "Tie"),
                logs: m.simulationLogs ? JSON.parse(m.simulationLogs) : []
            });
        }

        // 6. Find MVP Player
        let mvp = { name: "None", pos: "N/A", score: 0, teamName: "None" };
        if (performances.length > 0) {
            const topPerf = performances.reduce((prev, current) => (prev.points > current.points) ? prev : current);
            mvp = {
                name: topPerf.player.name,
                pos: topPerf.player.position,
                score: topPerf.points,
                teamName: topPerf.player.rosterSlots[0]?.team?.name || "Mercenary"
            };
        }

        const recap = {
            weekNumber: week.number,
            weekName: WEEK_NAMES[(week.number - 1) % WEEK_NAMES.length] || "An Unknown Era",
            totalArtifactsConsumed: artifactsConsumed,
            highestScoringTeam: highestTeam,
            mvpPlayer: mvp,
            totalPointsScored: totalPoints,
            newTraitsCount: newTraitsCount,
            matchups: matchupData
        };

        return NextResponse.json(recap);
    } catch (error) {
        console.error("Error generating ritual recap:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
