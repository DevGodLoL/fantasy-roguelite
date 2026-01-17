"use client";

import { useState } from "react";
import { selectPowerup } from "./actions";

interface PowerupOffer {
    id: string;
    powerup: {
        id: string;
        name: string;
        description: string;
        rarity: string;
        kind: string | null;
        value: number | null;
        scope: string;
    };
}

interface PackOpeningProps {
    leagueId: string;
    teamId: string;
    weekId: string;
    weekNumber: number;
    offers: PowerupOffer[];
}

const rarityColors: Record<string, string> = {
    common: "border-zinc-500 bg-zinc-900 text-zinc-300",
    rare: "border-blue-500 bg-blue-950/30 text-blue-300",
    epic: "border-purple-500 bg-purple-950/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    legendary: "border-amber-500 bg-amber-950/30 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)]",
};

export default function PackOpening({
    leagueId,
    teamId,
    weekId,
    weekNumber,
    offers
}: PackOpeningProps) {
    const [isPending, setIsPending] = useState(false);

    const handleSelect = async (powerupId: string) => {
        setIsPending(true);
        const formData = new FormData();
        formData.append("leagueId", leagueId);
        formData.append("teamId", teamId);
        formData.append("weekId", weekId);
        formData.append("powerupId", powerupId);
        formData.append("weekNumber", weekNumber.toString());

        await selectPowerup(formData);
        // Page triggers revalidation
    };

    if (offers.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="text-2xl">📦</span> Weekly Supply Drop
                <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded ml-2">Choose 1</span>
            </h2>

            {isPending && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-3xl">
                    <div className="animate-spin text-4xl">⚡</div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {offers.map((offer) => {
                    const p = offer.powerup;
                    const colorClass = rarityColors[p.rarity] || rarityColors.common;

                    return (
                        <div
                            key={offer.id}
                            onClick={() => !isPending && handleSelect(p.id)}
                            className={`relative group cursor-pointer border-2 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${colorClass}`}
                        >
                            {/* Rarity Tag */}
                            <div className="absolute top-2 right-2 text-[10px] font-black uppercase tracking-wider opacity-70">
                                {p.rarity}
                            </div>

                            {/* Icon / Art Placeholder */}
                            <div className="mb-3 mt-1">
                                <div className="text-3xl">
                                    {p.kind === "multiplier" ? "⚡" :
                                        p.kind === "bonus_points" ? "💎" :
                                            p.kind === "penalty" ? "💀" : "📜"}
                                </div>
                            </div>

                            {/* Name */}
                            <h3 className="font-bold leading-tight mb-2 text-sm md:text-base">
                                {p.name}
                            </h3>

                            {/* Description */}
                            <p className="text-xs opacity-80 leading-relaxed min-h-[40px]">
                                {p.description}
                            </p>

                            {/* Stats */}
                            <div className="mt-3 pt-3 border-t border-white/10 text-[10px] font-mono opacity-60 uppercase">
                                {p.scope === "self" ? "Buffs You" : "Debuffs Foe"}
                                {p.value ? ` · val: ${p.value}` : ""}
                            </div>

                            {/* Hover Selection Ring */}
                            <div className="absolute inset-0 border-2 border-white opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
