import React from "react";

interface Powerup {
    id: string;
    name: string;
    description: string;
    rarity: string;
    type?: string;
    // Add other fields as needed based on schema
}

interface ArtifactCardProps {
    powerup: Powerup;
    isConsumed?: boolean;
    weekNumber?: number;
    size?: "sm" | "md" | "lg";
}

const rarityColors: Record<string, string> = {
    common: "border-zinc-600 bg-zinc-900/40 text-zinc-300",
    rare: "border-blue-500 bg-blue-900/20 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    epic: "border-purple-500 bg-purple-900/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    legendary: "border-amber-500 bg-amber-900/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]",
};

const rarityText: Record<string, string> = {
    common: "text-zinc-500",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-amber-400",
};

export default function ArtifactCard({ powerup, isConsumed = false, weekNumber, size = "md" }: ArtifactCardProps) {
    const baseClasses = `relative rounded-xl border-2 flex flex-col justify-between transition-all hover:scale-[1.02]`;
    const colorClasses = rarityColors[powerup.rarity] || rarityColors.common;
    const consumedClasses = isConsumed ? "opacity-50 grayscale" : "opacity-100";

    // Size variants
    const pPadding = size === "sm" ? "p-3" : "p-6";
    const titleSize = size === "sm" ? "text-sm" : "text-xl";
    const descSize = size === "sm" ? "text-[10px]" : "text-sm";

    return (
        <div className={`${baseClasses} ${colorClasses} ${consumedClasses} ${pPadding}`}>
            {isConsumed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 border-2 border-zinc-500 px-2 py-1 -rotate-12 bg-black/80">
                        Depleted
                    </span>
                </div>
            )}

            {weekNumber && (
                <div className="absolute top-2 right-3 text-[10px] font-mono opacity-60">
                    Week {weekNumber}
                </div>
            )}

            <div>
                <div className={`text-[10px] uppercase font-black tracking-widest mb-1 ${rarityText[powerup.rarity]}`}>
                    {powerup.rarity} Artifact
                </div>
                <h3 className={`${titleSize} font-black uppercase leading-tight mb-2`}>
                    {powerup.name}
                </h3>
                <p className={`${descSize} font-medium opacity-80 leading-relaxed`}>
                    {powerup.description}
                </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center opacity-75">
                <div className="text-[10px] font-mono uppercase">
                    ID: {powerup.id.slice(0, 4)}
                </div>
            </div>
        </div>
    );
}
