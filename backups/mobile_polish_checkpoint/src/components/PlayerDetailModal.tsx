"use client";

import { PlayerDetails } from "@/app/actions/get-player-details";
import { useEffect } from "react";

interface PlayerDetailModalProps {
    isLoading: boolean;
    player: PlayerDetails | null;
    onClose: () => void;
}

const posColors: Record<string, string> = {
    QB: "from-red-500/20 to-red-900/10 border-red-500/50 text-red-100 ring-red-500/30",
    RB: "from-emerald-500/20 to-emerald-900/10 border-emerald-500/50 text-emerald-100 ring-emerald-500/30",
    WR: "from-blue-500/20 to-blue-900/10 border-blue-500/50 text-blue-100 ring-blue-500/30",
    TE: "from-amber-500/20 to-amber-900/10 border-amber-500/50 text-amber-100 ring-amber-500/30",
    K: "from-purple-500/20 to-purple-900/10 border-purple-500/50 text-purple-100 ring-purple-500/30",
    DST: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/50 text-cyan-100 ring-cyan-500/30",
};

function traitColorClass(rarity: string) {
    switch (rarity.toLowerCase()) {
        case 'legendary': return 'from-amber-500/10 via-amber-900/5 to-transparent border-amber-500/30 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.05)]';
        case 'epic': return 'from-purple-500/10 via-purple-900/5 to-transparent border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(147,51,234,0.05)]';
        case 'rare': return 'from-blue-500/10 via-blue-900/5 to-transparent border-blue-500/30 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.05)]';
        default: return 'from-white/[0.02] to-transparent border-white/10 text-zinc-400';
    }
}

function traitIcon(rarity: string) {
    switch (rarity.toLowerCase()) {
        case 'legendary': return '👑';
        case 'epic': return '💎';
        case 'rare': return '✨';
        default: return '📜';
    }
}

