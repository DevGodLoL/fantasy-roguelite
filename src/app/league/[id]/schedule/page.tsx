import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generateSchedule } from "./actions";

// Week flavor names for roguelite theme
const CHAPTER_NAMES = [
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

export default async function SchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { createdAt: "asc" } },
            weeks: {
                orderBy: { number: "asc" },
                include: {
                    matchups: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                        },
                    },
                },
            },
            draft: true,
        },
    });

    if (!league) {
        notFound();
    }

    const isDraftComplete = league.draft?.status === "completed";
    const hasSchedule = league.weeks.some(w => w.matchups.length > 0);

    // Identify user team
    const userTeam = league.teams.find(t => t.name === "The DevGods") || league.teams[0];

    // Find current week (active or first pending)
    const currentWeek = league.weeks.find(w => w.status === 'active')
        || league.weeks.find(w => w.status === 'pending')
        || league.weeks[league.weeks.length - 1];

    // Calculate user stats
    let userWins = 0;
    let userLosses = 0;
    league.weeks.forEach(week => {
        week.matchups.forEach(m => {
            if (m.status === 'final') {
                const isHome = m.homeTeamId === userTeam?.id;
                const isAway = m.awayTeamId === userTeam?.id;
                if (isHome) {
                    if (m.homeScore > m.awayScore) userWins++;
                    else if (m.homeScore < m.awayScore) userLosses++;
                } else if (isAway) {
                    if (m.awayScore > m.homeScore) userWins++;
                    else if (m.awayScore < m.homeScore) userLosses++;
                }
            }
        });
    });

    const completedWeeks = league.weeks.filter(w =>
        w.matchups.length > 0 && w.matchups.every(m => m.status === 'final')
    ).length;
    const totalWeeks = league.weeks.length;
    const remainingWeeks = totalWeeks - completedWeeks;

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-purple-900/8 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] bg-blue-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[60%] left-[60%] w-[25%] h-[25%] bg-emerald-900/6 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

                {/* Subtle vertical lines */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 100px)',
                    }}
                />
            </div>

            {/* Header */}
            <header className="relative z-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Command
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <h1 className="font-black uppercase tracking-tighter text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            📜 The Campaign Chronicle
                        </h1>
                    </div>

                    {isDraftComplete && !hasSchedule && (
                        <form action={async () => {
                            "use server";
                            await generateSchedule(leagueId);
                        }}>
                            <button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                ⚔️ Forge 14-Week Campaign
                            </button>
                        </form>
                    )}
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-10">
                {!isDraftComplete ? (
                    /* Draft Not Complete State */
                    <div className="text-center py-20">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-6xl">
                            ⚔️
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3">The War Awaits!</h2>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                            Complete the sacred draft ritual before the campaign can begin.
                        </p>
                        <Link
                            href={`/league/${leagueId}/draft`}
                            className="inline-flex px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        >
                            Enter the Draft Chamber →
                        </Link>
                    </div>
                ) : !hasSchedule ? (
                    /* No Schedule Yet State */
                    <div className="text-center py-20">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center text-6xl animate-pulse">
                            📜
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3">The Chronicle Is Empty</h2>
                        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                            The fates have not yet been written. Forge the campaign to begin your journey.
                        </p>
                        <div className="text-sm text-zinc-600">
                            Use the button above to generate your 14-week destiny.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* HERO STATS SECTION */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <section className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/10 to-emerald-500/5 rounded-3xl blur-3xl -z-10" />

                            <div className="p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                                <div className="grid md:grid-cols-4 gap-6">
                                    {/* Campaign Progress */}
                                    <div className="md:col-span-2 space-y-4">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-purple-400">
                                            Your Campaign Progress
                                        </h2>
                                        <div className="flex items-end gap-6">
                                            <div>
                                                <div className="text-5xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                                    {completedWeeks} <span className="text-2xl text-zinc-600">/ {totalWeeks}</span>
                                                </div>
                                                <div className="text-sm text-zinc-500 mt-1">Chapters Conquered</div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(completedWeeks / totalWeeks) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Battle Record */}
                                    <div className="text-center p-4 bg-gradient-to-br from-emerald-900/20 to-emerald-950/30 border border-emerald-500/20 rounded-2xl">
                                        <div className="text-3xl font-black text-emerald-400">{userWins}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-emerald-500/60 font-bold">Victories</div>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-red-900/20 to-red-950/30 border border-red-500/20 rounded-2xl">
                                        <div className="text-3xl font-black text-red-400">{userLosses}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-red-500/60 font-bold">Defeats</div>
                                    </div>
                                </div>

                                {/* Timeline Journey */}
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between gap-1">
                                        {league.weeks.map((week, idx) => {
                                            const isComplete = week.matchups.every(m => m.status === 'final');
                                            const isCurrent = week.id === currentWeek?.id;
                                            const userMatchup = week.matchups.find(m =>
                                                m.homeTeamId === userTeam?.id || m.awayTeamId === userTeam?.id
                                            );
                                            const userWon = userMatchup && userMatchup.status === 'final' && (
                                                (userMatchup.homeTeamId === userTeam?.id && userMatchup.homeScore > userMatchup.awayScore) ||
                                                (userMatchup.awayTeamId === userTeam?.id && userMatchup.awayScore > userMatchup.homeScore)
                                            );

                                            return (
                                                <Link
                                                    key={week.id}
                                                    href={`/league/${leagueId}/week/${week.number}`}
                                                    className={`
                                                        relative flex-1 h-8 rounded-lg transition-all
                                                        ${isCurrent
                                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                                                            : isComplete
                                                                ? userWon
                                                                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                                                                    : 'bg-gradient-to-r from-zinc-700 to-zinc-600'
                                                                : 'bg-zinc-800/50 hover:bg-zinc-700/50'
                                                        }
                                                        flex items-center justify-center text-xs font-black
                                                        ${isCurrent ? 'text-white' : isComplete ? 'text-white/80' : 'text-zinc-500'}
                                                        hover:scale-105
                                                    `}
                                                    title={`Week ${week.number}: ${CHAPTER_NAMES[idx] || `Chapter ${week.number}`}`}
                                                >
                                                    {isCurrent ? '⚔️' : isComplete ? (userWon ? '✓' : '•') : week.number}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                        <span>The Awakening</span>
                                        <span>Champions' Ascent</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* CURRENT WEEK FEATURE */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {currentWeek && (
                            <section className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-3xl -z-10" />

                                <div className="p-8 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.15)]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                                                ⚔️
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
                                                    Current Chapter
                                                </div>
                                                <h2 className="text-2xl font-black text-white">
                                                    Week {currentWeek.number}: {CHAPTER_NAMES[(currentWeek.number - 1) % CHAPTER_NAMES.length]}
                                                </h2>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/league/${leagueId}/week/${currentWeek.number}`}
                                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
                                        >
                                            Enter Battle →
                                        </Link>
                                    </div>

                                    {/* Current Week Matchups */}
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                        {currentWeek.matchups.map((matchup) => {
                                            const isUserMatchup = matchup.homeTeamId === userTeam?.id || matchup.awayTeamId === userTeam?.id;

                                            return (
                                                <Link
                                                    key={matchup.id}
                                                    href={`/league/${leagueId}/week/${currentWeek.number}`}
                                                    className={`
                                                        p-4 rounded-2xl border transition-all hover:scale-102
                                                        ${isUserMatchup
                                                            ? 'bg-gradient-to-br from-purple-900/40 to-purple-950/60 border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                                                            : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700'
                                                        }
                                                    `}
                                                >
                                                    {isUserMatchup && (
                                                        <div className="text-[9px] uppercase tracking-widest text-purple-400 font-black mb-2 text-center">
                                                            ⚔️ Your Battle
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex-1 text-center">
                                                            <div className={`text-xs font-bold truncate ${matchup.homeTeamId === userTeam?.id ? 'text-purple-300' : 'text-white'}`}>
                                                                {matchup.homeTeam.name.split(' ').pop()}
                                                            </div>
                                                        </div>
                                                        <div className="text-zinc-600 text-[10px] font-black">VS</div>
                                                        <div className="flex-1 text-center">
                                                            <div className={`text-xs font-bold truncate ${matchup.awayTeamId === userTeam?.id ? 'text-purple-300' : 'text-white'}`}>
                                                                {matchup.awayTeam.name.split(' ').pop()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* CHAPTER GRID */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl">📖</div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
                                    Battle History
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-zinc-700 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {league.weeks.map((week, idx) => {
                                    const isComplete = week.matchups.every(m => m.status === 'final');
                                    const isCurrent = week.id === currentWeek?.id;
                                    const isLive = week.matchups.some(m => m.status === 'live');
                                    const isPending = !isComplete && !isCurrent && !isLive;

                                    const userMatchup = week.matchups.find(m =>
                                        m.homeTeamId === userTeam?.id || m.awayTeamId === userTeam?.id
                                    );
                                    const userWon = userMatchup && userMatchup.status === 'final' && (
                                        (userMatchup.homeTeamId === userTeam?.id && userMatchup.homeScore > userMatchup.awayScore) ||
                                        (userMatchup.awayTeamId === userTeam?.id && userMatchup.awayScore > userMatchup.homeScore)
                                    );

                                    return (
                                        <div
                                            key={week.id}
                                            className={`
                                                relative p-5 rounded-2xl border transition-all
                                                ${isCurrent
                                                    ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/40 shadow-[0_0_30px_rgba(147,51,234,0.2)]'
                                                    : isComplete
                                                        ? userWon
                                                            ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-950/30 border-emerald-500/30'
                                                            : 'bg-zinc-900/40 border-zinc-800/50'
                                                        : 'bg-zinc-900/20 border-zinc-800/30 opacity-70'
                                                }
                                            `}
                                        >
                                            {/* Week Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black
                                                        ${isCurrent
                                                            ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                                                            : isComplete
                                                                ? userWon
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : 'bg-zinc-800 text-zinc-400'
                                                                : 'bg-zinc-800/50 text-zinc-500'
                                                        }
                                                    `}>
                                                        {isCurrent ? '⚔️' : isComplete ? (userWon ? '👑' : '✓') : isPending ? '🔒' : week.number}
                                                    </div>
                                                    <div>
                                                        <h3 className={`text-base font-black ${isCurrent ? 'text-white' : isComplete ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                            Week {week.number}
                                                        </h3>
                                                        <p className="text-[10px] text-zinc-600 italic">
                                                            {CHAPTER_NAMES[idx] || `Chapter ${week.number}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className={`
                                                    text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider
                                                    ${isComplete
                                                        ? userWon
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                                        : isCurrent
                                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse'
                                                            : isLive
                                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                                : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
                                                    }
                                                `}>
                                                    {isComplete ? (userWon ? 'Victory' : 'Conquered') : isCurrent ? 'Active' : isLive ? 'Live' : 'Sealed'}
                                                </span>
                                            </div>

                                            {/* Matchups */}
                                            <div className="space-y-2">
                                                {week.matchups.map((matchup) => {
                                                    const isUserMatchup = matchup.homeTeamId === userTeam?.id || matchup.awayTeamId === userTeam?.id;
                                                    const homeWon = matchup.homeScore > matchup.awayScore;
                                                    const awayWon = matchup.awayScore > matchup.homeScore;

                                                    return (
                                                        <Link
                                                            key={matchup.id}
                                                            href={`/league/${leagueId}/week/${week.number}`}
                                                            className={`
                                                                block p-3 rounded-xl transition-all group
                                                                ${isUserMatchup
                                                                    ? 'bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40'
                                                                    : 'bg-white/5 hover:bg-white/10'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                {/* Home Team */}
                                                                <div className="flex-1 text-right">
                                                                    <div className={`
                                                                        text-xs font-bold truncate
                                                                        ${matchup.status === 'final' && homeWon ? 'text-emerald-400' : isUserMatchup && matchup.homeTeamId === userTeam?.id ? 'text-purple-300' : 'text-white'}
                                                                    `}>
                                                                        {matchup.homeTeam.name.split(' ').pop()}
                                                                        {matchup.status === 'final' && homeWon && ' 👑'}
                                                                    </div>
                                                                    {matchup.status === 'final' && (
                                                                        <div className={`text-lg font-black ${homeWon ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                            {matchup.homeScore.toFixed(1)}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Divider */}
                                                                <div className="px-3 flex flex-col items-center">
                                                                    <span className="text-zinc-600 text-[9px] font-black">
                                                                        {matchup.status === 'final' ? 'FINAL' : 'VS'}
                                                                    </span>
                                                                </div>

                                                                {/* Away Team */}
                                                                <div className="flex-1 text-left">
                                                                    <div className={`
                                                                        text-xs font-bold truncate
                                                                        ${matchup.status === 'final' && awayWon ? 'text-emerald-400' : isUserMatchup && matchup.awayTeamId === userTeam?.id ? 'text-purple-300' : 'text-white'}
                                                                    `}>
                                                                        {matchup.status === 'final' && awayWon && '👑 '}
                                                                        {matchup.awayTeam.name.split(' ').pop()}
                                                                    </div>
                                                                    {matchup.status === 'final' && (
                                                                        <div className={`text-lg font-black ${awayWon ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                            {matchup.awayScore.toFixed(1)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>

                                            {/* Week Link */}
                                            <div className="mt-4 pt-3 border-t border-white/5">
                                                <Link
                                                    href={`/league/${leagueId}/week/${week.number}`}
                                                    className={`
                                                        text-[10px] font-black uppercase tracking-widest transition-colors
                                                        ${isCurrent
                                                            ? 'text-purple-400 hover:text-purple-300'
                                                            : 'text-zinc-600 hover:text-zinc-400'
                                                        }
                                                    `}
                                                >
                                                    {isCurrent ? 'Enter Battle →' : 'View Details →'}
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* LEGEND */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <section className="pt-8 border-t border-white/5">
                            <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-[8px]">👑</div>
                                    <span>Your Victory</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-zinc-700 flex items-center justify-center text-[8px]">✓</div>
                                    <span>Conquered</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-[8px]">⚔️</div>
                                    <span>Active Battle</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-zinc-800/50 flex items-center justify-center text-[8px] text-zinc-600">🔒</div>
                                    <span>Sealed</span>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
