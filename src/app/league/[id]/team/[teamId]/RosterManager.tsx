"use client";

import { useState } from "react";
import { swapRosterSlots, dropPlayer } from "../actions";
import { usePlayerModal } from "@/context/PlayerModalContext";

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
}

interface RosterSlot {
    id: string;
    slotType: string;
    isStarter: boolean;
    player: Player | null;
}

interface RosterManagerProps {
    leagueId: string;
    teamId: string;
    slots: RosterSlot[];
    readOnly?: boolean;
}

// Position color configurations
const POSITION_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    QB: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
    RB: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
    WR: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    TE: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
    FLEX: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
    DST: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
    K: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
    BENCH: { bg: "bg-zinc-700/30", text: "text-zinc-500", border: "border-zinc-700/30" },
};

export default function RosterManager({ leagueId, teamId, slots, readOnly = false }: RosterManagerProps) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const { openPlayerModal } = usePlayerModal();

    const checkFit = (player: Player | null, slotType: string) => {
        if (!player) return true;
        if (slotType === "BENCH") return true;
        if (slotType === "FLEX") return ["RB", "WR", "TE"].includes(player.position);
        return slotType === player.position;
    };

    const isSwapValid = (id1: string, id2: string) => {
        const s1 = slots.find(s => s.id === id1);
        const s2 = slots.find(s => s.id === id2);
        if (!s1 || !s2) return false;
        if (!checkFit(s1.player, s2.slotType)) return false;
        if (!checkFit(s2.player, s1.slotType)) return false;
        return true;
    };

    const handleSlotClick = async (clickedSlotId: string) => {
        if (readOnly || isPending) return;

        if (selectedSlotId === null) {
            const slot = slots.find(s => s.id === clickedSlotId);
            if (slot?.player) {
                setSelectedSlotId(clickedSlotId);
            }
            return;
        }

        if (selectedSlotId === clickedSlotId) {
            setSelectedSlotId(null);
            return;
        }

        if (isSwapValid(selectedSlotId, clickedSlotId)) {
            setIsPending(true);
            try {
                await swapRosterSlots(leagueId, teamId, selectedSlotId, clickedSlotId);
            } catch (e) {
                console.error(e);
                alert("Failed to swap players.");
            } finally {
                setIsPending(false);
                setSelectedSlotId(null);
            }
        } else {
            const slot = slots.find(s => s.id === clickedSlotId);
            if (slot?.player) {
                setSelectedSlotId(clickedSlotId);
            } else {
                setSelectedSlotId(null);
            }
        }
    };

    // Separate starters and bench
    const starters = slots.filter(s => s.isStarter);
    const bench = slots.filter(s => !s.isStarter);

    const renderSlot = (slot: RosterSlot) => {
        const isSelected = selectedSlotId === slot.id;
        const isValidTarget = selectedSlotId && selectedSlotId !== slot.id && isSwapValid(selectedSlotId, slot.id);
        const posConfig = POSITION_CONFIG[slot.slotType] || POSITION_CONFIG.BENCH;
        const playerPosConfig = slot.player ? (POSITION_CONFIG[slot.player.position] || POSITION_CONFIG.BENCH) : posConfig;

        return (
            <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`
                    relative p-4 rounded-2xl border transition-all cursor-pointer group
                    ${isSelected
                        ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                        : isValidTarget
                            ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20'
                            : slot.player
                                ? 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700/70 hover:bg-zinc-900/60'
                                : 'bg-zinc-900/20 border-zinc-800/30 border-dashed'
                    }
                `}
            >
                {/* Selected indicator */}
                {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-black animate-pulse shadow-[0_0_10px_rgba(147,51,234,0.5)]">
                        ✓
                    </div>
                )}

                {/* Valid target indicator */}
                {isValidTarget && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        ↓
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {/* Position Badge */}
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black border
                        ${slot.player ? `${playerPosConfig.bg} ${playerPosConfig.text} ${playerPosConfig.border}` : `${posConfig.bg} ${posConfig.text} ${posConfig.border}`}
                    `}>
                        {slot.slotType === "BENCH" ? "BN" : slot.slotType}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                        {slot.player ? (
                            <>
                                <div
                                    className={`
                                        font-bold text-base truncate cursor-pointer hover:underline
                                        ${isSelected ? 'text-purple-300' : 'text-white group-hover:text-purple-400'}
                                        transition-colors
                                    `}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openPlayerModal(slot.player!.id, leagueId);
                                    }}
                                >
                                    {slot.player.name}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] font-black ${playerPosConfig.text}`}>
                                        {slot.player.position}
                                    </span>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                        {slot.player.teamAbbr || 'FA'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <span className={`text-sm italic ${isValidTarget ? 'text-emerald-400 font-bold' : 'text-zinc-600'}`}>
                                {isValidTarget ? '⚔️ Move Here' : 'Empty Slot'}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                        {isSelected ? (
                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider rounded-lg animate-pulse">
                                Selected
                            </span>
                        ) : isValidTarget ? (
                            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                Swap
                            </span>
                        ) : (
                            slot.player && !readOnly && !selectedSlotId && (
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`Release ${slot.player?.name} back to the mercenary camp?`)) {
                                            await dropPlayer(leagueId, teamId, slot.id);
                                        }
                                    }}
                                    className="px-3 py-1.5 text-[10px] font-bold text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all uppercase tracking-tighter border border-transparent hover:border-red-500/30"
                                >
                                    Release
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Starters Grid */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-purple-500/10 bg-purple-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                                Active Starters
                            </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold bg-zinc-800/50 px-2 py-1 rounded-lg">
                            {starters.filter(s => s.player).length}/{starters.length} Deployed
                        </span>
                    </div>
                </div>
                <div className="p-4 grid gap-3">
                    {starters.map(renderSlot)}
                </div>
            </div>

            {/* Bench Grid */}
            <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-800/20">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🛡️</span>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                            Reserve Bench
                        </span>
                        <span className="text-[10px] text-zinc-600 font-bold">
                            {bench.filter(s => s.player).length}/{bench.length} Reserves
                        </span>
                    </div>
                </div>
                <div className="p-4 grid gap-3">
                    {bench.map(renderSlot)}
                </div>
            </div>

            {/* Selection Instructions */}
            {selectedSlotId && (
                <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm text-center py-4 rounded-2xl font-bold animate-pulse shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                    ⚔️ Select a destination slot to swap warriors ⚔️
                </div>
            )}
        </div>
    );
}
