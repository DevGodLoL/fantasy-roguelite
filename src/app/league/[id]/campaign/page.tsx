import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CampaignMapView from "@/components/CampaignMapView";

// Week flavor names for roguelite theme
const WEEK_NAMES = [
    "The Awakening",
    "Trial of Flames",
    "Shadow's Descent",
    "The Iron March",
    "Blood Moon Rising",
    "Void's Embrace",
    "Storm of Blades",
    "The Reckoning",
    "Crimson Tide",
    "Frost's Grip",
    "Phoenix Dawn",
    "The Final Stand",
    "Glory Eternal",
    "Champions' Ascent",
];

export default async function CampaignPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { include: { owner: true } },
            weeks: { orderBy: { number: "asc" } },
            matchups: {
                include: { week: true },
                orderBy: { week: { number: "asc" } },
            },
        },
    });

    if (!league) {
        return notFound();
    }

    // Identify user team (mock: "The DevGods" or first team)
    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    // Calculate user stats
    let wins = 0, losses = 0, ties = 0;
    let currentStreak = 0;
    let streakType: 'W' | 'L' | 'T' = 'W';
    const matchResults: ('W' | 'L' | 'T')[] = [];

    for (const match of league.matchups) {
        if (match.status !== 'final') continue;

        const isHome = match.homeTeamId === userTeam.id;
        const isAway = match.awayTeamId === userTeam.id;
        if (!isHome && !isAway) continue;

        const teamScore = isHome ? match.homeScore : match.awayScore;
        const oppScore = isHome ? match.awayScore : match.homeScore;

        if (teamScore > oppScore) {
            wins++;
            matchResults.push('W');
        } else if (teamScore < oppScore) {
            losses++;
            matchResults.push('L');
        } else {
            ties++;
            matchResults.push('T');
        }
    }

    // Calculate streak
    for (let i = matchResults.length - 1; i >= 0; i--) {
        if (matchResults[i] === 'T') break;
        if (currentStreak === 0) {
            streakType = matchResults[i] as 'W' | 'L';
            currentStreak = 1;
        } else if (matchResults[i] === streakType) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Get artifact count
    const artifactCount = await db.teamPowerup.count({
        where: { teamId: userTeam.id, isConsumed: false },
    });

    // Determine current week
    const currentWeek = league.weeks.find(w =>
        league.matchups.some(m => m.weekId === w.id && m.status !== 'final')
    ) || league.weeks[league.weeks.length - 1];

    // Build week nodes
    const weeks = league.weeks.map(w => {
        const weekMatchups = league.matchups.filter(m => m.weekId === w.id);
        const isCurrentWeek = w.id === currentWeek?.id;
        const isCompleted = weekMatchups.length > 0 && weekMatchups.every(m => m.status === 'final');
        const isLocked = !isCompleted && !isCurrentWeek && w.number > (currentWeek?.number || 0);

        return {
            id: w.id,
            number: w.number,
            name: WEEK_NAMES[(w.number - 1) % WEEK_NAMES.length] || `Floor ${w.number}`,
            isCurrent: isCurrentWeek,
            isCompleted,
            isLocked,
        };
    });

    return (
        <CampaignMapView
            leagueId={leagueId}
            weeks={weeks}
            stats={{
                wins,
                losses,
                gold: userTeam.gold,
                artifacts: artifactCount,
                streak: { type: streakType, count: currentStreak },
            }}
            teamName={userTeam.name}
        />
    );
}
