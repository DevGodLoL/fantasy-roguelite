"use client";

import { useState } from "react";

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
}

interface PlayerListProps {
    players: Player[];
    canDraft: boolean;
    onDraft: (playerId: string) => void;
}

const posColors: Record<string, string> = {
    QB: "text-red-400 bg-red-500/10",
    RB: "text-green-400 bg-green-500/10",
    WR: "text-blue-400 bg-blue-500/10",
    TE: "text-orange-400 bg-orange-500/10",
    K: "text-purple-400 bg-purple-500/10",
    DST: "text-yellow-400 bg-yellow-500/10",
};

export default function PlayerList({ players, canDraft, onDraft }: PlayerListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [positionFilter, setPositionFilter] = useState<string | null>(null);

    // Filter players based on search and position
    const filteredPlayers = players.filter((player) => {
        const matchesSearch =
            searchQuery === "" ||
            player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.teamAbbr?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPosition =
            positionFilter === null || player.position === positionFilter;

        return matchesSearch && matchesPosition;
    });

    const positions = ["QB", "RB", "WR", "TE", "K", "DST"];

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
            </div>

            {/* Results Count */}
            <div className="px-3 py-1.5 text-[9px] text-zinc-500 border-b border-white/5">
                {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} available
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredPlayers.map((player) => (
                    <div
                        key={player.id}
                        className="group flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/[0.02]"
                    >
                        <div className="min-w-0">
                            <div className="font-bold text-xs truncate">{player.name}</div>
                            <div className="text-[9px] text-zinc-500 font-mono">
                                <span className={posColors[player.position]?.split(" ")[0] || "text-zinc-400"}>
                                    {player.position}
                                </span>{" "}
                                · {player.teamAbbr}
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
                ))}

                {filteredPlayers.length === 0 && (
                    <div className="p-4 text-center text-zinc-600 text-xs">
                        No players found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </aside>
    );
}
