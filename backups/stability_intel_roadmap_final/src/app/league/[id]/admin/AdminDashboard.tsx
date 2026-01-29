"use client";

import { useState, useEffect } from "react";
import { simulateWeek } from "../week/[weekNumber]/actions";
import { resetLeagueDatabase, getLeagueHealth, repairLeagueSchedule } from "./actions";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Activity, RefreshCw } from "lucide-react";

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
    const [healthReport, setHealthReport] = useState<any>(null);
    const [foresightWarnings, setForesightWarnings] = useState<any[] | null>(null);

    const handleCheckHealth = async () => {
        setIsLoading(true);
        try {
            const report = await getLeagueHealth(leagueId);
            setHealthReport(report);
            if (report.isHealthy) {
                toast.success("The Seal is intact. The timeline is stable.");
            } else {
                toast.warning(`Anomalies detected in the weave: ${report.issues.length} issues found.`);
            }
        } catch (e) {
            toast.error("Failed to read the temporal signs.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRepairSchedule = async () => {
        setIsLoading(true);
        try {
            await repairLeagueSchedule(leagueId);
            toast.success("The Arbiter has mended the timeline.");
            await handleCheckHealth(); // Refresh report
        } catch (e) {
            toast.error("Failed to mend the timeline.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdvance = async (bypass = false) => {
        if (!isConfirming && !bypass) {
            setIsConfirming(true);
            return;
        }

        setIsLoading(true);
        setIsConfirming(false);
        setForesightWarnings(null);

        try {
            const result = await simulateWeek(leagueId, currentWeekNumber, bypass);
            if (result.success) {
                toast.success("Temporal shift complete. The weave has advanced.");
                window.location.href = `/league/${leagueId}?recap=true&week=${currentWeekNumber}`;
            } else if ((result as any).needsConfirmation) {
                setForesightWarnings((result as any).warnings);
                toast.warning("The Oracle has detected anomalies in the formation.");
            } else {
                toast.error(`The ritual failed: ${result.error}`);
            }
        } catch (e) {
            console.error(e);
            toast.error("A temporal anomaly occurred. Failed to advance.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("ARE YOU SURE? This will delete all progress, simulated scores, and artifacts for EVERY team in this league.")) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetLeagueDatabase(leagueId);
            if (result.success) {
                toast.success("The narrative has been erased. A new era begins.");
                window.location.href = `/league/${leagueId}`;
            } else {
                toast.error("The erasure failed: " + result.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("A critical failure occurred during erasure.");
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
                            {isSeasonOver ? "Final Era" : `Floor ${currentWeekNumber}`}
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
                        onClick={() => handleAdvance()}
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
                                {isLoading ? "Channeling Temporal Energy..." : isSeasonOver ? "Chronicle Closed" : isConfirming ? "SEAL THE FATES (CLICK AGAIN)" : `Initiate Convergence: Floor ${currentWeekNumber}`}
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
            {/* ARBITER'S SEAL - DIAGNOSTICS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${healthReport ? (healthReport.isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400') : 'bg-zinc-800 text-zinc-500'}`}>
                            {healthReport ? (healthReport.isHealthy ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />) : <Activity size={24} />}
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Arbiter&apos;s Seal</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Chronicle Integrity Diagnostic</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckHealth}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        {isLoading ? "Analyzing..." : "Run Diagnostic"}
                    </button>
                </div>

                {healthReport ? (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${healthReport.isHealthy ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-black uppercase tracking-widest ${healthReport.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {healthReport.isHealthy ? "✓ Timeline Stable" : "⚠ Anomalies Detected"}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                    {healthReport.summary.totalTeams} Teams · {healthReport.summary.totalMatchups} Matchups
                                </span>
                            </div>

                            {!healthReport.isHealthy && (
                                <div className="mt-4 space-y-2">
                                    {healthReport.issues.map((issue: any, i: number) => (
                                        <div key={i} className="text-[10px] text-zinc-400 flex items-start gap-2">
                                            <span className="text-amber-500">•</span>
                                            <span>{issue.description}</span>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleRepairSchedule}
                                        disabled={isLoading}
                                        className="mt-4 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                        Heal Timeline Fragments
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[.2em]">Diagnostic Required</p>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* RESTRICTED DATA - DEBUG / LOGS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className="p-8 bg-black/40 border border-red-500/20 rounded-3xl group hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left"
                >
                    <h3 className="text-[10px] font-black uppercase tracking-[.3em] text-red-500/60 group-hover:text-red-500 mb-6 flex items-center gap-2">
                        <span className="text-lg grayscale-0">🧨</span> Erasure Protocols
                    </h3>
                    <div className="h-12 w-full bg-zinc-900/50 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest transition-colors">
                        Reset Entire Narrative
                    </div>
                </button>

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
                    <span className="text-[8px] opacity-40 uppercase">Floor {currentWeekNumber} Stream</span>
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

            {/* Oracle's Foresight Warnings Modal */}
            {foresightWarnings && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-6">
                    <div className="max-w-lg w-full bg-zinc-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">
                        <div className="p-8 border-b border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3 relative z-10">
                                <span className="text-2xl">🔮</span> Oracle&apos;s Foresight
                            </h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1 relative z-10">
                                The Weaver warns of unstable formations
                            </p>
                        </div>

                        <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {foresightWarnings.map((w, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shrink-0">
                                        🛡️
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">{w.teamName}</div>
                                        <div className="text-xs text-zinc-300 font-medium leading-relaxed">{w.issue}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-black/40 flex flex-col gap-3">
                            <button
                                onClick={() => handleAdvance(true)}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase tracking-[.2em] text-[10px] rounded-xl shadow-lg shadow-purple-900/40 transition-all"
                            >
                                Proceed Anyway (Unstable Weave)
                            </button>
                            <button
                                onClick={() => setForesightWarnings(null)}
                                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-black uppercase tracking-[.2em] text-[10px] rounded-xl border border-white/5 transition-all"
                            >
                                Halt the Ritual
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