function colorToGradient(pos: string) {
    switch (pos) {
        case 'QB': return 'from-red-500';
        case 'RB': return 'from-emerald-500';
        case 'WR': return 'from-blue-500';
        case 'TE': return 'from-amber-500';
        case 'K': return 'from-purple-500';
        case 'DST': return 'from-cyan-500';
        default: return 'from-zinc-500';
    }
}

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

    const currentPosColor = player ? (posColors[player.position] || "from-zinc-500/20 to-zinc-900/10 border-zinc-500/50 text-zinc-400") : "";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300"
            onClick={handleOutsideClick}
        >
            <div className="relative w-full max-w-3xl bg-[#030303] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh] selection:bg-purple-500/30">
                {/* Visual Flair Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${player ? colorToGradient(player.position) : 'from-zinc-900/20'} to-transparent opacity-20`} />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                </div>

                {/* Tactical Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Classified Dossier // Restricted</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="pointer-events-auto p-2 text-zinc-500 hover:text-white transition-all hover:rotate-90"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="relative z-10 flex flex-col items-center justify-center p-24 space-y-6">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-pulse" />
                        </div>
                        <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Retrieving Soul Signature...</div>
                    </div>
                ) : player && (
                    <div className="relative z-10 flex flex-col h-full overflow-hidden">
                        {/* HERO SECTION */}
                        <div className="p-8 md:p-12 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                                <div className="space-y-4 w-full md:w-auto">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest bg-black/40 backdrop-blur-sm ${currentPosColor.split(' ').slice(-3).join(' ')}`}>
                                            {player.position}
                                        </div>
                                        <div className="h-px w-8 bg-white/10" />
                                        <div className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                                            Unit • {player.teamAbbr || "MERC"}
                                        </div>
                                    </div>

                                    <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                                        {player.name.split(' ').map((n, i) => (
                                            <span key={i} className={i === 1 ? "block text-zinc-500 mt-[-0.1em]" : "block"}>
                                                {n}
                                            </span>
                                        ))}
                                    </h2>

                                    <div className="flex items-center gap-2 text-zinc-400 group cursor-default">
                                        <span className="text-xs">🛡️</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-purple-400 transition-colors">
                                            Commanded by <span className="text-white">{player.ownerName || "The Void (FA)"}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:min-w-[200px]">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center group/stat hover:border-purple-500/30 transition-all">
                                        <div className="text-2xl font-black text-white italic">{player.seasonTotal.toFixed(1)}</div>
                                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Total Prowess</div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center group/stat hover:border-blue-500/30 transition-all">
                                        <div className="text-2xl font-black text-white italic">{player.average.toFixed(1)}</div>
                                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Battle Avg</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SCROLLABLE BODY */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 pt-0 space-y-12">
                            {/* HEROIC TRAITS */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Heroic Traits</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
                                </div>
                                {player.traits && player.traits.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {player.traits.map((trait, idx) => (
                                            <div key={idx} className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] bg-gradient-to-br ${traitColorClass(trait.rarity)}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-[10px] font-black uppercase tracking-widest">{trait.name}</div>
                                                    <span className="text-xs opacity-50">{traitIcon(trait.rarity)}</span>
                                                </div>
                                                <div className="text-[11px] leading-relaxed opacity-70 font-medium">{trait.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                                        <div className="text-3xl opacity-20 mb-3">📜</div>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">No active traits manifested.</p>
                                    </div>
                                )}
                            </section>

                            {/* BATTLE CHRONICLE (PERFORMANCE) */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Chronicle of Feats</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                                </div>
                                {player.performances.length > 0 ? (
                                    <div className="space-y-2">
                                        {player.performances.map((perf) => (
                                            <div key={perf.weekNumber} className="group flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 text-center">
                                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Ritual</div>
                                                        <div className="text-sm font-black text-white italic">#{perf.weekNumber}</div>
                                                    </div>
                                                    <div className="h-8 w-px bg-white/5" />
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        {perf.details.passYds > 0 && <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">{perf.details.passYds} PYDS</span>}
                                                        {perf.details.rushYds > 0 && <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">{perf.details.rushYds} RYDS</span>}
                                                        {perf.details.recYds > 0 && <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">{perf.details.recYds} RECYDS</span>}
                                                        {perf.details.tds > 0 && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{perf.details.tds} FEATS</span>}
                                                        {perf.details.fumbles > 0 && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{perf.details.fumbles} SCARS</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-white italic group-hover:scale-110 transition-transform">{perf.points.toFixed(1)}</div>
                                                    <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Victory Pts</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 italic text-sm font-medium">This warrior has yet to draw blood this season.</div>
                                )}
                            </section>

                            {/* IMPENDING CONFLICT */}
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Impending Conflict</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                                </div>
                                {player.nextMatchup ? (
                                    <div className="relative group overflow-hidden p-6 bg-gradient-to-br from-amber-500/10 via-amber-900/5 to-transparent border border-amber-500/20 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div className="relative z-10 flex items-center gap-6">
                                            <div className="text-4xl text-amber-500 group-hover:rotate-12 transition-transform">⚔️</div>
                                            <div>
                                                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1 italic">Week {player.nextMatchup.week} Alignment</div>
                                                <div className="text-2xl font-black text-white uppercase tracking-tighter">vs {player.nextMatchup.opponent}</div>
                                            </div>
                                        </div>
                                        <div className="relative z-10 w-full sm:w-auto px-6 py-3 bg-black/40 border border-amber-500/30 backdrop-blur-md rounded-2xl text-center group-hover:border-amber-500 transition-all">
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">Fated Output</div>
                                            <div className="text-xl font-black text-white italic">{player.average.toFixed(1)} <span className="text-[10px] text-zinc-500 align-middle ml-1">EST</span></div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="p-8 bg-black/40 border border-white/5 rounded-3xl text-center">
                                        <div className="text-2xl opacity-20 mb-2">🔭</div>
                                        <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">No conflict predicted by the stars.</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* FOOTER BAR */}
                        <div className="p-4 bg-black/60 border-t border-white/5 backdrop-blur-md flex justify-center">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-purple-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Soul ID: {player.id.slice(0, 8)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Encryption Level: EPIC</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Status: BATTLE READY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
