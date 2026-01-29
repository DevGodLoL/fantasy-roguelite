"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Trophy, Zap, Ghost, ScrollText, Sparkles } from "lucide-react";

export interface RitualRecapProps {
    leagueId: string;
    weekNumber: number;
    onClose: () => void;
}

export interface RecapData {
    weekNumber: number;
    weekName: string;
    totalArtifactsConsumed: number;
    highestScoringTeam: { name: string; score: number };
    mvpPlayer: { name: string; pos: string; score: number; teamName: string };
    totalPointsScored: number;
    newTraitsCount: number;
    matchups: Array<{
        homeTeam: string;
        awayTeam: string;
        homeScore: number;
        awayScore: number;
        winner: string;
        logs: string[];
    }>;
}

export default function RitualResolutionModal({ leagueId, weekNumber }: { leagueId: string; weekNumber: number }) {
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<RecapData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 100);

        async function fetchRecap() {
            try {
                // We'll fetch this from a server action we're about to create
                const response = await fetch(`/api/league/${leagueId}/recap/${weekNumber}`);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch ritual recap:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRecap();
        return () => clearTimeout(timer);
    }, [leagueId, weekNumber]);

    const handleClose = () => {
        setIsVisible(false);
        // Remove query param or clear state if needed
        setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("recap");
            window.history.replaceState({}, "", url.toString());
            window.location.reload(); // Hard reload to clear the view if it was injected
        }, 500);
    };

    if (!isVisible && !loading && !data) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-700 ${isVisible ? 'bg-black/95 backdrop-blur-2xl' : 'bg-transparent backdrop-blur-0 pointer-events-none'}`}>
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-900/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20" />
            </div>

            <div className={`relative w-full max-w-5xl bg-[#030303] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(147,51,234,0.15)] overflow-hidden transition-all duration-700 transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'}`}>
                {/* Header Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-8 py-2 bg-purple-500 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-b-2xl shadow-[0_5px_15px_rgba(147,51,234,0.4)]">
                    The Ritual is Complete
                </div>

                <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                            <p className="text-purple-400 font-black uppercase tracking-[0.3em] animate-pulse">Consulting the Grand Archive...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-12">
                            {/* Hero Section */}
                            <div className="text-center space-y-4">
                                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">
                                    <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">Floor {data.weekNumber} </span>
                                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Results</span>
                                </h2>
                                <p className="text-lg text-zinc-500 font-bold uppercase tracking-[0.5em] italic">"{data.weekName}"</p>
                            </div>

                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard icon={<Trophy className="text-amber-400" />} label="Top Command" value={data.highestScoringTeam.name} sub={`${data.highestScoringTeam.score.toFixed(1)} Pts`} color="amber" />
                                <StatCard icon={<Zap className="text-purple-400" />} label="Artifacts Used" value={data.totalArtifactsConsumed} sub="Reality Warps" color="purple" />
                                <StatCard icon={<ScrollText className="text-emerald-400" />} label="Soul Shifts" value={data.newTraitsCount} sub="New Mutations" color="emerald" />
                                <StatCard icon={<Sparkles className="text-blue-400" />} label="Total Energy" value={data.totalPointsScored.toFixed(0)} sub="Mana Generated" color="blue" />
                            </div>

                            {/* MVP Display */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition" />
                                <div className="relative bg-zinc-950/80 border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(147,51,234,0.3)]">
                                        👑
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-[0.5em] text-purple-400">War-Chief of the Cycle (MVP)</h3>
                                        <div className="text-4xl font-black text-white italic tracking-tight">{data.mvpPlayer.name} <span className="text-purple-500">[{data.mvpPlayer.pos}]</span></div>
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest">{data.mvpPlayer.teamName} • Dominance Score: {data.mvpPlayer.score.toFixed(1)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-5xl font-black text-white font-mono">{data.mvpPlayer.score.toFixed(1)}</div>
                                        <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">Combat Efficiency</div>
                                    </div>
                                </div>
                            </div>

                            {/* Conflict Outcomes */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">Battle Recaps</h3>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                                </div>

                                <div className="grid gap-6">
                                    {data.matchups.map((m, i) => (
                                        <div key={i} className="group/match bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:bg-zinc-800/40 transition-all duration-300">
                                            <div className="p-6 flex items-center justify-between">
                                                <div className={`flex flex-col ${m.winner === m.homeTeam ? 'text-white' : 'text-zinc-600'}`}>
                                                    <span className="text-lg font-black uppercase tracking-tight truncate max-w-[150px]">{m.homeTeam}</span>
                                                    <span className="text-2xl font-mono font-bold">{m.homeScore.toFixed(1)}</span>
                                                </div>

                                                <div className="flex flex-col items-center">
                                                    <div className="text-xs font-black text-zinc-800 px-4 mb-2">VS</div>
                                                    <div className="h-0.5 w-12 bg-zinc-800" />
                                                </div>

                                                <div className={`flex flex-col items-end ${m.winner === m.awayTeam ? 'text-white' : 'text-zinc-600'}`}>
                                                    <span className="text-lg font-black uppercase tracking-tight truncate max-w-[150px]">{m.awayTeam}</span>
                                                    <span className="text-2xl font-mono font-bold">{m.awayScore.toFixed(1)}</span>
                                                </div>
                                            </div>

                                            {/* Chronicle Logs */}
                                            {m.logs && m.logs.length > 0 && (
                                                <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-3 flex items-center gap-2">
                                                        <ScrollText size={10} /> The Chronicle of Conflict
                                                    </div>
                                                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                        {m.logs.map((log, li) => (
                                                            <div key={li} className="text-[10px] font-mono text-zinc-500 flex gap-2 leading-relaxed">
                                                                <span className="text-purple-500/50 shrink-0">◇</span>
                                                                <span className="opacity-80 break-words">{log}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="pt-8 flex justify-center">
                                <button
                                    onClick={handleClose}
                                    className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Seal the Chronicle <Zap className="w-4 h-4 fill-black" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h3 className="text-2xl font-black text-white italic">The fates are clouded...</h3>
                            <button onClick={handleClose} className="mt-8 text-purple-400 underline uppercase tracking-widest text-xs">Return to Sanctuary</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode, label: string, value: string | number, sub: string, color: string }) {
    const colorClasses: Record<string, string> = {
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-500/60",
        purple: "border-purple-500/20 bg-purple-500/5 text-purple-500/60",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500/60",
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-500/60"
    };

    return (
        <div className={`p-6 border rounded-3xl ${colorClasses[color]} flex flex-col items-center text-center space-y-2`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</div>
            <div className="text-xl font-black text-white tracking-tighter truncate w-full">{value}</div>
            <div className="text-[9px] font-bold uppercase opacity-60 tracking-widest">{sub}</div>
        </div>
    );
}
