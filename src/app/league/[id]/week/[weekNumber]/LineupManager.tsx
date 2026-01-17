"use client";

import { useState } from "react";
import { swapLineupSlots } from "./actions";

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

const posColors: Record<string, string> = {
    QB: "text-red-400 border-red-500/20",
    RB: "text-green-400 border-green-500/20",
    WR: "text-blue-400 border-blue-500/20",
    TE: "text-orange-400 border-orange-500/20",
    K: "text-purple-400 border-purple-500/20",
    DST: "text-yellow-400 border-yellow-500/20",
    FLEX: "text-cyan-400 border-cyan-500/20",
    BENCH: "text-zinc-500 border-zinc-500/10",
};

export default function LineupManager({
    leagueId,
    weekNumber,
    starters,
    bench,
    isFinal,
    readOnly = false,
    title = "Your Lineup",
}: LineupManagerProps) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isSwapping, setIsSwapping] = useState(false);

    // Standard Fantasy Sort Order
    const sortOrder: Record<string, number> = {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 4,
        FLEX: 5,
        DST: 6,
        K: 7,
    };

    const sortedStarters = [...starters].sort((a, b) => {
        return (sortOrder[a.slotType] || 99) - (sortOrder[b.slotType] || 99);
    });

    const handleSlotClick = async (slotId: string) => {
        if (isFinal || isSwapping || readOnly) return;

        if (selectedSlotId === null) {
            setSelectedSlotId(slotId);
        } else if (selectedSlotId === slotId) {
            setSelectedSlotId(null);
        } else {
            // Swap!
            setIsSwapping(true);
            try {
                await swapLineupSlots(leagueId, weekNumber, selectedSlotId, slotId);
            } catch (err) {
                console.error("Failed to swap lineup:", err);
                alert("Can't swap these slots. Make sure they are for the same team.");
            } finally {
                setSelectedSlotId(null);
                setIsSwapping(false);
            }
        }
    };

    const renderSlot = (slot: RosterSlot, isBench = false) => {
        const isSelected = selectedSlotId === slot.id;
        const colorClass = posColors[isBench ? "BENCH" : slot.slotType] || "text-zinc-500";
        const interactiveClasses = !isFinal && !readOnly
            ? "cursor-pointer group hover:border-white/20 active:scale-95"
            : "pointer-events-none opacity-90";

        return (
            <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                    ? "bg-white/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02] z-10"
                    : "bg-zinc-900/50 border-white/5"
                    } ${interactiveClasses}`}
            >
                <div className="flex items-center gap-3">
                    <span
                        className={`text-[10px] font-black w-10 uppercase transition-colors ${isSelected ? "text-blue-400" : colorClass.split(" ")[0]
                            }`}
                    >
                        {isBench ? "BN" : slot.slotType}
                    </span>
                    <div>
                        <div className={`font-bold text-sm transition-colors ${isSelected ? "text-white" : "text-zinc-200"}`}>
                            {slot.player?.name || <span className="text-zinc-600 italic">Empty Slot</span>}
                        </div>
                        {slot.player && (
                            <div className="text-xs text-zinc-500 uppercase font-mono tracking-tighter">
                                {slot.player.teamAbbr} · {slot.player.position}
                            </div>
                        )}
                    </div>
                </div>
                {!isFinal && !readOnly && (
                    <div className="text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 uppercase">
                        {isSelected ? "Cancel" : selectedSlotId ? "Swap Here" : "Move"}
                    </div>
                )}
                {isFinal && (
                    <div className="text-lg font-black text-white/40">
                        {slot.player?.points?.toFixed(1) || "0.0"}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-emerald-400 uppercase tracking-tight">{title}</h2>
                {!isFinal && (
                    <span className="text-[10px] text-zinc-500 uppercase font-bold animate-pulse">
                        {selectedSlotId ? "Select another slot to swap" : "Click a player to move them"}
                    </span>
                )}
            </div>

            {/* Starters */}
            <div className="space-y-2">
                {sortedStarters.map((slot) => renderSlot(slot))}
            </div>

            {/* Bench */}
            <div className="pt-4 border-t border-white/5">
                <h3 className="text-xs font-black text-zinc-500 uppercase mb-3 px-2">Bench</h3>
                <div className="space-y-1">
                    {bench.map((slot) => renderSlot(slot, true))}
                </div>
            </div>

            {isSwapping && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-white font-bold uppercase tracking-widest text-sm">UPDATING ROSTER...</div>
                    </div>
                </div>
            )}
        </div>
    );
}
