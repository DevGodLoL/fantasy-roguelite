"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimPack } from "./actions";
import { toast } from "sonner";

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
    offers,
}: PackOpeningProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [viewState, setViewState] = useState<'chest' | 'opening' | 'revealed' | 'claimed'>('chest');

    const handleOpenPack = () => {
        setViewState('opening');
        setTimeout(() => {
            setViewState('revealed');
        }, 1500);
    };

    const handleClaimAll = async () => {
        setIsPending(true);
        try {
            await claimPack(leagueId, teamId, weekId, weekNumber);
            toast.success("All artifacts claimed! Choose one to equip.");
            setViewState('claimed');
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to claim artifacts.");
            setIsPending(false);
        }
    };

    // After claim, show a loading state until the parent component unmounts this and shows VaultEquip
    if (viewState === 'claimed') {
        return (
            <div className="relative min-h-[320px] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-3xl animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                        🛡️
                    </div>
                    <div className="text-white font-black uppercase tracking-[.3em] text-sm animate-pulse">Stashing in Vault...</div>
                    <p className="text-zinc-500 text-xs font-bold uppercase">Preparing artifact selection</p>
                </div>
            </div>
        );
    }

    if (viewState === 'chest') {
        return (
            <div className="relative min-h-[320px] flex items-center justify-center p-8 pt-14 bg-black/60 backdrop-blur-md border border-purple-500/20 rounded-2xl overflow-hidden group perspective-[1200px]">
                {/* Ambient Background Pulse */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent animate-pulse" />

                <div className="text-center space-y-6 relative z-10 w-full max-w-md flex flex-col items-center">
                    {/* The Treasure Chest */}
                    <div
                        className="relative w-36 h-28 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 animate-float"
                        onClick={handleOpenPack}
                    >
                        {/* Glow Behind */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-600 blur-[60px] rounded-full opacity-20 animate-pulse" />

                        <div className="relative w-full h-full">
                            {/* Chest Base */}
                            <div className="absolute inset-x-0 bottom-0 h-[72px] bg-gradient-to-b from-[#8B4513] to-[#4A2511] rounded-b-xl border-3 border-[#DAA520] shadow-2xl z-20 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,black,transparent_5px)]" />
                                <div className="w-6 h-6 rounded-full bg-[#DAA520] flex items-center justify-center shadow-lg transform translate-y-1">
                                    <div className="w-1.5 h-2 bg-black rounded-full" />
                                </div>
                            </div>

                            {/* Chest Lid */}
                            <div className="absolute inset-x-0 top-0 h-[48px] bg-gradient-to-b from-[#A0522D] to-[#8B4513] rounded-t-xl border-3 border-[#DAA520] z-30 origin-bottom">
                                <div className="absolute inset-x-3 top-1.5 h-8 border-2 border-[#DAA520]/50 rounded-t-lg" />
                            </div>

                            {/* Interact Hint */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce">
                                <span className="text-lg filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">✨</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Ancient Chest</h2>
                        <button
                            onClick={handleOpenPack}
                            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-black uppercase tracking-widest rounded-lg hover:from-amber-500 hover:to-amber-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                            Open Chest
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // STATE: REVEALED — show all 4 cards + "Claim All" button
    return (
        <div className="relative p-8 lg:p-12 bg-black/60 backdrop-blur-md border border-purple-500/20 rounded-[2.5rem] overflow-hidden animate-[fadeIn_0.5s_ease-out]">
            {/* White Flash Overlay on Enter */}
            <div className="absolute inset-0 bg-white pointer-events-none z-50 animate-flash" />

            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />

            <div className="relative z-10 text-center space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-gradient-to-l from-purple-500/50 to-transparent" />
                        <span className="text-sm font-black text-purple-400 uppercase tracking-[.4em] animate-[slideInUp_0.5s_ease-out]">Cache Decrypted</span>
                        <div className="h-px w-12 bg-gradient-to-r from-purple-500/50 to-transparent" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 animate-[fadeIn_0.8s_ease-out]">ARTIFACTS REVEALED</h2>
                    <p className="text-zinc-500 text-sm max-w-lg mx-auto uppercase tracking-widest font-bold animate-[fadeIn_1s_ease-out]">
                        All artifacts will be added to your Vault. Equip one before battle.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {offers.map((offer, index) => {
                        const p = offer.powerup;
                        const config = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;
                        const delay = `${index * 100 + 300}ms`;

                        return (
                            <div
                                key={offer.id}
                                style={{ animationDelay: delay }}
                                className={`
                                    relative group rounded-2xl p-6 border transition-all duration-500
                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                    animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_both]
                                `}
                            >
                                <div className="flex flex-col h-full gap-4 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                            {config.icon}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${config.text} ${config.border}`}>
                                            {p.rarity}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg text-white uppercase tracking-tight">
                                            {p.name}
                                        </h3>
                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${p.scope === 'self' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {p.scope === 'self' ? '✨ Ally Buff' : '💀 Foe Debuff'}
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                                        {p.description}
                                    </p>

                                    <div className="pt-3 border-t border-white/10 mt-auto">
                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">
                                            → Vault
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Claim All Button */}
                <button
                    onClick={handleClaimAll}
                    disabled={isPending}
                    className={`
                        px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all
                        ${isPending
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                        }
                    `}
                >
                    {isPending ? (
                        <span className="flex items-center gap-3">
                            <span className="animate-spin">✨</span> Adding to Vault...
                        </span>
                    ) : (
                        <span className="flex items-center gap-3">
                            🛡️ Claim All to Vault
                        </span>
                    )}
                </button>
            </div>

            {isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-4xl animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.5)] mb-6">
                        🛡️
                    </div>
                    <div className="text-white font-black uppercase tracking-[.4em] text-sm animate-pulse">Stashing Artifacts...</div>
                    <p className="mt-2 text-zinc-500 text-xs font-bold uppercase">Your vault grows stronger</p>
                </div>
            )}
        </div>
    );
}
