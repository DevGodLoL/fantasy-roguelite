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

        // Check 1 -> 2
        if (!checkFit(s1.player, s2.slotType)) return false;
        // Check 2 -> 1
        if (!checkFit(s2.player, s1.slotType)) return false;

        return true;
    };

    const handleSlotClick = async (clickedSlotId: string) => {
        if (readOnly || isPending) return;

        if (selectedSlotId === null) {
            // Select first slot
            const slot = slots.find(s => s.id === clickedSlotId);
            if (slot?.player) {
                setSelectedSlotId(clickedSlotId);
            }
            return;
        }

        if (selectedSlotId === clickedSlotId) {
            // Deselect
            setSelectedSlotId(null);
            return;
        }

        // Attempt swap
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
            // Invalid move, just switch selection if clicked another player, or deselect
            const slot = slots.find(s => s.id === clickedSlotId);
            if (slot?.player) {
                setSelectedSlotId(clickedSlotId);
            } else {
                setSelectedSlotId(null);
            }
        }
    };

    return (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800/50 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                        <th className="px-6 py-4">Slot</th>
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                    {slots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const isValidTarget = selectedSlotId && selectedSlotId !== slot.id && isSwapValid(selectedSlotId, slot.id);

                        return (
                            <tr
                                key={slot.id}
                                onClick={() => handleSlotClick(slot.id)}
                                className={`
                                    transition-all cursor-pointer border-l-4
                                    ${isSelected ? 'bg-purple-500/20 border-l-purple-500' : 'border-l-transparent'}
                                    ${isValidTarget ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-l-emerald-500/50' : ''}
                                    ${!isSelected && !isValidTarget ? 'hover:bg-white/[0.02]' : ''}
                                `}
                            >
                                <td className="px-6 py-5">
                                    <span className={`text-xs font-black px-2 py-1 rounded ${slot.isStarter ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {slot.slotType === "BENCH" ? "BN" : slot.slotType}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    {slot.player ? (
                                        <div className="flex flex-col">
                                            <span
                                                className={`font-bold hover:underline cursor-pointer z-20 relative ${isSelected ? 'text-purple-300' : 'text-zinc-100'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPlayerModal(slot.player!.id);
                                                }}
                                            >
                                                {slot.player.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-mono uppercase">
                                                {slot.player.position} — {slot.player.teamAbbr}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={`text-sm italic ${isValidTarget ? 'text-emerald-400 font-bold' : 'text-zinc-700'}`}>
                                            {isValidTarget ? 'Move Here' : 'Empty Slot'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    {isSelected ? (
                                        <span className="text-xs font-black text-purple-400 uppercase tracking-wider animate-pulse">
                                            Selected
                                        </span>
                                    ) : isValidTarget ? (
                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                                            Swap
                                        </span>
                                    ) : (
                                        slot.player && !readOnly && !selectedSlotId && (
                                            <button
                                                // Stop propagation to prevent selection when clicking release?
                                                // Actually release is a separate action.
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Release ${slot.player?.name}?`)) {
                                                        await dropPlayer(leagueId, teamId, slot.id);
                                                    }
                                                }}
                                                className="text-xs font-bold text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-tighter"
                                            >
                                                Release
                                            </button>
                                        )
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {selectedSlotId && (
                <div className="bg-purple-500/10 text-purple-300 text-xs text-center py-2 font-bold animate-pulse">
                    Select a destination slot to swap players
                </div>
            )}
        </div>
    );
}
