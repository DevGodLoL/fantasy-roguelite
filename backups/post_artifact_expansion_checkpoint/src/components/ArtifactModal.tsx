"use client";

import { useEffect, useRef } from "react";

interface Powerup {
    id: string;
    code: string;
    name: string;
    description: string;
    rarity: string;
    scope: string;
    kind: string | null;
    value: number | null;
}

interface ArtifactModalProps {
    powerup: Powerup;
    isOpen: boolean;
    onClose: () => void;
    usageHistory?: { weekNumber: number; opponentName?: string }[];
}

const RARITY_CONFIG: Record<string, {
    label: string;
    gradient: string;
    glowColor: string;
    textColor: string;
    particleColor: string;
}> = {
    legendary: {
        label: "LEGENDARY",
        gradient: "from-amber-400 via-yellow-300 to-amber-500",
        glowColor: "rgba(251,191,36,0.6)",
        textColor: "text-amber-300",
        particleColor: "#fbbf24",
    },
    epic: {
        label: "EPIC",
        gradient: "from-purple-400 via-fuchsia-400 to-purple-500",
        glowColor: "rgba(168,85,247,0.5)",
        textColor: "text-purple-300",
        particleColor: "#a855f7",
    },
    rare: {
        label: "RARE",
        gradient: "from-blue-400 via-cyan-400 to-blue-500",
        glowColor: "rgba(59,130,246,0.4)",
        textColor: "text-blue-300",
        particleColor: "#3b82f6",
    },
    common: {
        label: "COMMON",
        gradient: "from-zinc-400 via-slate-400 to-zinc-500",
        glowColor: "rgba(161,161,170,0.3)",
        textColor: "text-zinc-300",
        particleColor: "#a1a1aa",
    },
};

// Flavor text for artifacts (could be moved to DB later)
const FLAVOR_TEXT: Record<string, string> = {
    INFINITY_GAUNTLET: "Forged in the heart of a dying star, its power is absolute. But remember — all power comes with a price.",
    PHOENIX_REBIRTH: "From the ashes of defeat, legends are born. The flame never truly dies.",
    MJOLNIR: "Whosoever holds this hammer, if they be worthy, shall possess the power of Thor.",
    VOID_EMPEROR: "In the void between worlds, he waits. His touch drains the very essence of victory.",
    EXCALIBUR: "The blade that chose a king. Its edge cuts through fate itself.",
    GOLDEN_AGE: "An era of unprecedented prosperity. The coffers overflow, and champions rise.",
    CHRONOS_BLESSING: "Time bends to your will. Your greatest warrior fights with the strength of two.",
    DIVINE_INTERVENTION: "The gods themselves shield you from harm. No curse may touch the blessed.",
    CURSE_OF_THE_FUMBLE: "A hex woven from broken dreams and fumbled opportunities. Their loss becomes your gain.",
    DARK_RITUAL: "Blood magic demands payment in kind. Sacrifice to claim true power.",
    BERSERKER_RAGE: "Fury beyond reason. Strength beyond measure. Victory beyond doubt.",
    DRAGONS_BREATH: "The ancient wyrm awakens. Cities burn in its wake.",
    FROST_NOVA: "Winter's embrace is merciless. The cold claims all who stand in its path.",
    EXPERIENCE_RELIC: "Knowledge accumulated across ages, crystallized into pure power.",
    MIDAS_TOUCH: "Everything you touch turns to gold. Every point multiplied.",
};

export default function ArtifactModal({ powerup, isOpen, onClose, usageHistory = [] }: ArtifactModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const config = RARITY_CONFIG[powerup.rarity] || RARITY_CONFIG.common;
    const isCurse = powerup.scope === "opponent";
    const flavorText = FLAVOR_TEXT[powerup.code] || "A mysterious artifact of unknown origin...";

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === modalRef.current) onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
            {/* Card Container */}
            <div
                className="relative w-full max-w-md animate-in zoom-in-95 duration-300"
                style={{
                    boxShadow: `0 0 100px ${config.glowColor}, 0 0 200px ${config.glowColor}`,
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
                >
                    ✕
                </button>

                {/* Main Card */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full animate-pulse"
                                style={{
                                    backgroundColor: config.particleColor,
                                    opacity: 0.3 + Math.random() * 0.4,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Rarity Banner */}
                    <div className={`relative py-4 bg-gradient-to-r ${config.gradient}`}>
                        <div className="text-center">
                            <div className="text-xs font-black tracking-[0.5em] text-black/60 uppercase">
                                {isCurse ? "⚔️ CURSE" : "🛡️ BLESSING"}
                            </div>
                            <div className="text-lg font-black tracking-[0.3em] text-black uppercase mt-1">
                                {config.label}
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="relative p-8 space-y-6">
                        {/* Name */}
                        <h2 className={`text-3xl font-black uppercase tracking-tight text-center ${config.textColor}`}>
                            {powerup.name}
                        </h2>

                        {/* Divider */}
                        <div className={`h-px bg-gradient-to-r from-transparent via-white/30 to-transparent`} />

                        {/* Effect */}
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Effect</div>
                            <p className="text-lg text-white/90 leading-relaxed font-medium">
                                {powerup.description}
                            </p>
                        </div>

                        {/* Value Badge */}
                        {powerup.value && (
                            <div className="flex justify-center">
                                <div className={`
                                    px-6 py-3 rounded-2xl
                                    bg-gradient-to-r ${config.gradient}
                                    text-black font-black text-2xl
                                `}>
                                    {powerup.kind === "multiplier"
                                        ? `${powerup.value}x`
                                        : isCurse ? `-${powerup.value}` : `+${powerup.value}`}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`} />

                        {/* Flavor Text */}
                        <div className="space-y-2">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Lore</div>
                            <p className="text-sm text-zinc-400 italic leading-relaxed">
                                "{flavorText}"
                            </p>
                        </div>

                        {/* Usage History */}
                        {usageHistory.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Usage History</div>
                                <div className="space-y-1">
                                    {usageHistory.map((usage, i) => (
                                        <div key={i} className="text-xs text-zinc-500">
                                            Week {usage.weekNumber} {usage.opponentName && `vs ${usage.opponentName}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <div className="text-[10px] font-mono text-zinc-600 uppercase">
                                ID: {powerup.code}
                            </div>
                            <div className={`text-xs font-black uppercase ${isCurse ? 'text-red-400' : 'text-emerald-400'}`}>
                                {isCurse ? "Targets Opponent" : "Targets Self"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
