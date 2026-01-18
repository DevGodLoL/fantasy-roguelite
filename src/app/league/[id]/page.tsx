import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

import StandingsTable from "./StandingsTable";
import LeagueActivity from "./LeagueActivity";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const league = await db.league.findUnique({
    where: { id },
    include: {
      teams: { include: { owner: true } },
      weeks: { orderBy: { number: "asc" } },
      matchups: {
        include: { week: true, homeTeam: true, awayTeam: true },
        orderBy: [{ week: { number: "asc" } }],
      },
      draft: true,
    },
  });

  if (!league) {
    return notFound();
  }

  // Calculate Standings
  const teamStatsMap = new Map<string, {
    id: string;
    name: string;
    ownerName: string;
    wins: number;
    losses: number;
    ties: number;
    pf: number;
    pa: number;
    streak: { type: 'W' | 'L' | 'T'; count: number };
  }>();

  // Initialize
  for (const team of league.teams) {
    teamStatsMap.set(team.id, {
      id: team.id,
      name: team.name,
      ownerName: team.owner.displayName || "Unknown",
      wins: 0,
      losses: 0,
      ties: 0,
      pf: 0,
      pa: 0,
      streak: { type: 'W', count: 0 } // Default
    });
  }

  // Process Matchups
  for (const match of league.matchups) {
    // Only count finalized games
    if (match.status !== 'final') continue;

    const homeStats = teamStatsMap.get(match.homeTeamId);
    const awayStats = teamStatsMap.get(match.awayTeamId);

    if (!homeStats || !awayStats) continue;

    // Update PF/PA
    homeStats.pf += match.homeScore;
    homeStats.pa += match.awayScore;
    awayStats.pf += match.awayScore;
    awayStats.pa += match.homeScore;

    // Update W/L and Streak
    if (match.homeScore > match.awayScore) {
      // Home Win
      homeStats.wins++;
      homeStats.streak = homeStats.streak.type === 'W'
        ? { type: 'W', count: homeStats.streak.count + 1 }
        : { type: 'W', count: 1 };

      awayStats.losses++;
      awayStats.streak = awayStats.streak.type === 'L'
        ? { type: 'L', count: awayStats.streak.count + 1 }
        : { type: 'L', count: 1 };
    } else if (match.awayScore > match.homeScore) {
      // Away Win
      awayStats.wins++;
      awayStats.streak = awayStats.streak.type === 'W'
        ? { type: 'W', count: awayStats.streak.count + 1 }
        : { type: 'W', count: 1 };

      homeStats.losses++;
      homeStats.streak = homeStats.streak.type === 'L'
        ? { type: 'L', count: homeStats.streak.count + 1 }
        : { type: 'L', count: 1 };
    } else {
      // Tie
      homeStats.ties++;
      homeStats.streak = homeStats.streak.type === 'T'
        ? { type: 'T', count: homeStats.streak.count + 1 }
        : { type: 'T', count: 1 };

      awayStats.ties++;
      awayStats.streak = awayStats.streak.type === 'T'
        ? { type: 'T', count: awayStats.streak.count + 1 }
        : { type: 'T', count: 1 };
    }
  }

  const teamStats = Array.from(teamStatsMap.values());

  // Identify User Team (Mock: "The DevGods" or fallback to first team)
  const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 lg:p-12 space-y-12">
        {/* Breadcrumbs & Header */}
        <header className="space-y-4">
          <Link
            href="/leagues"
            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to All Leagues
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              {league.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-500">
                ID: {league.id.slice(0, 8)}...
              </div>
              {league.draft?.status !== 'completed' ? (
                <Link
                  href={`/league/${id}/draft`}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-full transition-all"
                >
                  Go to Draft Room
                </Link>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href={`/league/${id}/team/${userTeam.id}`}
                    className="px-6 py-2 bg-zinc-100 hover:bg-white text-black font-black uppercase text-xs rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    My Team
                  </Link>
                  <Link
                    href={`/league/${id}/schedule`}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs rounded-full transition-all"
                  >
                    Schedule
                  </Link>
                  <Link
                    href={`/league/${id}/waivers`}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-full transition-all"
                  >
                    Waiver Wire
                  </Link>
                  <Link
                    href={`/league/${id}/inventory`}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-xs rounded-full transition-all"
                  >
                    Artifacts
                  </Link>
                  <Link
                    href={`/league/${id}/admin`}
                    className="px-6 py-2 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/30 font-black uppercase text-xs rounded-full transition-all"
                  >
                    Admin
                  </Link>
                  <Link
                    href={`/league/${id}/transactions`}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-black uppercase text-xs rounded-full transition-all"
                  >
                    Logs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Column: Standings (8 cols) */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-500/80">Leaderboards</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>

            <StandingsTable leagueId={id} teams={teamStats} />

            {/* Also show activity here or sidebar? Sidebar is better for feed. */}
          </section>

          {/* Sidebar: Schedule & Activity (4 cols) */}
          <section className="lg:col-span-4 space-y-8">
            {/* Activity Feed */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500/80">League Activity</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
              </div>
              <LeagueActivity leagueId={id} />
            </div>


            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500/80">Chronicles of War</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>
            <div className="space-y-4">
              {league.weeks.map((w) => {
                const weekMatchups = league.matchups.filter(m => m.weekId === w.id);
                // Only show active/final weeks or current week? Show all for now condensed.
                return (
                  <div key={w.id} className="p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-zinc-400">Week {w.number}</h3>
                      <Link
                        href={`/league/${id}/week/${w.number}`}
                        className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                      >
                        View
                      </Link>
                    </div>
                    <div className="space-y-1">
                      {weekMatchups.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white/5 rounded-lg">
                          <span className={`${m.homeScore > m.awayScore ? 'font-bold text-white' : 'text-zinc-500'} truncate max-w-[40%]`}>{m.homeTeam.name}</span>
                          <span className="text-[9px] font-black text-zinc-700">VS</span>
                          <span className={`${m.awayScore > m.homeScore ? 'font-bold text-white' : 'text-zinc-500'} truncate max-w-[40%] text-right`}>{m.awayTeam.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
