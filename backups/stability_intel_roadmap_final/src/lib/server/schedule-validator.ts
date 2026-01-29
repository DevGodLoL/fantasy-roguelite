import { db } from "@/lib/prisma";

export interface HealthIssue {
    type: 'MISSING_MATCHUP' | 'DUPLICATE_MATCHUP' | 'ORPHAN_TEAM' | 'INVALID_WEEK_COUNT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    details: any;
}

export interface LeagueHealthReport {
    isHealthy: boolean;
    issues: HealthIssue[];
    summary: {
        totalTeams: number;
        totalWeeks: number;
        totalMatchups: number;
    };
}

/**
 * Validates the integrity of the league schedule and team counts.
 */
export async function validateLeagueHealth(leagueId: string): Promise<LeagueHealthReport> {
    const issues: HealthIssue[] = [];

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: true,
            weeks: {
                include: {
                    matchups: true
                }
            }
        }
    });

    if (!league) {
        throw new Error("League not found");
    }

    const teamCount = league.teams.length;
    const weekCount = league.weeks.length;

    // 1. Check Week Count (Should be 17 for this game's current scope)
    if (weekCount < 14) {
        issues.push({
            type: 'INVALID_WEEK_COUNT',
            severity: 'HIGH',
            description: `League only has ${weekCount} weeks. Expected at least 14 for the regular season.`,
            details: { currentWeeks: weekCount }
        });
    }

    // 2. Check for Missing Matchups
    // In a 10 team league, each team should have 1 matchup per week.
    // So there should be (teamCount / 2) matchups per week.
    const expectedMatchupsPerWeek = Math.floor(teamCount / 2);

    for (const week of league.weeks) {
        if (week.number > 14) continue; // Skip playoff weeks for simple validation

        if (week.matchups.length < expectedMatchupsPerWeek) {
            issues.push({
                type: 'MISSING_MATCHUP',
                severity: 'HIGH',
                description: `Week ${week.number} is missing matchups. Found ${week.matchups.length}, expected ${expectedMatchupsPerWeek}.`,
                details: { weekNumber: week.number, found: week.matchups.length, expected: expectedMatchupsPerWeek }
            });
        }

        // 3. Check for Duplicate Teams in the same week
        const teamIdsInWeek = new Set<string>();
        for (const matchup of week.matchups) {
            if (teamIdsInWeek.has(matchup.homeTeamId)) {
                issues.push({
                    type: 'DUPLICATE_MATCHUP',
                    severity: 'HIGH',
                    description: `Team ${matchup.homeTeamId} appears multiple times in Week ${week.number}.`,
                    details: { weekNumber: week.number, teamId: matchup.homeTeamId }
                });
            }
            teamIdsInWeek.add(matchup.homeTeamId);

            if (teamIdsInWeek.has(matchup.awayTeamId)) {
                issues.push({
                    type: 'DUPLICATE_MATCHUP',
                    severity: 'HIGH',
                    description: `Team ${matchup.awayTeamId} appears multiple times in Week ${week.number}.`,
                    details: { weekNumber: week.number, teamId: matchup.awayTeamId }
                });
            }
            teamIdsInWeek.add(matchup.awayTeamId);
        }
    }

    // 4. Check for Orphan Teams
    // (Teams with no owner or somehow not connected)
    for (const team of league.teams) {
        if (!team.ownerId) {
            issues.push({
                type: 'ORPHAN_TEAM',
                severity: 'MEDIUM',
                description: `Team "${team.name}" has no owner.`,
                details: { teamId: team.id }
            });
        }
    }

    return {
        isHealthy: issues.length === 0,
        issues,
        summary: {
            totalTeams: teamCount,
            totalWeeks: weekCount,
            totalMatchups: league.weeks.reduce((acc, w) => acc + w.matchups.length, 0)
        }
    };
}
