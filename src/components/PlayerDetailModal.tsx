"use client";

import { PlayerDetails } from "@/app/actions/get-player-details";
import { useEffect } from "react";

interface PlayerDetailModalProps {
    isLoading: boolean;
    player: PlayerDetails | null;
    onClose: () => void;
}

const posColors: Record<string, string> = {
    QB: "from-red-500/20 to-red-900/10 border-red-500/50 text-red-400",
    RB: "from-green-500/20 to-green-900/10 border-green-500/50 text-green-400",
    WR: "from-blue-500/20 to-blue-900/10 border-blue-500/50 text-blue-400",
    TE: "from-orange-500/20 to-orange-900/10 border-orange-500/50 text-orange-400",
    K: "from-purple-500/20 to-purple-900/10 border-purple-500/50 text-purple-400",
    DST: "from-yellow-500/20 to-yellow-900/10 border-yellow-500/50 text-yellow-400",
};

export default function PlayerDetailModal({ isLoading, player, onClose }: PlayerDetailModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Close on outside click
    const handleOutsideClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!player && !isLoading) return null;

    const colorClass = player ? (posColors[player.position] || "from-zinc-500/20 to-zinc-900/10 border-zinc-500/50 text-zinc-400") : "";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleOutsideClick}
        >
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        <div className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Scouting Player...</div>
                    </div>
                ) : player && (
                    <>
                        {/* Header */}
                        <div className={`p-8 bg-gradient-to-br ${colorClass} border-b`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm font-black uppercase tracking-widest opacity-80 mb-1">
                                        {player.teamAbbr} • {player.position}
                                    </div>
                                    <h2 className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                                        {player.name}
                                    </h2>
                                    <div className="mt-2 text-white/60 font-mono text-xs">
                                        Managed by: <span className="text-white font-bold">{player.ownerName || "Free Agent"}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-white/50 font-bold tracking-widest mb-1">Season Total</div>
                                    <div className="text-4xl font-black text-white">{player.seasonTotal.toFixed(1)}</div>
                                    <div className="text-xs text-white/60 font-mono">Avg: {player.average.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Active Mutations */}
                        {player.traits && player.traits.length > 0 && (
                            <div className="px-8 pt-8 pb-0">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Active Mutations</h3>
                                <div className="flex flex-wrap gap-2">
                                    {player.traits.map((trait, idx) => (
                                        <div key={idx} className={`px-3 py-2 rounded-lg border flex flex-col justify-center ${trait.rarity === 'legendary' ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' :
                                                trait.rarity === 'epic' ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' :
                                                    trait.rarity === 'rare' ? 'bg-blue-500/10 border-blue-500/30 text-blue-200' :
                                                        trait.rarity === 'uncommon' ? 'bg-green-500/10 border-green-500/30 text-green-200' :
                                                            'bg-zinc-800 border-zinc-700 text-zinc-300'
                                            }`}>
                                            <div className="text-xs font-black uppercase tracking-wider mb-0.5">{trait.name}</div>
                                            <div className="text-[10px] opacity-70 leading-tight">{trait.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">

                            {/* Stats Grid */}
                            <section>
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Performance Log</h3>
                                {player.performances.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {player.performances.map((perf) => (
                                            <div key={perf.weekNumber} className="flex justify-between items-center p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-1 rounded">Week {perf.weekNumber}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">
                                                        {perf.details.passYds > 0 && <span>{perf.details.passYds} PYds </span>}
                                                        {perf.details.rushYds > 0 && <span>{perf.details.rushYds} RYds </span>}
                                                        {perf.details.recYds > 0 && <span>{perf.details.recYds} RecYds </span>}
                                                        {perf.details.tds > 0 && <span className="text-green-500/70">{perf.details.tds} TD </span>}
                                                        {perf.details.fumbles > 0 && <span className="text-red-500/70">{perf.details.fumbles} Fum </span>}
                                                    </div>
                                                </div>
                                                <div className="font-black text-lg text-white">
                                                    {perf.points.toFixed(1)} <span className="text-[10px] text-zinc-600 font-normal">pts</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 italic text-sm">No games played yet.</div>
                                )}
                            </section>

                            {/* Upcoming */}
                            <section>
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Next Battle</h3>
                                {player.nextMatchup ? (
                                    <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="text-xs text-blue-400 font-bold uppercase mb-1">Week {player.nextMatchup.week}</div>
                                            <div className="text-lg font-bold text-white">vs {player.nextMatchup.opponent}</div>
                                        </div>
                                        <div className="px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase rounded-lg">
                                            Projected: {player.average.toFixed(1)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl text-zinc-500 italic text-sm">
                                        No upcoming matchup scheduled (or player is a free agent).
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
