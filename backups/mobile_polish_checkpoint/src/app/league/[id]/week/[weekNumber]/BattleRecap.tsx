"use client";

import { useState } from "react";

interface PowerupOffer {
    id: string;
    isChosen: boolean;
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

interface BattleRecapProps {
    userScore: number;
    oppScore: number;
    userTeamName: string;
    oppTeamName: string;
    activePowerup: {
        powerup: {
            name: string;
            description: string;
            kind: string | null;
            value: number | null;
            rarity: string;
        };
    } | null;
    allOffers: PowerupOffer[]; // All offers including chosen
    baseScore?: number; // Score before powerup (optional, we can estimate)
}

const RARITY_CONFIG: Record<string, { gradient: string; glow: string; textColor: string }> = {
    legendary: {
        gradient: "from-amber-400 via-yellow-300 to-amber-500",
        glow: "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
        textColor: "text-amber-300",
    },
    epic: {
        gradient: "from-purple-400 via-fuchsia-400 to-purple-500",
        glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
        textColor: "text-purple-300",
    },
    rare: {
        gradient: "from-blue-400 via-cyan-400 to-blue-500",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
        textColor: "text-blue-300",
    },
    common: {
        gradient: "from-zinc-400 via-slate-400 to-zinc-500",
        glow: "",
        textColor: "text-zinc-400",
    },
};

export default function BattleRecap({
    userScore,
    oppScore,
    userTeamName,
    oppTeamName,
    activePowerup,
    allOffers,
}: BattleRecapProps) {
    const [showMissed, setShowMissed] = useState(false);

    const userWon = userScore > oppScore;
    const userLost = userScore < oppScore;
    const margin = Math.abs(userScore - oppScore).toFixed(1);

    // Calculate artifact impact (estimate)
    let artifactImpact = 0;
    let impactDescription = "";

    if (activePowerup?.powerup) {
        const { kind, value } = activePowerup.powerup;
        if (kind === "multiplier" && value) {
            // Estimate: score = baseScore * multiplier, so baseScore = score / multiplier
            const estimatedBase = userScore / value;
            artifactImpact = userScore - estimatedBase;
            impactDescription = `${value}x multiplier added`;
        } else if (kind === "bonus_points" && value) {
            artifactImpact = value;
            impactDescription = `+${value} bonus added`;
        }
    }

    // Get missed offers (ones not chosen)
    const missedOffers = allOffers.filter(o => !o.isChosen);
    const chosenOffer = allOffers.find(o => o.isChosen);

    // Determine if a missed artifact could've changed the outcome
    const wouldHaveWonWith = missedOffers.map(offer => {
        const { kind, value } = offer.powerup;
        let hypotheticalScore = userScore;

        if (!activePowerup) {
            // No artifact was used, calculate what score could've been
            if (kind === "multiplier" && value) {
                // Can't know base score without artifact, skip
                hypotheticalScore = userScore * value;
            } else if (kind === "bonus_points" && value) {
                hypotheticalScore = userScore + value;
            }
        } else {
            // Replace current artifact effect with this one
            const baseScore = activePowerup.powerup.kind === "multiplier" && activePowerup.powerup.value
                ? userScore / activePowerup.powerup.value
                : userScore - (activePowerup.powerup.value || 0);

            if (kind === "multiplier" && value) {
                hypotheticalScore = baseScore * value;
            } else if (kind === "bonus_points" && value) {
                hypotheticalScore = baseScore + value;
            }
        }

        const wouldWin = hypotheticalScore > oppScore;
        const currentlyWon = userScore > oppScore;

        return {
            ...offer,
            hypotheticalScore: hypotheticalScore.toFixed(1),
            wouldHaveChanged: wouldWin !== currentlyWon,
            wouldHaveWon: wouldWin,
        };
    });

    const config = activePowerup?.powerup
        ? RARITY_CONFIG[activePowerup.powerup.rarity] || RARITY_CONFIG.common
        : null;

    return (
        <div className="space-y-6">
            {/* Main Recap Card */}
            <div className={`relative p-8 rounded-3xl border overflow-hidden ${userWon
                    ? "bg-gradient-to-br from-emerald-900/30 to-emerald-950/40 border-emerald-500/30"
                    : userLost
                        ? "bg-gradient-to-br from-red-900/30 to-red-950/40 border-red-500/30"
                        : "bg-gradient-to-br from-zinc-900/30 to-zinc-950/40 border-zinc-500/30"
                }`}>
                {/* Background effect */}
                <div className={`absolute inset-0 opacity-20 ${userWon ? "bg-gradient-to-r from-emerald-500/20 to-transparent" :
                        userLost ? "bg-gradient-to-r from-red-500/20 to-transparent" : ""
                    }`} />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${userWon ? "bg-emerald-500/20" : userLost ? "bg-red-500/20" : "bg-zinc-500/20"
                            }`}>
                            {userWon ? "🏆" : userLost ? "💀" : "⚖️"}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-500 mb-1">
                                Battle Chronicle
                            </div>
                            <h2 className={`text-2xl font-black ${userWon ? "text-emerald-400" : userLost ? "text-red-400" : "text-zinc-400"
                                }`}>
                                {userWon ? "VICTORY!" : userLost ? "DEFEAT" : "DRAW"}
                            </h2>
                        </div>
                    </div>

                    {/* Narrative */}
                    <div className="space-y-4">
                        <p className="text-lg text-white">
                            {userWon ? (
                                <>
                                    <span className="font-bold text-emerald-400">{userTeamName}</span> conquered{" "}
                                    <span className="text-zinc-400">{oppTeamName}</span> by{" "}
                                    <span className="font-black text-emerald-300">{margin} points</span>.
                                </>
                            ) : userLost ? (
                                <>
                                    <span className="font-bold text-red-400">{userTeamName}</span> fell to{" "}
                                    <span className="text-zinc-400">{oppTeamName}</span> by{" "}
                                    <span className="font-black text-red-300">{margin} points</span>.
                                </>
                            ) : (
                                <>The battle ended in a <span className="font-black">stalemate</span>.</>
                            )}
                        </p>

                        {/* Artifact Impact */}
                        {activePowerup && artifactImpact > 0 && (
                            <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${config?.glow} ${userWon ? "bg-emerald-500/10 border-emerald-500/30" : "bg-zinc-800/50 border-zinc-700"
                                }`}>
                                <span className="text-2xl">✨</span>
                                <div>
                                    <div className={`text-sm font-black ${config?.textColor}`}>
                                        {activePowerup.powerup.name}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {impactDescription} → <span className="font-bold text-white">+{artifactImpact.toFixed(1)} pts</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!activePowerup && (
                            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <span className="text-2xl opacity-50">📦</span>
                                <div className="text-sm text-zinc-500">
                                    No artifact was equipped this battle
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* What You Missed Section */}
            {missedOffers.length > 0 && (
                <div className="space-y-4">
                    <button
                        onClick={() => setShowMissed(!showMissed)}
                        className="flex items-center gap-3 text-sm font-bold text-zinc-500 hover:text-zinc-300 transition-colors group"
                    >
                        <span className={`transition-transform duration-300 ${showMissed ? "rotate-90" : ""}`}>
                            ▶
                        </span>
                        <span>What You Could've Picked</span>
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-600">
                            {missedOffers.length} other{missedOffers.length > 1 ? "s" : ""}
                        </span>
                    </button>

                    {showMissed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                            {wouldHaveWonWith.map((offer) => {
                                const offerConfig = RARITY_CONFIG[offer.powerup.rarity] || RARITY_CONFIG.common;
                                const isCurse = offer.powerup.scope === "opponent";

                                return (
                                    <div
                                        key={offer.id}
                                        className={`relative p-4 rounded-xl border transition-all ${offer.wouldHaveChanged
                                                ? offer.wouldHaveWon
                                                    ? "bg-emerald-900/20 border-emerald-500/40 ring-2 ring-emerald-500/20"
                                                    : "bg-red-900/20 border-red-500/40"
                                                : "bg-zinc-900/40 border-zinc-800/50"
                                            }`}
                                    >
                                        {offer.wouldHaveChanged && (
                                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${offer.wouldHaveWon
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-red-500 text-white"
                                                }`}>
                                                {offer.wouldHaveWon ? "Would've Won!" : "Would've Lost"}
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${offerConfig.gradient} flex items-center justify-center text-black text-xs font-black`}>
                                                {offer.powerup.rarity.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm truncate ${offerConfig.textColor}`}>
                                                    {offer.powerup.name}
                                                </h4>
                                                <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                                                    {offer.powerup.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isCurse ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                                                        }`}>
                                                        {offer.powerup.kind === "multiplier"
                                                            ? `${offer.powerup.value}x`
                                                            : isCurse
                                                                ? `-${offer.powerup.value}`
                                                                : `+${offer.powerup.value}`}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600">
                                                        → {offer.hypotheticalScore} pts
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
