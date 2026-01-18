"use client";

import { useState } from "react";
import { simulateWeek } from "../week/[weekNumber]/actions";
import { useRouter } from "next/navigation";

interface AdminDashboardProps {
    leagueId: string;
    currentWeekNumber: number;
    totalWeeks: number;
    isSeasonOver: boolean;
}

export default function AdminDashboard({ leagueId, currentWeekNumber, totalWeeks, isSeasonOver }: AdminDashboardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleAdvance = async () => {
        if (!confirm(`Are you sure you want to FORCE ADVANCE Week ${currentWeekNumber}?`)) return;

        setIsLoading(true);
        try {
            const result = await simulateWeek(leagueId, currentWeekNumber);
            if (result.success) {
                alert(`Week ${currentWeekNumber} simulated successfully!`);
                router.refresh();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to advance week.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Status Card */}
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">League Status</h2>
                        <div className="text-3xl font-black text-white">
                            {isSeasonOver ? "Season Completed" : `Week ${currentWeekNumber} Active`}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono text-zinc-600">Total Weeks</div>
                        <div className="text-xl font-bold text-zinc-400">{totalWeeks}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <button
                        onClick={handleAdvance}
                        disabled={isLoading || isSeasonOver}
                        className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${isLoading || isSeasonOver
                                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                            }`}
                    >
                        {isLoading ? "Simulating..." : isSeasonOver ? "Season Over" : `Force Advance Week ${currentWeekNumber}`}
                    </button>
                </div>
                <p className="mt-4 text-xs text-zinc-500 text-center">
                    Warning: checking this triggers game engine simulation for all matchups. Scores will be final. Powerups will be consumed.
                </p>
            </div>

            {/* Debug Tools */}
            <div className="grid md:grid-cols-2 gap-4 opacity-50 pointer-events-none grayscale">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-zinc-600 mb-2">Danger Zone</h3>
                    <button className="w-full py-2 bg-zinc-800 text-zinc-500 text-xs font-bold uppercase rounded-lg">
                        Reset Entire Season
                    </button>
                </div>
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <h3 className="text-xs font-black uppercase text-zinc-600 mb-2">Data</h3>
                    <button className="w-full py-2 bg-zinc-800 text-zinc-500 text-xs font-bold uppercase rounded-lg">
                        Export JSON Dump
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-zinc-700 uppercase tracking-widest">
                Commissioner Access Only • Authorized Personnel
            </p>
        </div>
    );
}
