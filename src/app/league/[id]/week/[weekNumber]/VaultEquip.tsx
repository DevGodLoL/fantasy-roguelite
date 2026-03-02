"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { equipArtifact } from "./actions";
import { toast } from "sonner";

interface VaultItem {
    id: string;
    powerupId: string;
    source: string;
    powerup: {
        id: string;
        name: string;
        description: string;
        rarity: string;
        kind: string | null;
        value: number | null;
        scope: string;
        type: string;
    };
}

interface VaultEquipProps {
    leagueId: string;
    weekId: string;
    weekNumber: number;
    vaultItems: VaultItem[];
}

const RARITY_CONFIG: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
    common: { bg: "from-zinc-900 to-zinc-800", text: "text-zinc-400", border: "border-zinc-700/50", glow: "", icon: "📜" },
    rare: { bg: "from-blue-900/40 to-blue-800/20", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", icon: "⚔️" },
    epic: { bg: "from-purple-900/40 to-purple-800/20", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-[0_0_30px_rgba(168,85,247,0.25)]", icon: "💎" },
    legendary: { bg: "from-amber-900/40 to-amber-800/20", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-[0_0_40px_rgba(245,158,11,0.35)]", icon: "👑" },
};

export default function VaultEquip({
    leagueId,
    weekId,
    weekNumber,
    vaultItems,
}: VaultEquipProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleEquip = async (teamPowerupId: string) => {
        setIsPending(true);
        setSelectedId(teamPowerupId);
        try {
            await equipArtifact(leagueId, teamPowerupId, weekId, weekNumber);
            toast.success("Artifact equipped for battle!");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to equip artifact.");
            setIsPending(false);
            setSelectedId(null);
        }
    };

    if (vaultItems.length === 0) {
        return (
            <div className="p-6 bg-zinc-900/30 border border-dashed border-zinc-700 rounded-2xl text-center">
                <div className="text-3xl mb-3 opacity-50">🛡️</div>
                <h3 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-1">Vault Empty</h3>
                <p className="text-xs text-zinc-600">No artifacts available. Open your weekly pack first.</p>
            </div>
        );
    }

    // Group by type for better display
    const cards = vaultItems.filter(v => v.powerup.type === 'card');
    const relics = vaultItems.filter(v => v.powerup.type === 'relic');

    return (
        <div className="relative p-6 lg:p-8 bg-black/40 backdrop-blur-md border border-amber-500/20 rounded-2xl overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 via-transparent to-purple-900/5" />

            <div className="relative z-10 space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-8 bg-gradient-to-l from-amber-500/50 to-transparent" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-[.3em]">Equip Artifact</span>
                        <div className="h-px w-8 bg-gradient-to-r from-amber-500/50 to-transparent" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase">Choose from Vault</h2>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                        Select one artifact to empower your legion for this battle
                    </p>
                </div>

                {/* Cards Section */}
                {cards.length > 0 && (
                    <div>
                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Consumable Artifacts ({cards.length})</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {cards.map((item) => {
                                const p = item.powerup;
                                const config = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;
                                const isSelected = selectedId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => !isPending && handleEquip(item.id)}
                                        className={`
                                            relative group cursor-pointer rounded-xl p-4 border transition-all duration-300
                                            bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                            ${isPending ? 'opacity-40 pointer-events-none' : 'hover:scale-[1.03] active:scale-95'}
                                            ${isSelected ? 'ring-2 ring-amber-400 scale-[1.03]' : ''}
                                        `}
                                    >
                                        <div className="flex flex-col h-full gap-3 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="text-2xl">{config.icon}</div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${config.text} ${config.border}`}>
                                                    {p.rarity}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-black text-sm text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight leading-tight">
                                                    {p.name}
                                                </h3>
                                                <div className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${p.scope === 'self' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {p.scope === 'self' ? '✨ Buff' : '💀 Curse'}
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-zinc-400 leading-relaxed flex-1">
                                                {p.description}
                                            </p>

                                            <div className="pt-2 border-t border-white/10 mt-auto">
                                                <button className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                                    ${isSelected
                                                        ? 'bg-amber-500 text-black'
                                                        : 'bg-white/10 text-white group-hover:bg-amber-500/20 group-hover:text-amber-300'
                                                    }`}
                                                >
                                                    {isSelected ? 'Equipping...' : 'Equip'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Relics Section */}
                {relics.length > 0 && (
                    <div>
                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">
                            Relics ({relics.length}) — <span className="text-amber-500/60">Persistent, not consumed</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {relics.map((item) => {
                                const p = item.powerup;
                                const config = RARITY_CONFIG[p.rarity] || RARITY_CONFIG.common;
                                const isSelected = selectedId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => !isPending && handleEquip(item.id)}
                                        className={`
                                            relative group cursor-pointer rounded-xl p-4 border transition-all duration-300
                                            bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                            ${isPending ? 'opacity-40 pointer-events-none' : 'hover:scale-[1.03] active:scale-95'}
                                            ${isSelected ? 'ring-2 ring-amber-400 scale-[1.03]' : ''}
                                        `}
                                    >
                                        <div className="flex flex-col h-full gap-3 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="text-2xl">🏺</div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${config.text} ${config.border}`}>
                                                    {p.rarity}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-black text-sm text-white group-hover:text-amber-300 transition-colors uppercase tracking-tight leading-tight">
                                                    {p.name}
                                                </h3>
                                                <div className="text-[8px] font-bold uppercase tracking-widest mt-1 text-amber-400">
                                                    🏺 Relic
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-zinc-400 leading-relaxed flex-1">{p.description}</p>

                                            <div className="pt-2 border-t border-white/10 mt-auto">
                                                <button className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                                    ${isSelected
                                                        ? 'bg-amber-500 text-black'
                                                        : 'bg-white/10 text-white group-hover:bg-amber-500/20 group-hover:text-amber-300'
                                                    }`}
                                                >
                                                    {isSelected ? 'Equipping...' : 'Equip'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-3xl animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.5)] mb-4">
                        ⚔️
                    </div>
                    <div className="text-white font-black uppercase tracking-[.3em] text-sm animate-pulse">Binding Artifact...</div>
                    <p className="mt-1.5 text-zinc-500 text-xs font-bold uppercase">Power flows into your legion</p>
                </div>
            )}
        </div>
    );
}
