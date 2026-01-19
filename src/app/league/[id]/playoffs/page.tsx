import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, Crown, Flame, Shield, Swords, CheckCircle2, Sparkles } from "lucide-react";

const FLOOR_NAMES: Record<number, string> = {
    15: "The Reckoning",
    16: "Phoenix Dawn",
    17: "Glory Eternal",
};

interface BracketMatchupProps {
    matchup?: any;
    leagueId: string;
    label?: string;
    placeholder?: string;
    isBye?: boolean;
    teamName?: string;
    className?: string;
}

function BracketMatchup({ matchup, leagueId, label, placeholder, isBye, teamName, className }: BracketMatchupProps) {
    const baseClasses = "flex flex-col border rounded-2xl transition-all duration-500 overflow-hidden shadow-2xl relative";
    const sizeClasses = className || "w-64 h-28";

    if (isBye) {
        return (
            <div className={`${baseClasses} ${sizeClasses} bg-zinc-900/40 border-zinc-800/50 opacity-80 backdrop-blur-sm`}>
                <div className="bg-zinc-800/30 px-3 py-1.5 flex justify-between items-center border-b border-zinc-800/50">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{label || "BYE"}</span>
                    <Shield size={10} className="text-zinc-600" />
                </div>
                <div className="flex-1 flex flex-col justify-center px-4">
                    <div className="text-sm font-black text-zinc-300 truncate tracking-tight">{teamName || "Reserved Seed"}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Automated Passage</div>
                </div>
            </div>
        );
    }

    if (!matchup) {
        return (
            <div className={`${baseClasses} ${sizeClasses} bg-zinc-950/80 border-dashed border-zinc-800/50 justify-center items-center backdrop-blur-md px-4 text-center`}>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-1">{label}</div>
                <div className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.1em] leading-tight">{placeholder || "TBD"}</div>
            </div>
        );
    }

    const homeWon = matchup.status === 'final' && matchup.homeScore > matchup.awayScore;
    const awayWon = matchup.status === 'final' && matchup.awayScore > matchup.homeScore;

    return (
        <Link
            href={`/league/${leagueId}/week/${matchup.week.number}`}
            className={`${baseClasses} ${sizeClasses} bg-zinc-900 border-zinc-800 group hover:border-purple-500/50 hover:scale-[1.02] active:scale-95`}
        >
            {/* Hover Glow */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="bg-zinc-800/30 px-3 py-1.5 flex justify-between items-center border-b border-zinc-800/50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
                {matchup.status === 'live' ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">Live</span>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                    </div>
                ) : matchup.status === 'final' ? (
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Concluded</span>
                ) : (
                    <Swords size={10} className="text-zinc-700" />
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-2 px-4 py-2">
                <div className="flex items-center justify-between group/line">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-black truncate ${homeWon ? 'text-purple-400' : matchup.status === 'final' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            {matchup.homeTeam.name.split(' ').pop()}
                        </span>
                        {homeWon && <CheckCircle2 size={12} className="text-purple-500" />}
                    </div>
                    {matchup.status === 'final' && (
                        <span className={`text-sm font-black tabular-nums ${homeWon ? 'text-purple-400' : 'text-zinc-600'}`}>
                            {matchup.homeScore.toFixed(0)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between group/line">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-black truncate ${awayWon ? 'text-purple-400' : matchup.status === 'final' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            {matchup.awayTeam.name.split(' ').pop()}
                        </span>
                        {awayWon && <CheckCircle2 size={12} className="text-purple-500" />}
                    </div>
                    {matchup.status === 'final' && (
                        <span className={`text-sm font-black tabular-nums ${awayWon ? 'text-purple-400' : 'text-zinc-600'}`}>
                            {matchup.awayScore.toFixed(0)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

function GrandFinaleCard({ matchup, leagueId }: { matchup: any; leagueId: string }) {
    if (!matchup) {
        return (
            <div className="w-80 h-48 rounded-2xl bg-zinc-950/80 border-2 border-dashed border-amber-500/20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
                <Crown size={40} className="text-amber-500/20 mb-4" />
                <div className="text-sm font-black text-amber-500/40 uppercase tracking-[0.3em]">The Grand Finale</div>
                <div className="text-[10px] text-zinc-800 font-bold uppercase mt-2 tracking-widest">Awaiting the Worthy</div>
            </div>
        );
    }

    const homeWon = matchup.status === 'final' && matchup.homeScore > matchup.awayScore;
    const awayWon = matchup.status === 'final' && matchup.awayScore > matchup.homeScore;

    return (
        <Link
            href={`/league/${leagueId}/week/${matchup.week.number}`}
            className="w-96 group relative block"
        >
            {/* Divine Radiance */}
            <div className="absolute -inset-4 bg-amber-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-700 shadow-[0_0_50px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_80px_rgba(245,158,11,0.3)] transition-all duration-700">
                <div className="bg-zinc-950 rounded-[22px] overflow-hidden flex flex-col h-full">
                    <div className="bg-amber-500/10 px-6 py-4 flex justify-between items-center border-b border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <Crown size={20} className="text-amber-400 fill-amber-400/20" />
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-amber-500">The Grand Finale</span>
                        </div>
                        {matchup.status === 'live' && (
                            <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Live Battle</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Contender North</span>
                                <span className={`text-2xl font-black tracking-tight ${homeWon ? 'text-amber-300 drop-shadow-lg' : 'text-zinc-200'}`}>
                                    {matchup.homeTeam.name.toUpperCase()}
                                </span>
                            </div>
                            {matchup.status === 'final' && (
                                <span className={`text-4xl font-black tabular-nums ${homeWon ? 'text-amber-400' : 'text-zinc-700'}`}>
                                    {matchup.homeScore.toFixed(0)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            <Trophy size={24} className="text-amber-500/40" />
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Contender South</span>
                                <span className={`text-2xl font-black tracking-tight ${awayWon ? 'text-amber-300 drop-shadow-lg' : 'text-zinc-200'}`}>
                                    {matchup.awayTeam.name.toUpperCase()}
                                </span>
                            </div>
                            {matchup.status === 'final' && (
                                <span className={`text-4xl font-black tabular-nums ${awayWon ? 'text-amber-400' : 'text-zinc-700'}`}>
                                    {matchup.awayScore.toFixed(0)}
                                </span>
                            )}
                        </div>
                    </div>

                    {matchup.status === 'final' && (
                        <div className="bg-amber-500/5 px-6 py-4 text-center border-t border-amber-500/10">
                            <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">
                                A Champion has Emerged
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default async function PlayoffBracketPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { playoffSeed: "asc" } },
            weeks: {
                where: { number: { gte: 15 } },
                include: {
                    matchups: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                            week: true,
                        },
                    },
                },
            },
        },
    });

    if (!league) notFound();

    const matchups = league.weeks.flatMap(w => w.matchups);

    // Calculate Current Week (highest number week with non-final matchups or the last one)
    const currentWeekNumber = league.weeks.find(w =>
        w.matchups.some(m => m.status !== 'final')
    )?.number || (league.weeks[league.weeks.length - 1]?.number || 1);

    // Winners Bracket Matchups
    const wc1 = matchups.find(m => m.round === "wildcard" && (m.homeTeam.playoffSeed === 3 || m.awayTeam.playoffSeed === 3));
    const wc2 = matchups.find(m => m.round === "wildcard" && (m.homeTeam.playoffSeed === 4 || m.awayTeam.playoffSeed === 4));

    const semi1 = matchups.find(m => m.round === "semifinal" && (m.homeTeam.playoffSeed === 1 || m.awayTeam.playoffSeed === 1));
    const semi2 = matchups.find(m => m.round === "semifinal" && (m.homeTeam.playoffSeed === 2 || m.awayTeam.playoffSeed === 2));

    const championship = matchups.find(m => m.round === "championship");

    // Redemption Arc
    const rSemi1 = matchups.find(m => m.round === "consolation_semi" && (m.homeTeam.playoffSeed === 7 || m.awayTeam.playoffSeed === 7));
    const rSemi2 = matchups.find(m => m.round === "consolation_semi" && (m.homeTeam.playoffSeed === 8 || m.awayTeam.playoffSeed === 8));
    const rFinal = matchups.find(m => m.round === "consolation_final");
    const toiletBowl = matchups.find(m => m.round === "toilet_bowl");

    // Get Teams by Seed
    const seed1 = league.teams.find(t => t.playoffSeed === 1);
    const seed2 = league.teams.find(t => t.playoffSeed === 2);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Animated Background Layers */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[1000px] h-[800px] bg-purple-900/10 blur-[200px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[1000px] h-[800px] bg-blue-900/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }} />
            </div>

            {/* Header */}
            <header className="relative z-40 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 shadow-2xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/league/${leagueId}`}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full text-zinc-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 group"
                        >
                            <span className="text-lg leading-none group-hover:-translate-x-1 transition-transform">←</span>
                            COMMAND
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <Trophy size={18} className="text-purple-400" />
                            <h1 className="font-black uppercase tracking-[0.2em] text-sm bg-gradient-to-r from-purple-200 via-white to-blue-200 bg-clip-text text-transparent">
                                The Playoff Gauntlet
                            </h1>
                        </div>
                    </div>
                    {/* Status Pill */}
                    <div className="px-4 py-1.5 bg-zinc-900/80 border border-white/5 rounded-full flex items-center gap-2 shadow-inner">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Season {currentWeekNumber >= 15 ? 'Playoffs' : 'Active'}</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-12 lg:p-24 overflow-x-auto">
                <div className="max-w-7xl mx-auto min-w-[1100px]">
                    {/* BOUNTIES / REWARDS SECTION */}
                    <section className="mb-32">
                        <div className="flex items-center gap-6 mb-12">
                            <div className="flex items-center gap-3">
                                <Sparkles size={20} className="text-amber-500 animate-pulse" />
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">The Spoils of War</h2>
                            </div>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Champion Reward */}
                            <div className="group relative">
                                <div className="absolute -inset-px bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                                <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-zinc-950 to-black border border-amber-500/10 shadow-3xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] pointer-events-none" />
                                    <Trophy size={48} className="text-amber-500/10 mb-8 absolute -top-2 -right-2 rotate-12" />

                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-black uppercase tracking-tight text-amber-500 flex items-center gap-3">
                                            The Crown Prince <Crown size={18} />
                                        </h4>
                                        <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Main Bounty</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-400 leading-relaxed font-medium mb-6 max-w-md">
                                        Conquer the Gauntlet to earn the <span className="text-white font-black italic">"CHAMPION"</span> title and <span className="text-emerald-400 font-extrabold">+500 Gold</span> bounty.
                                    </p>

                                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/40 uppercase tracking-widest">
                                        <Sparkles size={12} /> Objective: Win floor 17
                                    </div>
                                </div>
                            </div>

                            {/* Phoenix Reward */}
                            <div className="group relative">
                                <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                                <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-zinc-950 to-black border border-emerald-500/10 shadow-3xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] pointer-events-none" />
                                    <Flame size={48} className="text-emerald-500/10 mb-8 absolute -top-2 -right-2 -rotate-12" />

                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-black uppercase tracking-tight text-emerald-500 flex items-center gap-3">
                                            The Phoenix Risen <Sparkles size={18} />
                                        </h4>
                                        <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Redemption Arc</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-400 leading-relaxed font-medium mb-6 max-w-md">
                                        Rise from the ashes to earn the <span className="text-white font-black italic">"PHOENIX"</span> title, <span className="text-emerald-400 font-extrabold">+50 Gold</span>, and a <span className="text-purple-400 font-extrabold">Next-Season Reroll</span>.
                                    </p>

                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">
                                        <Swords size={12} /> Objective: Win Conso Final
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="space-y-48">
                        {/* CHAMPIONSHIP BRACKET */}
                        <section className="relative">
                            {/* Section Header */}
                            <div className="flex flex-col items-center mb-24 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-purple-600/10 blur-[100px]" />
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-900/40 mb-6 relative border border-white/10 transform rotate-12">
                                    <Crown size={32} className="text-white transform -rotate-12" />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-[0.25em] text-white">Championship Quest</h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-3">The Tower's Highest Peak</p>
                                <div className="w-64 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent mt-8" />
                            </div>

                            <div className="flex items-center justify-center gap-0 relative">
                                {/* Column 1: Wild Card */}
                                <div className="w-64 space-y-40 py-10 flex flex-col justify-center">
                                    <div className="relative group/match">
                                        <BracketMatchup matchup={wc1} leagueId={leagueId} label="WC MATCHUP #1" placeholder="Seed #3 vs #6" />
                                        {/* Line to Semi Connector */}
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-purple-500/50 transition-colors" />
                                    </div>
                                    <div className="relative group/match">
                                        <BracketMatchup matchup={wc2} leagueId={leagueId} label="WC MATCHUP #2" placeholder="Seed #4 vs #5" />
                                        {/* Line to Semi Connector */}
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-purple-500/50 transition-colors" />
                                    </div>
                                </div>

                                {/* Connection Column 1 */}
                                <div className="w-12 h-[500px] relative pointer-events-none">
                                    <div className="absolute top-[80px] bottom-[210px] right-0 w-full border-t border-r border-zinc-800 rounded-tr-3xl" />
                                    <div className="absolute bottom-[80px] top-[210px] right-0 w-full border-b border-r border-zinc-800 rounded-br-3xl" />
                                    <div className="absolute top-1/2 -translate-y-px -right-12 w-12 h-px bg-zinc-800" />
                                </div>

                                {/* Column 2: Semifinals */}
                                <div className="w-80 space-y-24 flex flex-col justify-center px-12">
                                    <div className="space-y-4 relative group/match">
                                        <BracketMatchup isBye teamName={seed1?.name} label="SEED #1 (BYE)" leagueId={leagueId} className="w-full h-24" />
                                        <BracketMatchup matchup={semi1} leagueId={leagueId} label="SEMIFINALS" placeholder="Seed #1 vs TBD" className="w-full h-32" />
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-purple-500/50 transition-colors" />
                                    </div>
                                    <div className="space-y-4 relative group/match">
                                        <BracketMatchup isBye teamName={seed2?.name} label="SEED #2 (BYE)" leagueId={leagueId} className="w-full h-24" />
                                        <BracketMatchup matchup={semi2} leagueId={leagueId} label="SEMIFINALS" placeholder="Seed #2 vs TBD" className="w-full h-32" />
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-purple-500/50 transition-colors" />
                                    </div>
                                </div>

                                {/* Connection Column 2 */}
                                <div className="w-12 h-[600px] relative pointer-events-none">
                                    <div className="absolute top-1/2 -translate-y-[132px] right-0 w-full h-[132px] border-t border-r border-zinc-800 rounded-tr-3xl" />
                                    <div className="absolute bottom-1/2 translate-y-[132px] right-0 w-full h-[132px] border-b border-r border-zinc-800 rounded-br-3xl" />
                                    <div className="absolute top-1/2 -translate-y-px -right-24 w-24 h-px bg-zinc-800" />
                                </div>

                                {/* Column 3: Championship */}
                                <div className="flex-1 flex flex-col justify-center pl-24">
                                    <GrandFinaleCard matchup={championship} leagueId={leagueId} />
                                </div>
                            </div>
                        </section>

                        {/* REDEMPTION ARC */}
                        <section className="relative pt-24">
                            <div className="flex flex-col items-center mb-24 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-red-600/10 blur-[100px]" />
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center shadow-2xl shadow-red-900/40 mb-6 relative border border-white/10 transform -rotate-12">
                                    <Flame size={32} className="text-white transform rotate-12" />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-[0.25em] text-white">Redemption Arc</h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-3">From the Ashes of Defeat</p>
                                <div className="w-64 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent mt-8" />
                            </div>

                            <div className="flex gap-24 items-center justify-center">
                                {/* Column 1: Consolation Semis */}
                                <div className="flex flex-col gap-12">
                                    <div className="relative group/match">
                                        <BracketMatchup matchup={rSemi1} leagueId={leagueId} label="CONSO SEMI" placeholder="Seed #7 vs #10" className="w-64 h-28" />
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-red-500/50 transition-colors" />
                                    </div>
                                    <div className="relative group/match">
                                        <BracketMatchup matchup={rSemi2} leagueId={leagueId} label="CONSO SEMI" placeholder="Seed #8 vs #9" className="w-64 h-28" />
                                        <div className="absolute top-1/2 -right-12 w-12 h-px bg-zinc-800 group-hover/match:bg-red-500/50 transition-colors" />
                                    </div>
                                </div>

                                {/* Vertical Connection */}
                                <div className="w-px h-[200px] bg-zinc-800 relative">
                                    <div className="absolute top-0 right-0 w-12 h-px bg-zinc-800" />
                                    <div className="absolute bottom-0 right-0 w-12 h-px bg-zinc-800" />
                                    <div className="absolute top-1/2 -translate-y-px left-0 w-24 h-px bg-zinc-800" />
                                </div>

                                {/* Column 2: Finals */}
                                <div className="flex flex-col gap-16 pl-24">
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 text-center">Phoenix Final</div>
                                        <div className="p-[2px] rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500/40 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                            <BracketMatchup matchup={rFinal} leagueId={leagueId} label="THE PHOENIX BATTLE" placeholder="Winner of Semis" className="w-72 h-36 bg-zinc-950/90 border-transparent" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 grayscale-50 opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 text-center">Toilet Bowl</div>
                                        <BracketMatchup matchup={toiletBowl} leagueId={leagueId} label="THE DISHONORABLE" placeholder="Loser of Semis" className="w-72 h-32 border-red-900/20" />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
