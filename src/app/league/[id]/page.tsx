import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PERSONALITIES, getRandomQuote, Archetype } from "@/lib/game-data/personalities";

import StandingsTable from "./StandingsTable";
import LeagueActivity from "./LeagueActivity";
import RitualResolutionModal from "@/components/RitualResolutionModal";
import DungeonProgress from "@/components/DungeonProgress";
import CommanderBadge from "@/components/CommanderBadge";
import { getCommanderProfile } from "@/lib/game-logic/progression";
import { ArrowUpRight, Shield, ShoppingBag, Scroll, Map as MapIcon, Calendar, Trophy, FileText, Settings, Coins } from "lucide-react";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ recap?: string; week?: string }>;
}) {
  const { id } = await params;
  const { recap, week } = await searchParams;

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
    archetype: Archetype;
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
      streak: { type: 'W', count: 0 },
      archetype: team.archetype as Archetype
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
  const commanderProfile = await getCommanderProfile(userTeam.ownerId);

  // Calculate user rank
  const sortedTeams = [...teamStats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.pf - a.pf;
  });
  const userRank = sortedTeams.findIndex(t => t.id === userTeam.id) + 1;

  // Find current week (first week with non-final matchups)
  const currentWeek = league.weeks.find(w =>
    league.matchups.some(m => m.weekId === w.id && m.status !== 'final')
  ) || league.weeks[league.weeks.length - 1];

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
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {recap === "true" && week && (
        <RitualResolutionModal leagueId={id} weekNumber={parseInt(week)} />
      )}
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

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HEADER & TOP NAV */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <header className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center border-b border-white/5 pb-8">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <Link
              href="/leagues"
              className="text-zinc-500 hover:text-purple-400 transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 group mb-2"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Return to the Realm
            </Link>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
              <span className="bg-gradient-to-r from-purple-400 via-amber-200 to-purple-400 bg-clip-text text-transparent">
                The Eternal Gridiron
              </span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Season 1 • Floor {currentWeek?.number || 1} • {WEEK_NAMES[((currentWeek?.number || 1) - 1) % WEEK_NAMES.length]}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <CommanderBadge profile={commanderProfile} userId={userTeam.ownerId} />

            <div className="hidden sm:block h-10 w-px bg-white/10 mx-2" />

            <div className="flex justify-between sm:justify-start gap-4 sm:gap-6 w-full sm:w-auto p-4 sm:p-0 bg-white/[0.03] sm:bg-transparent rounded-xl border border-white/5 sm:border-none">
              <div className="flex-1 sm:flex-none">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Rank</div>
                <div className="text-xl font-black text-white">#{userRank}</div>
              </div>
              <div className="flex-1 sm:flex-none">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Record</div>
                <div className="text-xl font-black text-white">{userStats?.wins}-{userStats?.losses}</div>
              </div>
              <div className="flex-1 sm:flex-none">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Vault</div>
                <div className="text-xl font-black text-amber-400">{userTeam.gold}g</div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COMMAND CENTER (Quick Actions) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href={`/league/${id}/inventory`} className="p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl group transition-all">
            <Shield className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-amber-500">The Vault</div>
          </Link>
          <Link href={`/league/${id}/team/${userTeam.id}`} className="p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl group transition-all">
            <Trophy className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-white">My Army</div>
          </Link>
          <Link href={`/league/${id}/shop`} className="p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl group transition-all">
            <ShoppingBag className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-amber-400">Shop</div>
          </Link>
          <Link href={`/league/${id}/quests`} className="p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl group transition-all">
            <Scroll className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-purple-400">Quests</div>
          </Link>
          <Link href={`/league/${id}/campaign`} className="p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-xl group transition-all">
            <MapIcon className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-black uppercase text-zinc-400 group-hover:text-blue-400">Campaign</div>
          </Link>
          <div className="p-1 flex items-center justify-center gap-2">
            <Link href={`/league/${id}/inventory`} className="p-3 bg-zinc-900/30 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-amber-500 transition-colors" title="Vault">
              <Shield size={18} />
            </Link>
            <Link href={`/league/${id}/transactions`} className="p-3 bg-zinc-900/30 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Logs">
              <FileText size={18} />
            </Link>
            <Link href={`/league/${id}/admin`} className="p-3 bg-zinc-900/30 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors" title="Settings">
              <Settings size={18} />
            </Link>
          </div>
        </nav>


        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN BENTO GRID */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: ACTION & DATA (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. MATCHUP CARD (THE ARENA) */}
            {userMatchup && opponent && opponentStats && currentWeek ? (
              <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                {/* Background FX */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-amber-900/20 opacity-50 group-hover:opacity-70 transition-opacity" />

                <div className="relative p-8">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Simulation</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase italic">The Arena</h2>
                    </div>
                    <Link
                      href={`/league/${id}/week/${currentWeek.number}`}
                      className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-black uppercase text-[10px] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      Enter <ArrowUpRight size={14} className="hidden sm:inline" />
                    </Link>
                  </div>

                  {/* Matchup Layout - Responsive Stack */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-4 relative">
                    {/* YOU */}
                    <div className="flex-1 flex flex-col items-center gap-4 w-full sm:w-auto">
                      <div className="relative group/unit">
                        <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-2xl sm:rounded-full bg-emerald-900/40 border-2 border-emerald-500/30 flex items-center justify-center text-4xl sm:text-3xl shadow-[0_0_30px_rgba(16,185,129,0.15)] group-hover/unit:scale-110 transition-transform">
                          🛡️
                        </div>
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest sm:hidden">YOU</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl sm:text-lg leading-none uppercase tracking-tight">{userTeam.name}</div>
                        <div className="text-[10px] font-black text-emerald-500 mt-1.5 px-2 py-0.5 bg-emerald-500/10 rounded uppercase tracking-widest">{userStats?.wins}-{userStats?.losses}</div>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex sm:flex-col items-center justify-center gap-4 sm:gap-1 opacity-50">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-zinc-700 sm:hidden" />
                      <div className="text-2xl sm:text-4xl font-black italic text-zinc-700">VS</div>
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-zinc-700 sm:hidden" />
                      <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Floor {currentWeek.number}</div>
                    </div>

                    {/* OPPONENT */}
                    <div className="flex-1 flex flex-col items-center gap-4 w-full sm:w-auto relative group/opp">
                      <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-2xl sm:rounded-full bg-red-900/40 border-2 border-red-500/30 flex items-center justify-center text-4xl sm:text-3xl shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:scale-110 transition-transform cursor-help">
                        {PERSONALITIES[opponent.archetype as Archetype]?.icon || "⚔️"}
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl sm:text-lg leading-none uppercase tracking-tight text-zinc-300 group-hover/opp:text-red-400 transition-colors">
                          {opponent.name}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="text-[10px] font-black text-red-500 px-2 py-0.5 bg-red-500/10 rounded uppercase tracking-widest">
                            {opponentStats.wins}-{opponentStats.losses}
                          </div>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${PERSONALITIES[opponent.archetype as Archetype]?.color || 'text-zinc-500'}`}>
                            {PERSONALITIES[opponent.archetype as Archetype]?.title || "The Rival"}
                          </div>
                        </div>
                      </div>

                      {/* Hover Quote Bubble */}
                      <div className="absolute -bottom-16 sm:-bottom-12 left-1/2 -translate-x-1/2 w-48 sm:w-64 opacity-0 group-hover/opp:opacity-100 transition-all pointer-events-none z-30">
                        <div className="bg-zinc-900/95 border border-red-500/20 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                          <div className="text-red-400 font-serif italic text-xs mb-1">"{getRandomQuote(opponent.archetype as Archetype)}"</div>
                          <div className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter">— {PERSONALITIES[opponent.archetype as Archetype]?.title}</div>
                        </div>
                        <div className="w-2 h-2 bg-zinc-900 border-l border-t border-red-500/20 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/50 text-center">
                <div className="text-zinc-500 font-bold">No Active Matchup</div>
                <div className="text-sm text-zinc-600">The arena is quiet... for now.</div>
              </div>
            )}

            {/* 2. CHAMPIONS RANKING (Full Table) */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="text-xl">🏆</div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                  Champions&apos; Ranking
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
              </div>

              <StandingsTable leagueId={id} teams={teamStats} />
            </section>
          </div>

          {/* RIGHT COLUMN: META & INTEL (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. CAMPAIGN STATUS WIDGETS */}
            <div className="grid gap-4">
              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <MapIcon size={20} className="text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Current Location</h3>
                </div>
                <div className="text-2xl font-black text-white mb-1">{WEEK_NAMES[((currentWeek?.number || 1) - 1) % WEEK_NAMES.length]}</div>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">Floor {currentWeek?.number} / {league.weeks.length}</div>

                <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(currentWeek?.number || 0) / league.weeks.length * 100}%` }} />
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <Coins size={20} className="text-amber-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Treasury</h3>
                </div>
                <div className="text-3xl font-black text-white mb-1">{userTeam.gold}g</div>
                <div className="text-xs text-amber-500/60 font-bold uppercase tracking-widest">Available Gold</div>
                <Link href={`/league/${id}/shop`} className="text-[10px] underline text-zinc-500 hover:text-white mt-2 block">Visit Shop</Link>
              </div>
            </div>

            {/* 2. ACTIVITY FEED WIDGET */}
            <div className="p-6 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md h-fit">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Chronicles</h3>
                <Scroll size={16} className="text-emerald-500" />
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <LeagueActivity leagueId={id} limit={8} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
