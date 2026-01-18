"use client";

import { useState } from "react";
import { usePlayerModal } from "@/context/PlayerModalContext";

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
    adp: number;
}

interface PlayerListProps {
    players: Player[];
    canDraft: boolean;
    onDraft: (playerId: string) => void;
    leagueId: string;
}

// Position color configurations
const POSITION_CONFIG: Record<string, { bg: string; bgActive: string; text: string; border: string }> = {
    QB: { bg: "bg-red-500/10", bgActive: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
    RB: { bg: "bg-blue-500/10", bgActive: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
    WR: { bg: "bg-emerald-500/10", bgActive: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    TE: { bg: "bg-amber-500/10", bgActive: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
    K: { bg: "bg-pink-500/10", bgActive: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
    DST: { bg: "bg-cyan-500/10", bgActive: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
};

type SortOption = "adp" | "name" | "position";

export default function PlayerList({ players, canDraft, onDraft, leagueId }: PlayerListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [positionFilter, setPositionFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("adp");
    const { openPlayerModal } = usePlayerModal();

    // Filter players based on search and position
    const filteredPlayers = players
        .filter((player) => {
            const matchesSearch =
                searchQuery === "" ||
                player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.teamAbbr?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPosition =
                positionFilter === null || player.position === positionFilter;

            return matchesSearch && matchesPosition;
        })
        .sort((a, b) => {
            if (sortBy === "adp") return a.adp - b.adp;
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "position") return a.position.localeCompare(b.position) || a.adp - b.adp;
            return 0;
        });

    const positions = ["QB", "RB", "WR", "TE", "K", "DST"];

    // Get top 3 best available for highlighting
    const topADPs = new Set(filteredPlayers.slice(0, 3).map(p => p.id));

    return (
        <aside className="w-[300px] border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-sm shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">🎯</span>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400">Available Souls</h2>
                        <div className="text-[10px] text-zinc-500">{filteredPlayers.length} warriors await</div>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search warriors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600">
                        🔍
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-white/5 space-y-3">
                {/* Position Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setPositionFilter(null)}
                        className={`
                            px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all
                            ${positionFilter === null
                                ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-300"
                            }
                        `}
                    >
                        All
                    </button>
                    {positions.map((pos) => {
                        const config = POSITION_CONFIG[pos];
                        return (
                            <button
                                key={pos}
                                onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border
                                    ${positionFilter === pos
                                        ? `${config.bgActive} ${config.text} ${config.border}`
                                        : `bg-zinc-800/30 text-zinc-500 border-transparent hover:bg-zinc-700/50 hover:text-zinc-300`
                                    }
                                `}
                            >
                                {pos}
                            </button>
                        );
                    })}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Sort:</span>
                    {[
                        { key: "adp", label: "Rank" },
                        { key: "name", label: "Name" },
                        { key: "position", label: "Pos" },
                    ].map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setSortBy(option.key as SortOption)}
                            className={`
                                px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
                                ${sortBy === option.key
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                                }
                            `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Best Available Indicator */}
            {sortBy === "adp" && filteredPlayers.length > 0 && (
                <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-400">👑</span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                            Best Available: {filteredPlayers[0]?.name}
                        </span>
                    </div>
                </div>
            )}

            {/* Player List */}
            <div className="flex-1 overflow-y-auto">
                {filteredPlayers.map((player, index) => {
                    const isTopPick = topADPs.has(player.id);
                    const posConfig = POSITION_CONFIG[player.position];

                    return (
                        <div
                            key={player.id}
                            className={`
                                group flex items-center justify-between px-4 py-3 transition-all border-b border-white/[0.03]
                                ${isTopPick
                                    ? "bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-l-amber-500"
                                    : "hover:bg-white/5 border-l-2 border-l-transparent"
                                }
                            `}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* ADP Rank Badge */}
                                <div className={`
                                    w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border
                                    ${player.adp <= 12
                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                        : player.adp <= 36
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                            : player.adp <= 72
                                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                : "bg-zinc-800/50 text-zinc-500 border-zinc-700/30"
                                    }
                                `}>
                                    {Math.round(player.adp)}
                                </div>

                                <div className="min-w-0">
                                    <div
                                        className="font-bold text-sm truncate cursor-pointer hover:text-purple-400 transition-colors"
                                        onClick={() => openPlayerModal(player.id, leagueId)}
                                    >
                                        {player.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`
                                            text-[9px] font-black px-1.5 py-0.5 rounded
                                            ${posConfig?.bg} ${posConfig?.text}
                                        `}>
                                            {player.position}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {player.teamAbbr}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {canDraft && (
                                <button
                                    onClick={() => onDraft(player.id)}
                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                >
                                    ⚔️ Draft
                                </button>
                            )}
                        </div>
                    );
                })}

                {filteredPlayers.length === 0 && (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-3 opacity-40">🔍</div>
                        <p className="text-zinc-600 text-sm">No warriors found matching &quot;{searchQuery}&quot;</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
