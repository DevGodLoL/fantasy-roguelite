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

const RARITY_CONFIG: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
    common: { bg: "from-zinc-900 to-zinc-800", text: "text-zinc-400", border: "border-zinc-700/50", glow: "", icon: "📜" },
    rare: { bg: "from-blue-900/40 to-blue-800/20", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", icon: "⚔️" },
    epic: { bg: "from-purple-900/40 to-purple-800/20", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-[0_0_30px_rgba(168,85,247,0.25)]", icon: "💎" },
    legendary: { bg: "from-amber-900/40 to-amber-800/20", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-[0_0_40px_rgba(245,158,11,0.35)]", icon: "👑" },
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

        try {
            await selectPowerup(formData);
        } catch (error) {
            console.error(error);
            setIsPending(false);
        }
    };

    if (offers.length === 0) return null;

    return (
        <div className="relative p-8 lg:p-12 bg-black/60 backdrop-blur-md border border-purple-500/20 rounded-[2.5rem] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />

            <div className="relative z-10 text-center space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gradient-to-l from-purple-500/50 to-transparent" />
                        <span className="text-sm font-black text-purple-400 uppercase tracking-[.4em]">Ancient Spoils Found</span>
                        <div className="h-px w-12 bg-gradient-to-r from-purple-500/50 to-transparent" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">WEEKLY SUPPLY DROP</h2>
                    <p className="text-zinc-500 text-sm max-w-lg mx-auto uppercase tracking-widest font-bold">Choose one artifact to empower your legion for this chapter</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {offers.map((offer) => {
                        const p = offer.powerup;
                        const config = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;

                        return (
                            <div
                                key={offer.id}
                                onClick={() => !isPending && handleSelect(p.id)}
                                className={`
                                    relative group cursor-pointer rounded-2xl p-6 border transition-all duration-500 hover:scale-105 active:scale-95
                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                    ${isPending ? 'opacity-50 pointer-events-none' : ''}
                                `}
                            >
                                {/* Selection Ring (Glow) */}
                                <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/20 to-transparent -z-10 blur-sm`} />

                                <div className="flex flex-col h-full gap-4 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className={`text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>
                                            {config.icon}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${config.text} ${config.border}`}>
                                            {p.rarity}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                                            {p.name}
                                        </h3>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${p.scope === 'self' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {p.scope === 'self' ? '✨ Ally Buff' : '💀 Foe Debuff'}
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                                        {p.description}
                                    </p>

                                    <div className="pt-4 border-t border-white/10 mt-auto">
                                        <button className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.rarity === 'legendary' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' :
                                                'bg-white/10 text-white group-hover:bg-white/20'
                                            }`}>
                                            Claim Artifact
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-4xl animate-pulse shadow-[0_0_40px_rgba(147,51,234,0.5)] mb-6">
                        ✨
                    </div>
                    <div className="text-white font-black uppercase tracking-[.4em] text-sm animate-pulse">Forging Your Path...</div>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase">The fates are shifting</p>
                </div>
            )}
        </div>
    );
}
