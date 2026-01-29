"use strict";
"use client";

import { useState } from "react";
import { submitWaiverClaim } from "./actions";

interface RosterSlot {
    id: string;
    player: {
        id: string;
        name: string;
        position: string;
        teamAbbr: string | null;
    } | null;
}

interface Team {
    id: string;
    name: string;
    faabBalance: number;
    rosterSlots: RosterSlot[];
}

interface Player {
    id: string;
    name: string;
    position: string;
    teamAbbr: string | null;
}

interface ClaimModalProps {
    leagueId: string;
    team: Team;
    playerToClaim: Player;
    onClose: () => void;
}

export default function ClaimModal({ leagueId, team, playerToClaim, onClose }: ClaimModalProps) {
    const [bid, setBid] = useState(0);
    const [dropId, setDropId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await submitWaiverClaim(leagueId, team.id, playerToClaim.id, Number(bid), dropId || undefined);
            onClose(); // Search/Page needs to refresh? revalidatePath in action handles DB, but client state might need refresh.
        } catch (err: any) {
            setError(err.message || "Failed to submit claim.");
            setIsSubmitting(false);
        }
    };

    const droppablePlayers = team.rosterSlots
        .filter(s => s.player) // Only occupied slots
        .map(s => s.player!);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-xl font-black uppercase italic mb-1">Claim Player</h2>
                <div className="text-blue-400 font-bold mb-6 text-lg">{playerToClaim.name} <span className="text-zinc-600 text-sm font-normal">{playerToClaim.position} · {playerToClaim.teamAbbr}</span></div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bid Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">FAAB Bid (Balance: ${team.faabBalance})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                            <input
                                type="number"
                                min={0}
                                max={team.faabBalance}
                                value={bid}
                                onChange={(e) => setBid(Number(e.target.value))}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Drop Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-zinc-500 tracking-wider">Drop Player (Optional)</label>
                        <select
                            value={dropId}
                            onChange={(e) => setDropId(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-red-500 transition-colors appearance-none"
                        >
                            <option value="">Don't drop anyone</option>
                            {droppablePlayers.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-zinc-600">If your roster is full, you MUST select a drop.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Claim"}
                    </button>
                </form>
            </div>
        </div>
    );
}
