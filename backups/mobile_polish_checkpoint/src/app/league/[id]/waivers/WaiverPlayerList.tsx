"use strict";
"use client";

import { useState, useMemo } from "react";
import ClaimModal from "./ClaimModal";
import { usePlayerModal } from "@/context/PlayerModalContext";

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
    rosterSlots: any[];
}

interface WaiverPlayerListProps {
    leagueId: string;
    userTeam: Team;
    players: Player[];
}

const POSITION_CONFIG: Record<string, { bg: string; text: string; border: string; bgSoft: string }> = {
    QB: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30", bgSoft: "bg-red-500/10" },
    RB: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30", bgSoft: "bg-blue-500/10" },
    WR: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bgSoft: "bg-emerald-500/10" },
    TE: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bgSoft: "bg-amber-500/10" },
    K: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/30", bgSoft: "bg-pink-500/10" },
    DST: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30", bgSoft: "bg-cyan-500/10" },
};

export default function WaiverPlayerList({ leagueId, userTeam, players }: WaiverPlayerListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [positionFilter, setPositionFilter] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const { openPlayerModal } = usePlayerModal();

    // Limit displayed players to avoid lag
    const DISPLAY_LIMIT = 48; // Multiple of 3 for the grid

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
        <div className="space-y-8 h-full flex flex-col relative">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TOOLBAR - RECRUITMENT SEARCH */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 shrink-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏮</span>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Recruitment Camp</h2>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Available Mercenaries</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                    {/* Position Filter Pills */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Filter by Class</div>
                        <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setPositionFilter(null)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${positionFilter === null
                                    ? "bg-white text-black shadow-lg"
                                    : "text-zinc-500 hover:text-white"
                                    }`}
                            >
                                All
                            </button>
                            {positions.map((pos) => {
                                const config = POSITION_CONFIG[pos];
                                return (
                                    <button
                                        key={pos}
                                        onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${positionFilter === pos
                                            ? `${config.bgSoft} ${config.text} ${config.border}`
                                            : "border-transparent text-zinc-500 hover:text-white"
                                            }`}
                                    >
                                        {pos}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Field */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Seek Warrior</div>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Whisper a name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900/80 border border-white/10 rounded-2xl px-6 py-3.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all w-full sm:w-64 placeholder:text-zinc-700"
                            />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-blue-500 transition-colors pointer-events-none">🔍</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* GRID - MERCENARY CARDS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 pb-24">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {displayedPlayers.map((player) => {
                        const config = POSITION_CONFIG[player.position] || POSITION_CONFIG.BENCH;
                        const isTopMercenary = player.adp <= 50;

                        return (
                            <div
                                key={player.id}
                                className={`
                                    group relative flex flex-col p-6 rounded-[2rem] border transition-all duration-500
                                    bg-black/20 backdrop-blur-sm border-white/5 
                                    hover:bg-zinc-900/40 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                                    ${isTopMercenary ? 'ring-1 ring-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.03)]' : ''}
                                `}
                            >
                                {/* ADP Rank Tag */}
                                <div className="absolute top-6 right-6 flex flex-col items-end">
                                    <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Renown</div>
                                    <div className={`text-sm font-black italic font-mono ${isTopMercenary ? 'text-amber-400' : 'text-zinc-600'}`}>
                                        #{Math.round(player.adp)}
                                    </div>
                                </div>

                                {/* Player Identity */}
                                <div className="space-y-4 mb-8">
                                    <div className={`
                                        w-12 h-12 rounded-[1rem] flex items-center justify-center border font-black text-xs
                                        ${config.text} ${config.border} bg-black/40
                                    `}>
                                        {player.position}
                                    </div>
                                    <div>
                                        <div
                                            className="text-xl font-black text-white group-hover:text-blue-400 transition-colors cursor-pointer leading-tight mb-1"
                                            onClick={() => openPlayerModal(player.id, leagueId)}
                                        >
                                            {player.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                            Unit: {player.teamAbbr || "Unknown"}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="mt-auto pt-6 border-t border-white/5">
                                    <button
                                        onClick={() => setSelectedPlayer(player)}
                                        className={`
                                            w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-[.15em] transition-all
                                            border border-white/10 text-zinc-400
                                            hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]
                                        `}
                                    >
                                        Seal Contract
                                    </button>
                                </div>

                                {/* Decorative Background Elements */}
                                {isTopMercenary && (
                                    <div className="absolute -bottom-1 -right-1 text-2xl opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                                        👑
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {displayedPlayers.length === 0 && (
                        <div className="col-span-full py-24 text-center space-y-4">
                            <div className="text-5xl opacity-20">🕯️</div>
                            <div className="text-zinc-600 text-sm font-black uppercase tracking-widest italic">
                                The Marketplace is quiet. Seek elsewhere.
                            </div>
                        </div>
                    )}
                </div>

                {filteredPlayers.length > DISPLAY_LIMIT && (
                    <div className="py-12 text-center">
                        <div className="inline-block px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                            Showing {DISPLAY_LIMIT} of {filteredPlayers.length} Souls
                        </div>
                    </div>
                )}
            </div>

            {/* Claim Contract Modal */}
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
