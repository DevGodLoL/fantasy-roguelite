"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Lock, Swords, CheckCircle2, Trophy, Sparkles } from "lucide-react";

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

    // Calculate path segments for the winding road
    const getNodePosition = (index: number, total: number) => {
        // Alternate left/right with some variance
        const isLeft = index % 2 === 0;
        const xOffset = isLeft ? 25 : 75; // Percentage from left
        const ySpacing = 100 / (total + 1);
        const yPosition = ySpacing * (total - index); // Reverse: Week 1 at bottom

        return { x: xOffset, y: yPosition };
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans overflow-hidden relative">
            {/* Atmospheric Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-purple-900/10 blur-[200px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-blue-900/8 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[60%] left-[5%] w-[30%] h-[30%] bg-amber-900/6 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

                {/* Star field effect */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(1px 1px at 20px 30px, white, transparent), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 50px 160px, white, transparent), radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 130px 80px, white, transparent)',
                        backgroundSize: '200px 200px'
                    }}
                />
            </div>

            {/* Header Stats Panel */}
            <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/league/${leagueId}`}
                                className="text-zinc-500 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                Back
                            </Link>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-lg shadow-lg">
                                    🗺️
                                </div>
                                <div>
                                    <h1 className="text-xl font-black uppercase tracking-tight">Campaign Map</h1>
                                    <p className="text-xs text-zinc-500">{teamName}'s Journey</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-3">
                            <div className="px-4 py-2 bg-zinc-900/60 border border-white/10 rounded-xl flex items-center gap-2">
                                <span className="text-lg font-black text-white">{stats.wins}-{stats.losses}</span>
                                <span className="text-[10px] text-zinc-500 uppercase">Record</span>
                            </div>
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                                <span className="text-lg font-black text-amber-400">{stats.gold}</span>
                                <span className="text-[10px] text-amber-500/60 uppercase">Gold</span>
                            </div>
                            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-400" />
                                <span className="text-lg font-black text-purple-400">{stats.artifacts}</span>
                                <span className="text-[10px] text-purple-500/60 uppercase">Artifacts</span>
                            </div>
                            {stats.streak.count > 0 && (
                                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${stats.streak.type === 'W'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                                        : 'bg-red-500/10 border border-red-500/20'
                                    }`}>
                                    <span className="text-lg">{stats.streak.type === 'W' ? '🔥' : '💀'}</span>
                                    <span className={`text-lg font-black ${stats.streak.type === 'W' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stats.streak.type}{stats.streak.count}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Map Area */}
            <main ref={mapRef} className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* SVG Path Background */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-0"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.5" />
                            <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>

                    {/* Winding Path */}
                    <path
                        d={`M 50 95 ${weeks.map((_, i) => {
                            const pos = getNodePosition(i, weeks.length);
                            return `L ${pos.x} ${pos.y}`;
                        }).join(' ')}`}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                        className="opacity-60"
                    />
                </svg>

                {/* Week Nodes */}
                <div className="relative space-y-8">
                    {[...weeks].reverse().map((week, index) => {
                        const isLeft = (weeks.length - 1 - index) % 2 === 0;
                        const isBoss = week.number === weeks.length;

                        // Determine visual state
                        let nodeStyles = {
                            bg: "bg-zinc-900",
                            border: "border-zinc-700",
                            glow: "",
                            icon: <Lock size={20} className="text-zinc-600" />,
                            textColor: "text-zinc-600"
                        };

                        if (week.isCompleted) {
                            nodeStyles = {
                                bg: "bg-emerald-950",
                                border: "border-emerald-500/40",
                                glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                                icon: <CheckCircle2 size={20} className="text-emerald-400" />,
                                textColor: "text-emerald-400"
                            };
                        } else if (week.isCurrent) {
                            nodeStyles = {
                                bg: "bg-purple-600",
                                border: "border-purple-400",
                                glow: "shadow-[0_0_30px_rgba(147,51,234,0.5)] ring-4 ring-purple-500/20",
                                icon: <Swords size={22} className="text-white animate-pulse" />,
                                textColor: "text-white"
                            };
                        }

                        // Boss override
                        if (isBoss) {
                            nodeStyles.icon = <Trophy size={22} className={week.isCompleted ? 'text-amber-400' : week.isCurrent ? 'text-white' : 'text-amber-500/50'} />;
                            if (!week.isCompleted && !week.isCurrent) {
                                nodeStyles.bg = "bg-amber-950/30";
                                nodeStyles.border = "border-amber-500/30";
                                nodeStyles.textColor = "text-amber-500/50";
                            }
                        }

                        return (
                            <Link
                                key={week.id}
                                href={week.isLocked ? '#' : `/league/${leagueId}/week/${week.number}`}
                                data-current={week.isCurrent}
                                className={`
                                    relative flex items-center gap-6 p-4 rounded-2xl border transition-all duration-300
                                    ${isLeft ? 'md:mr-auto md:max-w-[70%]' : 'md:ml-auto md:max-w-[70%]'}
                                    ${nodeStyles.bg} ${nodeStyles.border} ${nodeStyles.glow}
                                    ${week.isLocked ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02] hover:border-white/20'}
                                    group
                                `}
                            >
                                {/* Node Circle */}
                                <div className={`
                                    w-14 h-14 rounded-full flex items-center justify-center border-2 shrink-0
                                    ${nodeStyles.bg} ${nodeStyles.border} ${nodeStyles.glow}
                                    transition-all group-hover:scale-110
                                `}>
                                    {nodeStyles.icon}
                                </div>

                                {/* Node Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${week.isCurrent ? 'text-purple-300' : 'text-zinc-500'
                                            }`}>
                                            {isBoss ? '👑 Final Boss' : `Floor ${week.number}`}
                                        </span>
                                        {week.isCurrent && (
                                            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                                        )}
                                    </div>
                                    <h3 className={`text-lg font-bold font-serif italic truncate ${nodeStyles.textColor}`}>
                                        {week.name}
                                    </h3>
                                </div>

                                {/* Arrow Indicator */}
                                {!week.isLocked && (
                                    <div className="text-zinc-600 group-hover:text-white transition-colors">
                                        →
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-16 flex flex-wrap justify-center gap-6 text-[10px] text-zinc-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40" />
                        <span>Cleared</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-600 border border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.5)]" />
                        <span>Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700" />
                        <span>Locked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-950/30 border border-amber-500/30" />
                        <span>Boss</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
