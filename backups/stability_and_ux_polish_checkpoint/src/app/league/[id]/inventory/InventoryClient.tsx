"use client";

import { useState, useMemo } from "react";
import { InteractiveCardGrid, type Powerup } from "@/components/InteractiveArtifactCard";
import { Search, X, Filter } from "lucide-react";

// Powerup interface is now imported from InteractiveArtifactCard

interface InventoryClientProps {
    allPowerups: Powerup[];
    ownedCounts: Record<string, number>;
    discoveredIds: string[];
    discoveredCount: number;
    totalPowerups: number;
    progressPercent: number;
    activeTotal: number;
}

const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;

const RARITY_CONFIG: Record<string, {
    label: string;
    gradient: string;
    textColor: string;
    icon: string;
    ring: string;
}> = {
    legendary: {
        label: "LEGENDARY",
        gradient: "from-amber-400 via-yellow-200 to-amber-600",
        textColor: "text-amber-300",
        icon: "👑",
        ring: "ring-amber-500/30",
    },
    epic: {
        label: "EPIC",
        gradient: "from-purple-400 via-fuchsia-300 to-purple-600",
        textColor: "text-purple-300",
        icon: "💎",
        ring: "ring-purple-500/30",
    },
    rare: {
        label: "RARE",
        gradient: "from-blue-400 via-cyan-300 to-blue-600",
        textColor: "text-blue-300",
        icon: "✨",
        ring: "ring-blue-500/30",
    },
    common: {
        label: "COMMON",
        gradient: "from-zinc-400 via-slate-300 to-zinc-600",
        textColor: "text-zinc-400",
        icon: "⚙️",
        ring: "ring-zinc-600/30",
    },
};

