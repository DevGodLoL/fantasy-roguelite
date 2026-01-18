"use client";

import { useState } from "react";
import { simulateWeek } from "../week/[weekNumber]/actions";

interface AdminDashboardProps {
    leagueId: string;
    currentWeekNumber: number;
    totalWeeks: number;
    isSeasonOver: boolean;
    debugMatchups: any[];
}

export default function AdminDashboard({ leagueId, currentWeekNumber, totalWeeks, isSeasonOver, debugMatchups }: AdminDashboardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleAdvance = async () => {
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        setIsLoading(true);
        setIsConfirming(false);
        try {
            const result = await simulateWeek(leagueId, currentWeekNumber);
            if (result.success) {
                // Success feedback with thematic alert
                window.location.href = `/league/${leagueId}?recap=true&week=${currentWeekNumber}`;
            } else {
                alert(`The ritual failed: ${result.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("A temporal anomaly occurred. Failed to advance.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 relative">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STATUS PLATE - THE CYCLE */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="relative p-10 bg-black/40 backdrop-blur-md border border-red-500/20 rounded-[2.5rem] overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-900/10 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-3 text-center md:text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 flex items-center justify-center md:justify-start gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse" />
                            Current Temporal Cycle
                        </h2>
                        <div className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                            {isSeasonOver ? "Final Era" : `Chapter ${currentWeekNumber}`}
                        </div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                            The weave is steady. {isSeasonOver ? "The chronicle is complete." : "The fates await your command."}
                        </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-center md:items-end gap-1">
                        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Total Chronicles</div>
                        <div className="text-5xl font-black text-zinc-400 font-mono tracking-tighter">{totalWeeks}</div>
                        <div className="text-[10px] text-zinc-800 font-bold uppercase mt-1">Convergence Points</div>
                    </div>
                </div>

                {/* Main Action - The Ritual of Advancement */}
                <div className="mt-12 space-y-6">
                    <button
                        onClick={handleAdvance}
                        onMouseLeave={() => setIsConfirming(false)}
                        disabled={isLoading || isSeasonOver}
                        className={`
                            relative w-full py-6 rounded-2xl font-black uppercase tracking-[.3em] transition-all duration-500 overflow-hidden
                            ${isLoading || isSeasonOver
                                ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800"
                                : isConfirming
                                    ? "bg-red-700 text-white shadow-[0_0_50px_rgba(185,28,28,0.4)] animate-pulse border-red-500"
                                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_10px_30px_rgba(220,38,38,0.2)] border border-red-400/20"
                            }
                        `}
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-xl">
                                {isLoading ? "⏳" : isSeasonOver ? "⌛" : isConfirming ? "⚠️" : "⚡"}
                            </span>
                            <span>
                                {isLoading ? "Channeling Temporal Energy..." : isSeasonOver ? "Chronicle Closed" : isConfirming ? "SEAL THE FATES (CLICK AGAIN)" : `Initiate Convergence: Chapter ${currentWeekNumber}`}
                            </span>
                        </div>
                        {/* Interactive Sparkle Layer */}
                        {!isLoading && !isSeasonOver && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        )}
                    </button>

                    <div className="text-center">
                        <p className={`text-[10px] font-black tracking-widest transition-all duration-500 ${isConfirming ? 'text-red-400 animate-bounce' : 'text-zinc-600'}`}>
                            {isConfirming
                                ? "WARNING: This action cannot be undone. All results will be finalized in the Tome."
                                : "A Sacrifice of Time: This will resolve all battles and consume active artifacts."
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* RESTRICTED DATA - DEBUG / LOGS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-zinc-950/40 border border-zinc-800/50 rounded-3xl opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                    <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 mb-6 flex items-center gap-2">
                        <span className="text-lg">🧨</span> Erasure Protocols
                    </h3>
                    <div className="h-12 w-full bg-zinc-900/50 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase text-zinc-700 tracking-widest">
                        Reset Entire Narrative
                    </div>
                </div>

                <div className="p-8 bg-zinc-950/40 border border-zinc-800/50 rounded-3xl opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                    <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 mb-6 flex items-center gap-2">
                        <span className="text-lg">📜</span> Manifest Archive
                    </h3>
                    <div className="h-12 w-full bg-zinc-900/50 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase text-zinc-700 tracking-widest">
                        Download JSON Chronicle
                    </div>
                </div>
            </div>

            {/* Battle Feed - Minimalistic Console Style */}
            <div className="p-6 bg-black border border-white/5 rounded-2xl font-mono text-[9px] text-zinc-600 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <h4 className="font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> System: Battle Status Pulse
                    </h4>
                    <span className="text-[8px] opacity-40 uppercase">Chapter {currentWeekNumber} Stream</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {debugMatchups?.length > 0 ? (
                        debugMatchups.map(m => (
                            <div key={m.id} className="p-2 bg-white/[0.02] rounded border border-white/5 flex items-center justify-between">
                                <span className="opacity-40">{m.id.slice(-6)}</span>
                                <span className={`font-bold ${m.status === 'final' ? 'text-emerald-500/50' : 'text-amber-500/50'}`}>
                                    {m.status.toUpperCase()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-4 text-center py-4 opacity-50 italic">No active battle streams found.</div>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-red-500/20 border-t-red-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">⚡</div>
                    </div>
                    <div className="mt-8 text-white font-black uppercase tracking-[0.5em] text-sm animate-pulse">
                        Rerouting the Weave...
                    </div>
                    <p className="mt-2 text-red-500/50 text-[10px] font-bold uppercase tracking-widest">Applying universal shifts across all dimensions</p>
                </div>
            )}
        </div>
    );
}
