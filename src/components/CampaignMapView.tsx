"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Lock, Swords, CheckCircle2, Trophy, Sparkles, Crown, Flame, Shield, Skull } from "lucide-react";

interface WeekNode {
    id: string;
    number: number;
    name: string;
    isCurrent: boolean;
    isCompleted: boolean;
    isLocked: boolean;
}

interface PlayerStats {
    wins: number;
    losses: number;
    gold: number;
    artifacts: number;
    streak: { type: 'W' | 'L' | 'T'; count: number };
}

interface CampaignMapViewProps {
    leagueId: string;
    weeks: WeekNode[];
    stats: PlayerStats;
    teamName: string;
}

export default function CampaignMapView({ leagueId, weeks, stats, teamName }: CampaignMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current week on mount
    useEffect(() => {
        if (mapRef.current) {
            const currentNode = mapRef.current.querySelector('[data-current="true"]');
            if (currentNode) {
                currentNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, []);

    // Separate regular season from playoffs
    const regularSeason = weeks.filter(w => w.number <= 14);
    const playoffs = weeks.filter(w => w.number >= 15);

    // Get floor type icon
    const getFloorIcon = (week: WeekNode, isPlayoff: boolean) => {
        if (week.isCompleted) return <CheckCircle2 size={20} className="text-emerald-400" />;
        if (week.isCurrent) return <Swords size={20} className="text-white animate-pulse" />;
        if (isPlayoff) return <Trophy size={18} className="text-amber-500/50" />;
        return <Lock size={16} className="text-zinc-600" />;
    };

    // Get floor styling based on state
    const getFloorStyles = (week: WeekNode, isPlayoff: boolean) => {
        if (week.isCompleted) {
            return {
                card: "bg-gradient-to-r from-emerald-950/80 to-emerald-900/40 border-emerald-500/30 hover:border-emerald-400/50",
                glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
                badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                text: "text-emerald-300"
            };
        }
        if (week.isCurrent) {
            return isPlayoff ? {
                card: "bg-gradient-to-r from-amber-950/80 to-amber-900/40 border-amber-400/60 hover:border-amber-300",
                glow: "shadow-[0_0_40px_rgba(251,191,36,0.25)] ring-2 ring-amber-500/30",
                badge: "bg-amber-500/20 text-amber-300 border-amber-400/50",
                text: "text-amber-200"
            } : {
                card: "bg-gradient-to-r from-purple-950/80 to-purple-900/40 border-purple-400/60 hover:border-purple-300",
                glow: "shadow-[0_0_40px_rgba(147,51,234,0.3)] ring-2 ring-purple-500/30",
                badge: "bg-purple-500/20 text-purple-300 border-purple-400/50",
                text: "text-purple-200"
            };
        }
        if (isPlayoff) {
            return {
                card: "bg-gradient-to-r from-amber-950/30 to-zinc-900/50 border-amber-500/20 hover:border-amber-400/30",
                glow: "",
                badge: "bg-amber-500/10 text-amber-500/60 border-amber-500/20",
                text: "text-amber-500/50"
            };
        }
        return {
            card: "bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/70",
            glow: "",
            badge: "bg-zinc-800/50 text-zinc-600 border-zinc-700/50",
            text: "text-zinc-500"
        };
    };

    const FloorCard = ({ week, isPlayoff = false }: { week: WeekNode; isPlayoff?: boolean }) => {
        const styles = getFloorStyles(week, isPlayoff);
        const floorLabel = isPlayoff
            ? week.number === 17 ? "👑 CHAMPIONSHIP" : `🏆 PLAYOFF ROUND ${week.number - 14}`
            : `FLOOR ${week.number}`;

        return (
            <Link
                href={week.isLocked ? '#' : `/league/${leagueId}/week/${week.number}`}
                data-current={week.isCurrent}
                className={`
                    relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 group
                    ${styles.card} ${styles.glow}
                    ${week.isLocked ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.01]'}
                `}
            >
                {/* Floor Number Badge */}
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center border shrink-0
                    ${styles.badge} transition-all group-hover:scale-105
                `}>
                    {getFloorIcon(week, isPlayoff)}
                </div>

                {/* Floor Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.text}`}>
                            {floorLabel}
                        </span>
                        {week.isCurrent && (
                            <span className={`h-1.5 w-1.5 rounded-full ${isPlayoff ? 'bg-amber-400' : 'bg-purple-400'} animate-pulse`} />
                        )}
                    </div>
                    <h3 className={`text-base font-bold truncate ${week.isCurrent ? 'text-white' : week.isCompleted ? 'text-emerald-200' : 'text-zinc-400'}`}>
                        {week.name}
                    </h3>
                </div>

                {/* Status Indicator */}
                <div className="text-right shrink-0">
                    {week.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Conquered</span>
                    )}
                    {week.isCurrent && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlayoff ? 'text-amber-400' : 'text-purple-400'}`}>
                            ⚔️ Active
                        </span>
                    )}
                    {week.isLocked && !week.isCompleted && !week.isCurrent && (
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Locked</span>
                    )}
                </div>

                {/* Hover Arrow */}
                {!week.isLocked && (
                    <div className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                        →
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
            {/* Immersive Background Layers */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Static Stone Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }} />

                {/* Dynamic Gradients */}
                <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-purple-900/10 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[800px] h-[600px] bg-amber-900/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Floating Embers/Particles */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white/10 rounded-full blur-[1px] animate-float"
                            style={{
                                width: Math.random() * 4 + 1 + 'px',
                                height: Math.random() * 4 + 1 + 'px',
                                left: Math.random() * 100 + '%',
                                top: Math.random() * 100 + '%',
                                animationDuration: Math.random() * 10 + 10 + 's',
                                animationDelay: Math.random() * 5 + 's',
                                opacity: Math.random() * 0.5
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Header */}
            <header className="relative z-30 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 shadow-2xl">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/league/${leagueId}`}
                                className="text-zinc-500 hover:text-purple-400 transition-all text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 hover:bg-white/10"
                            >
                                <span className="text-lg leading-none">←</span>
                                COMMAND
                            </Link>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-900/40">
                                    <Shield size={18} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-base font-black uppercase tracking-[0.1em] bg-gradient-to-r from-purple-200 to-blue-300 bg-clip-text text-transparent">
                                        The Infinite Tower
                                    </h1>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">{teamName}'s Ascent</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="px-3 py-1.5 bg-zinc-900/90 border border-white/5 rounded-lg flex items-center gap-2">
                                <span className="text-sm font-black text-zinc-100">{stats.wins}-{stats.losses}</span>
                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Record</span>
                            </div>
                            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                <span className="text-sm font-black text-amber-400">{stats.gold}</span>
                                <span className="text-[8px] text-amber-600 font-bold uppercase tracking-wider">Gold</span>
                            </div>
                            {stats.streak.count > 0 && (
                                <div className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${stats.streak.type === 'W' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                                    }`}>
                                    <span className="text-sm">{stats.streak.type === 'W' ? '🔥' : '💀'}</span>
                                    <span className={`text-sm font-black ${stats.streak.type === 'W' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.streak.count}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Map Body */}
            <main ref={mapRef} className="relative z-10 max-w-4xl mx-auto px-6 py-16">

                {/* Central Tower Spine */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/20 via-purple-500/20 to-zinc-800/20 z-0 pointer-events-none" />

                {/* Playoff Section */}
                {playoffs.length > 0 && (
                    <section className="relative mb-24">
                        <div className="flex flex-col items-center mb-12 relative z-10">
                            <div className="mb-4 p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 shadow-2xl shadow-amber-500/10 rotate-45">
                                <Crown size={32} className="text-amber-400 -rotate-45" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-amber-400 text-center">
                                The Playoff Gauntlet
                            </h2>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.3em] mt-2">Floors 15-17 • Throne of Glory</p>

                            <Link
                                href={`/league/${leagueId}/playoffs`}
                                className="mt-6 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-500 hover:bg-amber-500/20 hover:scale-105 transition-all uppercase tracking-widest"
                            >
                                View Live Bracket
                            </Link>
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            {[...playoffs].reverse().map((week, idx) => (
                                <div key={week.id} className={`w-full max-w-md flex ${idx % 2 === 0 ? 'justify-end md:pr-12' : 'justify-start md:pl-12'} relative`}>
                                    {/* Horizontal connection to spine */}
                                    <div className={`absolute top-1/2 h-px bg-amber-500/20 w-12 hidden md:block ${idx % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}`} />
                                    <div className="w-full md:w-[85%]">
                                        <FloorCard week={week} isPlayoff={true} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Section Transition */}
                <div className="relative flex items-center justify-center py-16">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Flame size={120} className="text-amber-500 animate-pulse" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="h-24 w-px bg-gradient-to-b from-amber-500/50 to-purple-600/50" />
                        <div className="w-10 h-10 rounded-full bg-black border-2 border-purple-500/50 flex items-center justify-center">
                            <Skull size={20} className="text-purple-400" />
                        </div>
                        <div className="h-24 w-px bg-gradient-to-b from-purple-600/50 to-zinc-800/50" />
                    </div>
                </div>

                {/* Regular Season Section */}
                <section className="relative">
                    <div className="flex flex-col items-center mb-12 relative z-10">
                        <div className="mb-4 p-4 rounded-2xl bg-zinc-900 border border-purple-500/30 shadow-2xl shadow-purple-500/10 rotate-45">
                            <Swords size={32} className="text-purple-400 -rotate-45" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-purple-400 text-center">
                            The Ascent
                        </h2>
                        <p className="text-[10px] text-purple-600 font-bold uppercase tracking-[0.3em] mt-2">Floors 1-14 • Regular Season</p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        {[...regularSeason].reverse().map((week, idx) => (
                            <div key={week.id} className={`w-full max-w-lg flex ${idx % 2 === 0 ? 'justify-start md:pl-12' : 'justify-end md:pr-12'} relative`}>
                                {/* Horizontal connection to spine */}
                                <div className={`absolute top-1/2 h-px bg-purple-500/20 w-12 hidden md:block ${idx % 2 === 0 ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'}`} />
                                <div className="w-full md:w-[85%]">
                                    <FloorCard week={week} isPlayoff={false} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Entrance */}
                    <div className="mt-20 flex flex-col items-center gap-4 opacity-30 pb-20">
                        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-zinc-500 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">
                            Gates of Despair
                        </span>
                    </div>
                </section>
            </main>

            {/* Bottom Legend */}
            <footer className="relative z-30 border-t border-white/5 bg-black/90 backdrop-blur-xl py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded bg-emerald-900 border border-emerald-500/40" />
                            <span>CONQUERED</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded bg-purple-600 animate-pulse border border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.4)]" />
                            <span className="text-purple-400">ACTIVE FLOOR</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded bg-amber-600 border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
                            <span className="text-amber-500">PLAYOFFS</span>
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    33% { transform: translateY(-20px) translateX(10px); }
                    66% { transform: translateY(-10px) translateX(-10px); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
}