export default function InventoryClient({
    allPowerups,
    ownedCounts,
    discoveredIds,
    discoveredCount,
    totalPowerups,
    progressPercent,
    activeTotal
}: InventoryClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);

    const discoveredSet = new Set(discoveredIds);

    const filteredPowerups = useMemo(() => {
        return allPowerups.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRarity = !selectedRarity || p.rarity === selectedRarity;
            const matchesOwned = !showOwnedOnly || (ownedCounts[p.id] > 0);

            return matchesSearch && matchesRarity && matchesOwned;
        });
    }, [allPowerups, searchQuery, selectedRarity, showOwnedOnly, ownedCounts]);

    const boosts = filteredPowerups.filter((p) => p.scope !== "opponent");
    const curses = filteredPowerups.filter((p) => p.scope === "opponent");

    return (
        <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 space-y-12">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VAULT STATUS DASHBOARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="relative group">
                <div className="absolute inset-x-0 -top-20 h-64 bg-amber-500/5 blur-[120px] pointer-events-none" />
                <div className="relative p-8 md:p-12 bg-black/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        {/* Collection Progress */}
                        <div className="lg:col-span-5 space-y-6 border-b lg:border-b-0 lg:border-r border-white/5 pb-10 lg:pb-0 lg:pr-10">
                            <div>
                                <div className="text-[10px] text-amber-500 font-black uppercase tracking-[.4em] mb-2">Ancient Knowledge</div>
                                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
                                    Collection <span className="text-zinc-500">Log</span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">{discoveredCount}</span>
                                        <span className="text-xl text-zinc-600 font-bold">/ {totalPowerups}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-amber-500">{progressPercent}%</div>
                                        <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Mastery Level</div>
                                    </div>
                                </div>
                                <div className="h-3 bg-zinc-900/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Blessings" value={boosts.filter(p => discoveredSet.has(p.id)).length} color="emerald" icon="🛡️" />
                            <StatCard label="Relics" value={curses.filter(p => discoveredSet.has(p.id)).length} color="red" icon="⚔️" />
                            <StatCard label="Equipped" value={activeTotal} color="blue" icon="✨" />
                            <StatCard label="Atmospheric" value="HIGH" color="purple" icon="🔮" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SEARCH & FILTERS BAR */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="sticky top-24 z-40 py-4 -mx-4 px-4 bg-[#030303]/80 backdrop-blur-md border-y border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center">
                    {/* Search Input */}
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find artifact by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm font-bold placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all uppercase tracking-widest"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3 text-zinc-500" />
                            </button>
                        )}
                    </div>

                    {/* Rarity Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto scrollbar-hide">
                        <button
                            onClick={() => setSelectedRarity(null)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0
                                ${!selectedRarity ? 'bg-white text-black border-white' : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'}
                            `}
                        >
                            All
                        </button>
                        {RARITY_ORDER.map(rarity => (
                            <button
                                key={rarity}
                                onClick={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 flex items-center gap-2
                                    ${selectedRarity === rarity
                                        ? `${RARITY_CONFIG[rarity].gradient.split(' ')[0].replace('from-', 'bg-')} text-black border-white`
                                        : `bg-white/5 ${RARITY_CONFIG[rarity].textColor} border-white/10 hover:bg-white/10`}
                                `}
                            >
                                {RARITY_CONFIG[rarity].icon} {rarity}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden md:block" />

                    {/* Owned Toggle */}
                    <button
                        onClick={() => setShowOwnedOnly(!showOwnedOnly)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 flex items-center gap-2
                            ${showOwnedOnly ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10'}
                        `}
                    >
                        <Filter className="w-3 h-3" /> {showOwnedOnly ? "Owned Only" : "Show All"}
                    </button>

                    <div className="flex-1 md:text-right">
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            Found: {filteredPowerups.length}
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SANCTIFIED ARTIFACTS (BLESSINGS) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl text-emerald-500">🛡️</div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                                Sanctified <span className="text-white">Artifacts</span>
                            </h2>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em] pl-12">Empower your legion with divine energy</p>
                    </div>
                    {boosts.length > 0 && (
                        <div className="px-6 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-right hidden lg:block">
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Visible • </span>
                            <span className="text-sm font-black text-white tracking-widest">{boosts.length} Artifacts</span>
                        </div>
                    )}
                </div>

                {boosts.length > 0 ? (
                    <div className="space-y-12 pl-4 md:pl-8 border-l border-white/5">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityBoosts = boosts.filter((p) => p.rarity === rarity);
                            if (rarityBoosts.length === 0) return null;
                            const config = RARITY_CONFIG[rarity];

                            return (
                                <div key={`boost-${rarity}`} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-black font-black text-[10px] uppercase tracking-[.2em] shadow-lg shadow-emerald-500/20`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <InteractiveCardGrid
                                        powerups={rarityBoosts}
                                        discoveredIds={discoveredIds}
                                        ownedCounts={ownedCounts}
                                        isCurse={false}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No blessings match your criteria</p>
                    </div>
                )}
            </section>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mx-auto max-w-4xl" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MALICIOUS RELICS (CURSES) */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl text-red-500">⚔️</div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                Malicious <span className="text-white">Relics</span>
                            </h2>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em] pl-12">Sabotage rival commanders with dark magic</p>
                    </div>
                    {curses.length > 0 && (
                        <div className="px-6 py-2 bg-red-500/5 border border-red-500/20 rounded-full text-right hidden lg:block">
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Corruption • </span>
                            <span className="text-sm font-black text-white tracking-widest">{curses.length} Relics</span>
                        </div>
                    )}
                </div>

                {curses.length > 0 ? (
                    <div className="space-y-12 pl-4 md:pl-8 border-l border-white/5">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityCurses = curses.filter((p) => p.rarity === rarity);
                            if (rarityCurses.length === 0) return null;
                            const config = RARITY_CONFIG[rarity];

                            return (
                                <div key={`curse-${rarity}`} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-black font-black text-[10px] uppercase tracking-[.2em] shadow-lg shadow-red-500/20`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <InteractiveCardGrid
                                        powerups={rarityCurses}
                                        discoveredIds={discoveredIds}
                                        ownedCounts={ownedCounts}
                                        isCurse={true}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No relics match your criteria</p>
                    </div>
                )}
            </section>
        </main>
    );
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10",
        red: "bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10",
        blue: "bg-blue-500/5 border-blue-500/20 text-blue-400 hover:bg-blue-500/10",
        purple: "bg-purple-500/5 border-purple-500/20 text-purple-400 hover:bg-purple-500/10",
    };

    return (
        <div className={`p-6 border rounded-2xl group/stat transition-all ${colors[color]}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-2 group-hover/stat:translate-x-1 transition-transform`}>
                {icon} {label}
            </div>
            <div className="text-3xl font-black text-white leading-none">{value}</div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold mt-2">Active Flux</div>
        </div>
    );
}
