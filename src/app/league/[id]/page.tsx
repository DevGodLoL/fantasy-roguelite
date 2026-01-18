import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

import StandingsTable from "./StandingsTable";
import LeagueActivity from "./LeagueActivity";

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
      streak: { type: 'W', count: 0 }
    });
  }

  // Process Matchups
  for (const match of league.matchups) {
    if (match.status !== 'final') continue;

    const homeStats = teamStatsMap.get(match.homeTeamId);
    const awayStats = teamStatsMap.get(match.awayTeamId);

    if (!homeStats || !awayStats) continue;

    homeStats.pf += match.homeScore;
    homeStats.pa += match.awayScore;
    awayStats.pf += match.awayScore;
    awayStats.pa += match.homeScore;

    if (match.homeScore > match.awayScore) {
      homeStats.wins++;
      homeStats.streak = homeStats.streak.type === 'W'
        ? { type: 'W', count: homeStats.streak.count + 1 }
        : { type: 'W', count: 1 };

      awayStats.losses++;
      awayStats.streak = awayStats.streak.type === 'L'
        ? { type: 'L', count: awayStats.streak.count + 1 }
        : { type: 'L', count: 1 };
    } else if (match.awayScore > match.homeScore) {
      awayStats.wins++;
      awayStats.streak = awayStats.streak.type === 'W'
        ? { type: 'W', count: awayStats.streak.count + 1 }
        : { type: 'W', count: 1 };

      homeStats.losses++;
      homeStats.streak = homeStats.streak.type === 'L'
        ? { type: 'L', count: homeStats.streak.count + 1 }
        : { type: 'L', count: 1 };
    } else {
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

  // User team identification
  const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];
  const userStats = teamStatsMap.get(userTeam.id);

  // Calculate user rank
  const sortedTeams = [...teamStats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.pf - a.pf;
  });
  const userRank = sortedTeams.findIndex(t => t.id === userTeam.id) + 1;

  // Find current week
  const currentWeek = league.weeks.find(w => w.status === 'active')
    || league.weeks.find(w => w.status === 'pending')
    || league.weeks[league.weeks.length - 1];

  // Find user's current matchup
  const userMatchup = currentWeek
    ? league.matchups.find(m =>
      m.weekId === currentWeek.id &&
      (m.homeTeamId === userTeam.id || m.awayTeamId === userTeam.id)
    )
    : null;

  const opponent = userMatchup
    ? (userMatchup.homeTeamId === userTeam.id ? userMatchup.awayTeam : userMatchup.homeTeam)
    : null;
  const opponentStats = opponent ? teamStatsMap.get(opponent.id) : null;

  // Get artifact counts for user
  const userArtifacts = await db.teamPowerup.count({
    where: { teamId: userTeam.id, isConsumed: false },
  });

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[50%] h-[50%] bg-purple-900/8 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-amber-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-blue-900/6 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-12">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION: THE WAR ROOM */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <header className="relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-amber-500/10 rounded-3xl blur-3xl -z-10" />

          <div className="space-y-8">
            {/* Breadcrumb */}
            <Link
              href="/leagues"
              className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group inline-flex"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Return to the Realm
            </Link>

            {/* Main Hero */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              {/* Title Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">⚔️</span>
                  <div className="px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-full">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                      Season 1 • Chapter {currentWeek?.number || 1}
                    </span>
                  </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
                  <span className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">
                    {league.name}
                  </span>
                </h1>

                {currentWeek && (
                  <p className="text-xl text-zinc-500 font-medium italic">
                    "{WEEK_NAMES[(currentWeek.number - 1) % WEEK_NAMES.length]}"
                  </p>
                )}
              </div>

              {/* Quick Stats Badge */}
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl text-center">
                  <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                    #{userRank}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Your Rank</div>
                </div>
                <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl text-center">
                  <div className="text-3xl font-black text-white">
                    {userStats?.wins}-{userStats?.losses}-{userStats?.ties}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Record</div>
                </div>
                <div className="px-6 py-4 bg-black/40 backdrop-blur-sm border border-amber-500/20 rounded-2xl text-center">
                  <div className="text-3xl font-black text-amber-400">
                    {userArtifacts}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold mt-1">Artifacts</div>
                </div>
              </div>
            </div>

            {/* Navigation Pills */}
            <nav className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
              {league.draft?.status !== 'completed' ? (
                <Link
                  href={`/league/${id}/draft`}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                >
                  ⚔️ Enter Draft Room
                </Link>
              ) : (
                <>
                  <Link
                    href={`/league/${id}/team/${userTeam.id}`}
                    className="px-6 py-3 bg-white hover:bg-zinc-100 text-black font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    🛡️ My Army
                  </Link>
                  <Link
                    href={`/league/${id}/schedule`}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs rounded-xl transition-all"
                  >
                    📜 Battle Schedule
                  </Link>
                  <Link
                    href={`/league/${id}/waivers`}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-xl transition-all"
                  >
                    🔮 Waiver Wire
                  </Link>
                  <Link
                    href={`/league/${id}/inventory`}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    ✨ Artifacts
                  </Link>
                  <Link
                    href={`/league/${id}/admin`}
                    className="px-6 py-3 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-500/30 font-black uppercase text-xs rounded-xl transition-all"
                  >
                    ⚙️ Admin
                  </Link>
                  <Link
                    href={`/league/${id}/transactions`}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-xs rounded-xl transition-all"
                  >
                    📋 Logs
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* THIS WEEK: THE ARENA */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {userMatchup && opponent && opponentStats && currentWeek && (
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-purple-500/10 to-blue-500/5 rounded-3xl blur-3xl -z-10" />

            <div className="p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="text-3xl">⚔️</div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                    This Week: The Arena
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Week {currentWeek.number} • "{WEEK_NAMES[(currentWeek.number - 1) % WEEK_NAMES.length]}"
                  </p>
                </div>
              </div>

              {/* VS Battle Card */}
              <div className="grid md:grid-cols-3 gap-6 items-center">
                {/* Your Team */}
                <div className="text-center p-6 bg-gradient-to-br from-emerald-900/20 to-emerald-950/40 border border-emerald-500/20 rounded-2xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    🛡️
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">{userTeam.name}</h3>
                  <div className="text-emerald-400 font-bold">
                    {userStats?.wins}-{userStats?.losses}-{userStats?.ties}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {userStats?.streak.type === 'W' && userStats.streak.count > 0 && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400">
                        🔥 W{userStats.streak.count}
                      </span>
                    )}
                    {userStats?.streak.type === 'L' && userStats.streak.count > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400">
                        💀 L{userStats.streak.count}
                      </span>
                    )}
                    {userArtifacts > 0 && (
                      <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs font-bold text-amber-400">
                        ✨ {userArtifacts}
                      </span>
                    )}
                  </div>
                </div>

                {/* VS Divider */}
                <div className="text-center py-4">
                  <div className="relative">
                    <div className="text-6xl font-black bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">
                      VS
                    </div>
                    <div className="absolute inset-0 text-6xl font-black text-white/5 blur-xl">
                      VS
                    </div>
                  </div>
                  <Link
                    href={`/league/${id}/week/${currentWeek.number}`}
                    className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                  >
                    Enter Battle →
                  </Link>
                </div>

                {/* Opponent */}
                <div className="text-center p-6 bg-gradient-to-br from-red-900/20 to-red-950/40 border border-red-500/20 rounded-2xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    ⚔️
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">{opponent.name}</h3>
                  <div className="text-red-400 font-bold">
                    {opponentStats.wins}-{opponentStats.losses}-{opponentStats.ties}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {opponentStats.streak.type === 'W' && opponentStats.streak.count > 0 && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400">
                        🔥 W{opponentStats.streak.count}
                      </span>
                    )}
                    {opponentStats.streak.type === 'L' && opponentStats.streak.count > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-bold text-red-400">
                        💀 L{opponentStats.streak.count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT GRID */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Column: Champions Ranking (8 cols) */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏆</div>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                Champions' Ranking
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>

            <StandingsTable leagueId={id} teams={teamStats} />
          </section>

          {/* Sidebar: Activity & Chronicle (4 cols) */}
          <section className="lg:col-span-4 space-y-10">
            {/* The Scroll of Fate (Activity Feed) */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-xl">📜</div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                  Scroll of Fate
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
              </div>
              <LeagueActivity leagueId={id} />
            </div>

            {/* The Dungeon Map (Weekly Schedule) */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-xl">🗺️</div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                  The Dungeon Map
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
              </div>

              <div className="space-y-3">
                {league.weeks.map((w, idx) => {
                  const weekMatchups = league.matchups.filter(m => m.weekId === w.id);
                  const isCurrentWeek = w.id === currentWeek?.id;
                  const isCompleted = w.status === 'final' || w.status === 'completed';
                  const isPending = w.status === 'pending' && !isCurrentWeek;

                  return (
                    <div
                      key={w.id}
                      className={`
                        relative p-4 rounded-2xl border transition-all
                        ${isCurrentWeek
                          ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/40 shadow-[0_0_30px_rgba(147,51,234,0.2)]'
                          : isCompleted
                            ? 'bg-zinc-900/30 border-zinc-800/50'
                            : 'bg-zinc-900/10 border-zinc-800/30 opacity-60'
                        }
                      `}
                    >
                      {/* Week Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black
                            ${isCurrentWeek
                              ? 'bg-purple-500 text-white'
                              : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800 text-zinc-500'
                            }
                          `}>
                            {isCompleted ? '✓' : isCurrentWeek ? '⚔️' : w.number}
                          </div>
                          <div>
                            <h3 className={`text-sm font-bold ${isCurrentWeek ? 'text-white' : 'text-zinc-400'}`}>
                              Week {w.number}
                            </h3>
                            <p className="text-[10px] text-zinc-600 italic">
                              {WEEK_NAMES[(w.number - 1) % WEEK_NAMES.length]}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/league/${id}/week/${w.number}`}
                          className={`
                            text-[10px] font-black uppercase tracking-widest transition-colors
                            ${isCurrentWeek ? 'text-purple-400 hover:text-purple-300' : 'text-blue-400/60 hover:text-blue-300'}
                          `}
                        >
                          {isCurrentWeek ? 'Battle →' : 'View'}
                        </Link>
                      </div>

                      {/* Matchups (Condensed) */}
                      <div className="space-y-1">
                        {weekMatchups.slice(0, 3).map(m => {
                          const homeWon = m.homeScore > m.awayScore;
                          const awayWon = m.awayScore > m.homeScore;

                          return (
                            <div
                              key={m.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2 bg-white/5 rounded-lg"
                            >
                              <span className={`truncate max-w-[40%] ${isCompleted && homeWon ? 'font-bold text-white' : 'text-zinc-500'}`}>
                                {m.homeTeam.name}
                              </span>
                              <span className="text-[9px] font-black text-zinc-700">
                                {isCompleted ? `${m.homeScore}-${m.awayScore}` : 'VS'}
                              </span>
                              <span className={`truncate max-w-[40%] text-right ${isCompleted && awayWon ? 'font-bold text-white' : 'text-zinc-500'}`}>
                                {m.awayTeam.name}
                              </span>
                            </div>
                          );
                        })}
                        {weekMatchups.length > 3 && (
                          <div className="text-[10px] text-zinc-600 text-center pt-1">
                            +{weekMatchups.length - 3} more battles
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
