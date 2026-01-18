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
    const [viewState, setViewState] = useState<'chest' | 'opening' | 'selection'>('chest');

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

    const handleOpenPack = () => {
        setViewState('opening');
        setTimeout(() => {
            setViewState('selection');
        }, 1500); // 1.5s reveal duration
    };

    if (offers.length === 0) return null;

    // Deterministic particles for hydration safety
    const PARTICLES = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const dist = 150 + (i % 3) * 50;
        return {
            id: i,
            style: {
                '--tx': `${Math.cos(angle) * dist}px`,
                '--ty': `${Math.sin(angle) * dist}px`,
                backgroundColor: i % 2 === 0 ? '#fbbf24' : '#fcd34d' // Amber/Gold
            } as React.CSSProperties
        };
    });

    if (viewState === 'chest' || viewState === 'opening') {
        const isOpening = viewState === 'opening';
        return (
            <div className="relative min-h-[400px] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md border border-purple-500/20 rounded-[2.5rem] overflow-hidden group perspective-[1200px]">
                {/* Ambient Background Pulse */}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent animate-pulse" />

                <div className="text-center space-y-16 relative z-10 w-full max-w-md flex flex-col items-center">

                    {/* The Treasure Chest */}
                    <div
                        className={`relative w-48 h-36 cursor-pointer transition-transform duration-300 ${isOpening ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
                        onClick={!isOpening ? handleOpenPack : undefined}
                    >
                        {/* Glow Behind */}
                        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-600 blur-[80px] rounded-full transition-all duration-300 ${isOpening ? 'opacity-80 scale-150' : 'opacity-20 animate-pulse'}`} />

                        {/* Chest Base */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-[#8B4513] to-[#4A2511] rounded-b-2xl border-4 border-[#DAA520] shadow-2xl z-20 flex items-center justify-center overflow-hidden">
                            {/* Wood Grain / Texture */}
                            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,black,transparent_5px)]" />
                            {/* Keyhole */}
                            <div className="w-8 h-8 rounded-full bg-[#DAA520] flex items-center justify-center shadow-lg transform translate-y-2">
                                <div className="w-2 h-3 bg-black rounded-full" />
                            </div>
                        </div>

                        {/* Chest Lid */}
                        <div className={`
                            absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#A0522D] to-[#8B4513] rounded-t-2xl border-4 border-[#DAA520] z-30 origin-bottom transition-all
                            ${isOpening ? 'animate-lid-open' : 'animate-float'}
                        `}>
                            {/* Lid Detail */}
                            <div className="absolute inset-x-4 top-2 h-10 border-2 border-[#DAA520]/50 rounded-t-lg" />
                        </div>

                        {/* Interact Hint */}
                        {!isOpening && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                <span className="text-2xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">✨</span>
                            </div>
                        )}

                        {/* TREASURE GLOW (Inside) */}
                        <div className={`
                            absolute inset-x-2 bottom-2 h-20 bg-yellow-300 blur-xl rounded-full z-10 transition-opacity duration-300
                            ${isOpening ? 'opacity-100 scale-150 animate-pulse' : 'opacity-0'}
                        `} />

                        {/* PARTICLES (Fireworks) */}
                        {isOpening && (
                            <div className="absolute left-1/2 top-1/2 w-0 h-0 z-40">
                                {PARTICLES.map((p) => (
                                    <div
                                        key={p.id}
                                        className="absolute w-2 h-2 rounded-full animate-firework shadow-[0_0_10px_currentColor]"
                                        style={p.style}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h2 className={`text-3xl font-black text-white uppercase tracking-tighter ${isOpening ? 'text-amber-300 animate-pulse' : ''}`}>
                            {isOpening ? 'Unlocking Riches...' : 'Ancient Chest'}
                        </h2>

                        {!isOpening && (
                            <button
                                onClick={handleOpenPack}
                                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-black uppercase tracking-widest rounded-xl hover:from-amber-500 hover:to-amber-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                            >
                                Open Chest
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // STATE: SELECTION
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
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2 animate-[fadeIn_0.8s_ease-out]">SELECT ARTIFACT</h2>
                    <p className="text-zinc-500 text-sm max-w-lg mx-auto uppercase tracking-widest font-bold animate-[fadeIn_1s_ease-out]">Choose one artifact to empower your legion for this chapter</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {offers.map((offer, index) => {
                        const p = offer.powerup;
                        const config = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;
                        // Staggered delay for card reveal
                        const delay = `${index * 100 + 300}ms`; // +300ms for flash to settle

                        return (
                            <div
                                key={offer.id}
                                onClick={() => !isPending && handleSelect(p.id)}
                                style={{ animationDelay: delay }}
                                className={`
                                    relative group cursor-pointer rounded-2xl p-6 border transition-all duration-500 hover:scale-105 active:scale-95
                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                    ${isPending ? 'opacity-50 pointer-events-none' : ''}
                                    animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_both]
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
