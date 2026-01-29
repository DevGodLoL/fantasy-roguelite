"use client";

import { useState } from "react";
import TiltCard from "./TiltCard";
import ArtifactModal from "./ArtifactModal";

export interface Powerup {
    id: string;
    code: string;
    name: string;
    description: string;
    rarity: string;
    scope: string;
    duration: string;
    kind: string | null;
    value: number | null;
}

const RARITY_CONFIG: Record<string, {
    label: string;
    gradient: string;
    border: string;
    glow: string;
    textColor: string;
    bgCard: string;
    icon: string;
}> = {
    legendary: {
        label: "LEGENDARY",
        gradient: "from-amber-400 via-yellow-300 to-amber-500",
        border: "border-amber-400/60",
        glow: "shadow-[0_0_40px_rgba(251,191,36,0.5)]",
        textColor: "text-amber-300",
        bgCard: "bg-gradient-to-br from-amber-900/40 via-yellow-900/30 to-amber-950/50",
        icon: "👑",
    },
    epic: {
        label: "EPIC",
        gradient: "from-purple-400 via-fuchsia-400 to-purple-500",
        border: "border-purple-400/50",
        glow: "shadow-[0_0_30px_rgba(168,85,247,0.4)]",
        textColor: "text-purple-300",
        bgCard: "bg-gradient-to-br from-purple-900/40 via-fuchsia-900/30 to-purple-950/50",
        icon: "💎",
    },
    rare: {
        label: "RARE",
        gradient: "from-blue-400 via-cyan-400 to-blue-500",
        border: "border-blue-400/40",
        glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        textColor: "text-blue-300",
        bgCard: "bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-blue-950/50",
        icon: "✨",
    },
    common: {
        label: "COMMON",
        gradient: "from-zinc-400 via-slate-400 to-zinc-500",
        border: "border-zinc-500/30",
        glow: "",
        textColor: "text-zinc-400",
        bgCard: "bg-gradient-to-br from-zinc-800/40 via-slate-800/30 to-zinc-900/50",
        icon: "⚙️",
    },
};

export function InteractiveCard({
    powerup,
    isDiscovered,
    count = 0,
    isCurse = false,
}: {
    powerup: Powerup;
    isDiscovered: boolean;
    count?: number;
    isCurse?: boolean;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const config = RARITY_CONFIG[powerup.rarity] || RARITY_CONFIG.common;

    // Face-down card for undiscovered (no interactivity)
    if (!isDiscovered) {
        return (
            <div className="group relative">
                <div
                    className={`
                        relative aspect-[3/4] rounded-2xl overflow-hidden
                        bg-gradient-to-br from-zinc-800 via-zinc-900 to-black
                        border-2 ${isCurse ? 'border-red-900/30' : 'border-zinc-700/50'}
                        flex items-center justify-center
                        transition-all duration-300
                        hover:scale-105 hover:border-zinc-600
                        cursor-not-allowed
                    `}
                >
                    {/* Card back pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 10px,
                                    rgba(255,255,255,0.02) 10px,
                                    rgba(255,255,255,0.02) 20px
                                )`,
                            }}
                        />
                    </div>

                    {/* Question mark */}
                    <div className="relative z-10 text-center">
                        <div className="text-6xl mb-3 opacity-30">❓</div>
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600">
                            Undiscovered
                        </div>
                    </div>

                    {/* Rarity hint glow */}
                    <div
                        className={`absolute inset-0 opacity-10 blur-xl ${powerup.rarity === "legendary"
                            ? "bg-amber-500"
                            : powerup.rarity === "epic"
                                ? "bg-purple-500"
                                : powerup.rarity === "rare"
                                    ? "bg-blue-500"
                                    : "bg-zinc-500"
                            }`}
                    />
                </div>
            </div>
        );
    }

    // Face-up discovered card with tilt effect and click handler
    return (
        <>
            <TiltCard
                className="cursor-pointer"
                glareEnabled={powerup.rarity === "legendary" || powerup.rarity === "epic"}
                tiltAmount={powerup.rarity === "legendary" ? 20 : 15}
                onClick={() => setIsModalOpen(true)}
            >
                <div
                    className={`
                        relative aspect-[3/4] rounded-2xl overflow-hidden
                        ${config.bgCard}
                        border-2 ${config.border}
                        ${config.glow}
                        transition-shadow duration-300
                    `}
                >
                    {/* Top rarity banner */}
                    <div
                        className={`
                            absolute top-0 left-0 right-0 h-8
                            bg-gradient-to-r ${config.gradient}
                            flex items-center justify-center
                        `}
                    >
                        <span className="text-[10px] font-black tracking-[0.3em] text-black/80">
                            {config.icon} {config.label}
                        </span>
                    </div>

                    {/* Card content */}
                    <div className="relative z-10 p-4 pt-12 h-full flex flex-col">
                        <h3 className={`text-lg font-black uppercase leading-tight mb-2 ${config.textColor}`}>
                            {powerup.name}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed flex-1 line-clamp-3">
                            {powerup.description}
                        </p>

                        {/* Stats footer */}
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <div className={`text-[10px] uppercase font-mono ${isCurse ? 'text-red-400' : 'text-emerald-400'}`}>
                                {isCurse ? "⚔️ Curse" : "🛡️ Buff"}
                            </div>
                            {powerup.value && (
                                <div className={`text-sm font-black ${config.textColor}`}>
                                    {powerup.kind === "multiplier"
                                        ? `${powerup.value}x`
                                        : isCurse ? `-${powerup.value}` : `+${powerup.value}`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Owned count badge */}
                    {count > 0 && (
                        <div className="absolute top-10 right-2 bg-black/80 px-2 py-1 rounded-full">
                            <span className="text-[10px] font-black text-white">
                                x{count}
                            </span>
                        </div>
                    )}

                    {/* Click hint */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[8px] uppercase text-white/40 font-bold">Click to view</div>
                    </div>

                    {/* Corner accent */}
                    <div
                        className={`
                            absolute bottom-0 right-0 w-16 h-16
                            bg-gradient-to-tl ${config.gradient}
                            opacity-10 rounded-tl-[50px]
                        `}
                    />
                </div>
            </TiltCard>

            {/* Detail Modal */}
            <ArtifactModal
                powerup={powerup}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

// Wrapper for the cards grid section
export function InteractiveCardGrid({
    powerups,
    discoveredIds,
    ownedCounts,
    isCurse,
}: {
    powerups: Powerup[];
    discoveredIds: string[];
    ownedCounts: Record<string, number>;
    isCurse: boolean;
}) {
    const discoveredSet = new Set(discoveredIds);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {powerups.map((powerup) => (
                <InteractiveCard
                    key={powerup.id}
                    powerup={powerup}
                    isDiscovered={discoveredSet.has(powerup.id)}
                    count={ownedCounts[powerup.id] || 0}
                    isCurse={isCurse}
                />
            ))}
        </div>
    );
}
