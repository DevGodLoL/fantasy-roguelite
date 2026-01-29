"use client";

import { useState } from "react";
import { swapLineupSlots } from "./actions";
import { usePlayerModal } from "@/context/PlayerModalContext";

interface Player {
    id: string;
    name: string;
    teamAbbr: string | null;
    position: string;
}

interface RosterSlot {
    id: string;
    slotType: string;
    player: (Player & { points?: number }) | null;
}

interface LineupManagerProps {
    leagueId: string;
    weekNumber: number;
    starters: RosterSlot[];
    bench: RosterSlot[];
    isFinal: boolean;
    readOnly?: boolean;
    title?: string;
}

const POSITION_CONFIG: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    QB: { bg: "from-red-600/20 to-red-900/10", text: "text-red-400", border: "border-red-500/20", glow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]" },
    RB: { bg: "from-blue-600/20 to-blue-900/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]" },
    WR: { bg: "from-emerald-600/20 to-emerald-900/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]" },
    TE: { bg: "from-amber-600/20 to-amber-900/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-[0_0_15px_rgba(251,191,36,0.1)]" },
    K: { bg: "from-pink-600/20 to-pink-900/10", text: "text-pink-400", border: "border-pink-500/20", glow: "shadow-[0_0_15px_rgba(236,72,153,0.1)]" },
    DST: { bg: "from-cyan-600/20 to-cyan-900/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-[0_0_15px_rgba(34,211,238,0.1)]" },
    FLEX: { bg: "from-purple-600/20 to-purple-900/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]" },
    BENCH: { bg: "from-zinc-800/20 to-zinc-900/10", text: "text-zinc-500", border: "border-zinc-800/30", glow: "" },
};

export default function LineupManager({
    leagueId,
    weekNumber,
    starters,
    bench,
    isFinal,
    readOnly = false,
}: LineupManagerProps) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isSwapping, setIsSwapping] = useState(false);
    const { openPlayerModal } = usePlayerModal();

    const sortOrder: Record<string, number> = {
        QB: 1, RB: 2, WR: 3, TE: 4, FLEX: 5, DST: 6, K: 7,
    };

    const sortedStarters = [...starters].sort((a, b) => {
        return (sortOrder[a.slotType] || 99) - (sortOrder[b.slotType] || 99);
    });

    const checkFit = (player: Player | null, slotType: string) => {
        if (!player) return true;
        if (slotType === "BENCH") return true;
        if (slotType === "FLEX") return ["RB", "WR", "TE"].includes(player.position);
        return slotType === player.position;
    };

    const isSwapValid = (id1: string, id2: string) => {
        const s1 = [...starters, ...bench].find(s => s.id === id1);
        const s2 = [...starters, ...bench].find(s => s.id === id2);
        if (!s1 || !s2) return false;
        return checkFit(s1.player, s2.slotType) && checkFit(s2.player, s1.slotType);
    };

    const handleSlotClick = async (slotId: string) => {
        if (isFinal || isSwapping || readOnly) return;

        if (selectedSlotId === null) {
            setSelectedSlotId(slotId);
        } else if (selectedSlotId === slotId) {
            setSelectedSlotId(null);
        } else {
            if (!isSwapValid(selectedSlotId, slotId)) {
                setSelectedSlotId(null);
                return;
            }

            setIsSwapping(true);
            try {
                await swapLineupSlots(leagueId, weekNumber, selectedSlotId, slotId);
            } catch (err) {
                console.error("Failed to swap lineup:", err);
            } finally {
                setSelectedSlotId(null);
                setIsSwapping(false);
            }
        }
    };

    const renderSlot = (slot: RosterSlot, isBench = false) => {
        const isSelected = selectedSlotId === slot.id;
        const isValidTarget = selectedSlotId && selectedSlotId !== slot.id && isSwapValid(selectedSlotId, slot.id);
        const isInvalidTarget = selectedSlotId && selectedSlotId !== slot.id && !isValidTarget;

        const posType = isBench ? "BENCH" : slot.slotType;
        const playerPos = slot.player?.position || posType;
        const config = POSITION_CONFIG[playerPos] || POSITION_CONFIG.BENCH;

        return (
            <div
                key={slot.id}
                onClick={() => !isInvalidTarget && handleSlotClick(slot.id)}
                className={`
                    group relative flex items-center justify-between p-4 rounded-2xl border transition-all
                    ${isSelected
                        ? "bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] z-10 scale-[1.01]"
                        : isValidTarget
                            ? "bg-emerald-500/10 border-emerald-500/40 cursor-pointer animate-pulse"
                            : isInvalidTarget
                                ? "opacity-30 cursor-not-allowed"
                                : "bg-black/20 border-white/5 hover:border-white/10"
                    }
                    ${!isFinal && !readOnly && !isInvalidTarget ? "cursor-pointer" : ""}
                `}
            >
                <div className="flex items-center gap-4 min-w-0">
                    {/* Position Shield */}
                    <div className={`
                        w-11 h-11 rounded-xl flex items-center justify-center border font-black text-xs shrink-0
                        ${isSelected ? 'bg-purple-500 text-white border-purple-400' : `${config.text} ${config.border} bg-black/40`}
                    `}>
                        {isBench ? "BN" : slot.slotType}
                    </div>

                    <div className="min-w-0">
                        <div
                            className={`font-black text-sm truncate transition-colors ${isSelected ? "text-white" : slot.player ? "text-zinc-200 group-hover:text-purple-400" : "text-zinc-700 italic"
                                }`}
                            onClick={(e) => {
                                if (slot.player) {
                                    e.stopPropagation();
                                    openPlayerModal(slot.player.id, leagueId);
                                }
                            }}
                        >
                            {slot.player?.name || "Empty Formation Slot"}
                        </div>
                        {slot.player && (
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                                {slot.player.teamAbbr} · {slot.player.position}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {!isFinal && !readOnly && !isInvalidTarget && (
                        <div className={`
                            text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all
                            ${isSelected ? "text-purple-400" : isValidTarget ? "text-emerald-400" : "text-zinc-600 opacity-0 group-hover:opacity-100 hidden sm:block"}
                        `}>
                            {isSelected ? "[Cancel]" : isValidTarget ? "Deploy" : "Relocate"}
                        </div>
                    )}

                    {isFinal && (
                        <div className={`text-xl font-black ${(slot.player?.points || 0) > 15 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                            (slot.player?.points || 0) > 0 ? 'text-white' : 'text-zinc-700'
                            }`}>
                            {slot.player?.points?.toFixed(1) || "0.0"}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {sortedStarters.map((slot) => renderSlot(slot))}
            </div>

            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[.3em]">Reserve Legion</h3>
                    <span className="text-[10px] text-zinc-700 font-bold">{bench.length} Units</span>
                </div>
                <div className="space-y-2">
                    {bench.map((slot) => renderSlot(slot, true))}
                </div>
            </div>

            {isSwapping && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-3xl animate-pulse shadow-[0_0_30px_rgba(147,51,234,0.4)] mb-6">
                        ⚔️
                    </div>
                    <div className="text-white font-black uppercase tracking-[.4em] text-sm animate-pulse">Rearranging Formations...</div>
                </div>
            )}
        </div>
    );
}
