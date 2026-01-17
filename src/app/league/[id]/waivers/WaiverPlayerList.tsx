"use strict";
"use client";

import { useState, useMemo } from "react";
import ClaimModal from "./ClaimModal";

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
    adp: number;
}

interface Team {
    id: string;
    name: string;
    faabBalance: number;
    rosterSlots: any[]; // Using any to avoid complex recursive type import, but matches ClaimModal expectation
}

interface WaiverPlayerListProps {
    leagueId: string;
    userTeam: Team;
    players: Player[];
}

const posColors: Record<string, string> = {
    QB: "text-red-400 border-red-500/30",
    RB: "text-green-400 border-green-500/30",
    WR: "text-blue-400 border-blue-500/30",
    TE: "text-orange-400 border-orange-500/30",
    K: "text-purple-400 border-purple-500/30",
    DST: "text-yellow-400 border-yellow-500/30",
};

export default function WaiverPlayerList({ leagueId, userTeam, players }: WaiverPlayerListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [positionFilter, setPositionFilter] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // Limit displayed players to avoid lag
    const DISPLAY_LIMIT = 50;

    const filteredPlayers = useMemo(() => {
        return players
            .filter((player) => {
                const matchesSearch =
                    searchQuery === "" ||
                    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    player.teamAbbr?.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesPosition =
                    positionFilter === null || player.position === positionFilter;

                return matchesSearch && matchesPosition;
            })
            // Sort by ADP by default for best players first
            .sort((a, b) => a.adp - b.adp);
    }, [players, searchQuery, positionFilter]);

    const displayedPlayers = filteredPlayers.slice(0, DISPLAY_LIMIT);

    const positions = ["QB", "RB", "WR", "TE", "K", "DST"];

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 shrink-0">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Marketplace</h2>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter">Available Mercenaries</h3>
                </div>
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all w-full md:w-80"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPositionFilter(null)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${positionFilter === null
                                ? "bg-white text-black"
                                : "bg-white/5 text-zinc-500 hover:bg-white/10"
                                }`}
                        >
                            All
                        </button>
                        {positions.map((pos) => (
                            <button
                                key={pos}
                                onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${positionFilter === pos
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                                    }`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 overflow-y-auto custom-scrollbar pr-2">
                {displayedPlayers.map((player) => (
                    <div
                        key={player.id}
                        className="group p-5 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all hover:bg-zinc-900/80 flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${posColors[player.position]?.split(" ")[0] || "text-zinc-500"}`}>
                                    {player.position} · {player.teamAbbr}
                                </div>
                                <div className="text-lg font-black leading-tight">{player.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-mono text-zinc-600">ADP</div>
                                <div className="text-sm font-bold text-zinc-400">{Math.round(player.adp)}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPlayer(player)}
                            className="w-full py-2 bg-white/5 hover:bg-white text-white hover:text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all border border-white/5 hover:border-white"
                        >
                            Place Claim
                        </button>
                    </div>
                ))}

                {displayedPlayers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-600 italic">
                        No players found. Try adjusting your search.
                    </div>
                )}

                {filteredPlayers.length > DISPLAY_LIMIT && (
                    <div className="col-span-full py-4 text-center text-[10px] text-zinc-600 uppercase tracking-widest opacity-50">
                        Showing top {DISPLAY_LIMIT} of {filteredPlayers.length} matches
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedPlayer && (
                <ClaimModal
                    leagueId={leagueId}
                    team={userTeam}
                    playerToClaim={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
}
