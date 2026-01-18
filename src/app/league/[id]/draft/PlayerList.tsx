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

const posColors: Record<string, string> = {
    QB: "text-red-400 bg-red-500/10",
    RB: "text-green-400 bg-green-500/10",
    WR: "text-blue-400 bg-blue-500/10",
    TE: "text-orange-400 bg-orange-500/10",
    K: "text-purple-400 bg-purple-500/10",
    DST: "text-yellow-400 bg-yellow-500/10",
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
        <aside className="w-[280px] border-r border-white/5 flex flex-col bg-zinc-950/30 shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-white/5 space-y-2">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 transition-colors"
                />

                {/* Position Filter Pills */}
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => setPositionFilter(null)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${positionFilter === null
                            ? "bg-white/20 text-white"
                            : "bg-white/5 text-zinc-500 hover:bg-white/10"
                            }`}
                    >
                        All
                    </button>
                    {positions.map((pos) => (
                        <button
                            key={pos}
                            onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${positionFilter === pos
                                ? posColors[pos] || "bg-white/20 text-white"
                                : "bg-white/5 text-zinc-500 hover:bg-white/10"
                                }`}
                        >
                            {pos}
                        </button>
                    ))}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-zinc-500">Sort:</span>
                    <button
                        onClick={() => setSortBy("adp")}
                        className={`px-2 py-0.5 rounded transition-all ${sortBy === "adp" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        ADP
                    </button>
                    <button
                        onClick={() => setSortBy("name")}
                        className={`px-2 py-0.5 rounded transition-all ${sortBy === "name" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        Name
                    </button>
                    <button
                        onClick={() => setSortBy("position")}
                        className={`px-2 py-0.5 rounded transition-all ${sortBy === "position" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-white"
                            }`}
                    >
                        Pos
                    </button>
                </div>
            </div>

            {/* Results Count */}
            <div className="px-3 py-1.5 text-[9px] text-zinc-500 border-b border-white/5 flex justify-between items-center">
                <span>{filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} available</span>
                {sortBy === "adp" && filteredPlayers.length > 0 && (
                    <span className="text-emerald-400">Best: {filteredPlayers[0]?.name.split(' ').slice(-1)[0]}</span>
                )}
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredPlayers.map((player, index) => {
                    const isTopPick = topADPs.has(player.id);
                    return (
                        <div
                            key={player.id}
                            className={`group flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/[0.02] ${isTopPick ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" : ""
                                }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {/* ADP Rank Badge */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${player.adp <= 12 ? "bg-amber-500/20 text-amber-400" :
                                    player.adp <= 36 ? "bg-blue-500/20 text-blue-400" :
                                        player.adp <= 72 ? "bg-purple-500/20 text-purple-400" :
                                            "bg-zinc-800 text-zinc-500"
                                    }`}>
                                    {Math.round(player.adp)}
                                </div>
                                <div className="min-w-0">
                                    <div
                                        className="font-bold text-xs truncate cursor-pointer hover:underline hover:text-blue-400 decoration-blue-500/50"
                                        onClick={() => openPlayerModal(player.id, leagueId)}
                                    >
                                        {player.name}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 font-mono">
                                        <span className={posColors[player.position]?.split(" ")[0] || "text-zinc-400"}>
                                            {player.position}
                                        </span>{" "}
                                        · {player.teamAbbr}
                                    </div>
                                </div>
                            </div>
                            {canDraft && (
                                <button
                                    onClick={() => onDraft(player.id)}
                                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-bold uppercase rounded transition-all"
                                >
                                    Draft
                                </button>
                            )}
                        </div>
                    );
                })}

                {filteredPlayers.length === 0 && (
                    <div className="p-4 text-center text-zinc-600 text-xs">
                        No players found matching &quot;{searchQuery}&quot;
                    </div>
                )}
            </div>
        </aside>
    );
}

