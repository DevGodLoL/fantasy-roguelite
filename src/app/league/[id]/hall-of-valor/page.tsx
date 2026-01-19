import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calculateSeasonScore } from "@/lib/game-logic/scoring";
import { Trophy, Crown, Sparkles, Coins, Scroll, ArrowRight, ShieldCheck, Star } from "lucide-react";

export default async function HallOfValorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: { teams: true },
    });

    if (!league) return notFound();

    // Get user team
    const userTeam = league.teams.find(t => t.name === "The DevGods") || league.teams[0];

    // Calculate Score
    const scoreData = await calculateSeasonScore(leagueId, userTeam.id);

    // Determine Theme Colors based on Rank
    const getTheme = (rank: string) => {
        if (rank.startsWith('S')) return {
            bg: 'bg-amber-500',
            text: 'text-amber-400',
            glow: 'shadow-[0_0_100px_rgba(245,158,11,0.5)]',
            gradient: 'from-amber-400 via-orange-500 to-yellow-300'
        };
        if (rank === 'A') return {
            bg: 'bg-indigo-500',
            text: 'text-indigo-400',
            glow: 'shadow-[0_0_100px_rgba(99,102,241,0.5)]',
            gradient: 'from-indigo-400 via-purple-500 to-pink-400'
        };
        if (rank === 'B') return {
            bg: 'bg-emerald-500',
            text: 'text-emerald-400',
            glow: 'shadow-[0_0_100px_rgba(16,185,129,0.5)]',
            gradient: 'from-emerald-400 via-teal-500 to-cyan-300'
        };
        return {
            bg: 'bg-zinc-500',
            text: 'text-zinc-400',
            glow: 'shadow-[0_0_100px_rgba(113,113,122,0.3)]',
            gradient: 'from-zinc-400 via-zinc-500 to-zinc-300'
        };
    };

    const theme = getTheme(scoreData.rankGrade);

    // Get Commander Profile
    const { getCommanderProfile } = await import("@/lib/game-logic/progression");
    const commanderProfile = await getCommanderProfile(userTeam.ownerId);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[150px] ${theme.bg}`} />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05]" />
            </div>

            <div className="relative z-10 max-w-6xl w-full p-4 md:p-12 space-y-12 animate-in fade-in zoom-in duration-700">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h2 className="text-zinc-500 text-sm font-black uppercase tracking-[0.5em] animate-pulse">
                        Season Complete
                    </h2>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter">
                        <span className={`bg-gradient-to-b ${theme.gradient} bg-clip-text text-transparent`}>
                            Hall of Valor
                        </span>
                    </h1>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8 items-stretch h-full">

                    {/* LEFT PANEL: The Grade */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center relative p-8 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-md">
                        <div className={`absolute inset-0 rounded-3xl blur-[80px] opacity-20 pointer-events-none ${theme.bg}`} />

                        <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
                            {/* Rotating Ring */}
                            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-white/10 animate-spin-slow`} style={{ animationDuration: '30s' }} />
                            <div className={`absolute inset-4 rounded-full border border-white/5`} />

                            <div className={`text-[10rem] font-black italic bg-gradient-to-br ${theme.gradient} bg-clip-text text-transparent drop-shadow-2xl`}>
                                {scoreData.rankGrade}
                            </div>
                        </div>
                        <div className="text-zinc-400 text-sm font-bold uppercase tracking-widest mt-6">Run Grade</div>

                        {/* Achievements List */}
                        <div className="mt-8 flex flex-wrap justify-center gap-2">
                            {scoreData.achievements.map((ach, i) => (
                                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                                    {ach}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* CENTER PANEL: Score Breakdown */}
                    <div className="lg:col-span-1 space-y-6 flex flex-col justify-center p-8 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-md">
                        <h3 className="text-center text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">Score Analysis</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <Trophy size={18} className="text-amber-500" />
                                    <span className="uppercase text-xs font-bold tracking-wider">Record ({scoreData.summary.wins}-{scoreData.summary.losses})</span>
                                </div>
                                <span className="font-mono font-bold text-xl">{scoreData.winsScore.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <Coins size={18} className="text-yellow-500" />
                                    <span className="uppercase text-xs font-bold tracking-wider">Wealth ({scoreData.summary.finalGold}g)</span>
                                </div>
                                <span className="font-mono font-bold text-xl">{scoreData.goldBonus.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <Sparkles size={18} className="text-purple-500" />
                                    <span className="uppercase text-xs font-bold tracking-wider">Collection ({scoreData.summary.artifactsCount} Items)</span>
                                </div>
                                <span className="font-mono font-bold text-xl">{scoreData.artifactBonus.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5 opacity-50">
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <ShieldCheck size={18} />
                                    <span className="uppercase text-xs font-bold tracking-wider">Quest Bonus</span>
                                </div>
                                <span className="font-mono font-bold text-xl">{scoreData.questBonus.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="pt-6 mt-auto border-t border-white/10 flex justify-between items-end">
                            <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">Total Score</span>
                            <span className={`text-4xl font-black bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                                {scoreData.totalScore.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Rewards & Prestige */}
                    <div className="lg:col-span-1 flex flex-col p-8 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl relative overflow-hidden group">
                        {/* Shine Effect */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                                <Star size={14} /> Legacy Unlocked
                            </h3>
                            <div className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                LVL {commanderProfile.level}
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            {scoreData.rewards.length > 0 ? scoreData.rewards.map((reward, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-2xl border border-white/10">
                                        {reward.icon}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">{reward.value}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">{reward.label}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-zinc-600 italic py-12">
                                    No rewards earned this run.
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2 group/tooltip relative">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 cursor-help border-b border-dashed border-zinc-700">Prestige XP</span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-zinc-950 border border-white/10 rounded-xl shadow-xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all pointer-events-none z-50">
                                        <div className="text-[10px] text-zinc-400 leading-relaxed">
                                            Experience earned towards your <span className="text-emerald-400 font-bold">Commander Level {commanderProfile.level}</span>. Leveling up unlocks permanent perks and new starting artifacts for future runs.
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-emerald-400 font-bold">+{scoreData.prestigeXP} XP</div>
                                    <div className="text-[9px] text-zinc-600 font-mono">{commanderProfile.currentXP} / {commanderProfile.nextLevelXP}</div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-black rounded-full overflow-hidden relative">
                                {/* Base Progress */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-zinc-700 rounded-full transition-all duration-1000"
                                    style={{ width: `${commanderProfile.progressPercent}%` }}
                                />
                                {/* New Progress (Visual Approximation) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-emerald-500/50 rounded-full animate-pulse"
                                    style={{
                                        left: `${commanderProfile.progressPercent}%`,
                                        width: `${Math.min(100 - commanderProfile.progressPercent, (scoreData.prestigeXP / commanderProfile.nextLevelXP) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
                    <Link
                        href={`/league/${leagueId}/transactions`}
                        className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                    >
                        📜 View Chronicles
                    </Link>

                    {/* server action form */}
                    <form action={async () => {
                        "use server";
                        const { claimSeasonRewards } = await import("@/app/actions/hall-of-valor");
                        await claimSeasonRewards(leagueId, userTeam.id);
                        // In real app, redirect or show success.
                        // For roguelite loop, typically redirects to "New Game" or Main Menu
                    }}>
                        <button
                            type="submit"
                            disabled={userTeam.rewardsClaimed}
                            className={`
                                px-8 py-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2
                                ${userTeam.rewardsClaimed
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                }
                            `}
                        >
                            {userTeam.rewardsClaimed ? (
                                <>✅ Rewards Claimed</>
                            ) : (
                                <>
                                    <Crown size={18} className="text-amber-600" />
                                    Claim Rewards & Ascend
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
