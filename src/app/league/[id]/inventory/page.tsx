import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InteractiveCardGrid } from "@/components/InteractiveArtifactCard";

// Rarity order and styling
const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;

const RARITY_CONFIG: Record<string, {
    label: string;
    gradient: string;
    textColor: string;
    icon: string;
}> = {
    legendary: {
        label: "LEGENDARY",
        gradient: "from-amber-400 via-yellow-300 to-amber-500",
        textColor: "text-amber-300",
        icon: "👑",
    },
    epic: {
        label: "EPIC",
        gradient: "from-purple-400 via-fuchsia-400 to-purple-500",
        textColor: "text-purple-300",
        icon: "💎",
    },
    rare: {
        label: "RARE",
        gradient: "from-blue-400 via-cyan-400 to-blue-500",
        textColor: "text-blue-300",
        icon: "✨",
    },
    common: {
        label: "COMMON",
        gradient: "from-zinc-400 via-slate-400 to-zinc-500",
        textColor: "text-zinc-400",
        icon: "⚙️",
    },
};

export default async function InventoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ showAll?: string }>;
}) {
    const { id } = await params;
    const { showAll } = await searchParams;
    const showAllCards = showAll === "true";

    const league = await db.league.findUnique({
        where: { id },
        include: { teams: true },
    });

    if (!league) return notFound();

    // Identify User Team (Mock)
    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    // Fetch ALL powerups
    const allPowerups = await db.powerup.findMany({
        orderBy: { code: "asc" },
    });

    // Fetch team's discovered powerups
    const teamPowerups = await db.teamPowerup.findMany({
        where: { teamId: userTeam.id },
        include: { powerup: true, week: true },
    });

    // Create maps (convert to plain objects for client components)
    const ownedCounts: Record<string, number> = {};
    const activeCounts: Record<string, number> = {};

    teamPowerups.forEach((tp) => {
        ownedCounts[tp.powerupId] = (ownedCounts[tp.powerupId] || 0) + 1;
        if (!tp.isConsumed) {
            activeCounts[tp.powerupId] = (activeCounts[tp.powerupId] || 0) + 1;
        }
    });

    // If showAllCards is enabled, treat all powerups as discovered for inspection
    const discoveredIds = showAllCards
        ? allPowerups.map((p) => p.id)
        : teamPowerups.map((tp) => tp.powerupId);
    const discoveredSet = new Set(discoveredIds);

    // Separate into Boosts and Curses
    const boosts = allPowerups.filter((p) => p.scope !== "opponent");
    const curses = allPowerups.filter((p) => p.scope === "opponent");

    // Stats
    const totalPowerups = allPowerups.length;
    const discoveredCount = discoveredSet.size;
    const activeTotal = Object.values(activeCounts).reduce((a, b) => a + b, 0);
    const boostsDiscovered = boosts.filter(p => discoveredSet.has(p.id)).length;
    const cursesDiscovered = curses.filter(p => discoveredSet.has(p.id)).length;

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-amber-500/30">
            {/* Animated background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-emerald-900/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-red-900/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[60%] left-[50%] w-[25%] h-[25%] bg-purple-900/5 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            {/* Nav */}
            <div className="bg-black/50 border-b border-white/5 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link
                        href={`/league/${id}`}
                        className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                        ← Back to League
                    </Link>
                    <h1 className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 bg-clip-text text-transparent">
                        Artifact Collection
                    </h1>
                </div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-16">
                {/* Dev Mode Banner */}
                {showAllCards && (
                    <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-4 text-center">
                        <div className="text-amber-400 font-black uppercase tracking-widest text-sm">
                            🔓 Dev Mode: All Cards Revealed
                        </div>
                        <div className="text-amber-400/60 text-xs mt-1">
                            Remove ?showAll=true from URL to see normal view
                        </div>
                    </div>
                )}

                {/* Stats Section */}
                <section className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-red-500/10 rounded-3xl blur-3xl" />
                    <div className="relative grid md:grid-cols-5 gap-6">
                        {/* Collection Progress */}
                        <div className="md:col-span-2 p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                            <div className="text-xs text-zinc-500 uppercase font-black tracking-[0.3em] mb-4">
                                Collection Progress
                            </div>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-red-400 bg-clip-text text-transparent">
                                    {discoveredCount}
                                </div>
                                <div className="text-2xl text-zinc-600 font-black mb-2">/ {totalPowerups}</div>
                            </div>
                            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(discoveredCount / totalPowerups) * 100}%` }}
                                />
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                                {Math.round((discoveredCount / totalPowerups) * 100)}% discovered
                            </div>
                        </div>

                        {/* Boosts Count */}
                        <div className="p-8 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-3xl">
                            <div className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.3em] mb-4">
                                🛡️ Blessings
                            </div>
                            <div className="text-4xl font-black text-emerald-400">{boostsDiscovered}</div>
                            <div className="text-xs text-zinc-500 mt-2">/ {boosts.length} total</div>
                        </div>

                        {/* Curses Count */}
                        <div className="p-8 bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-3xl">
                            <div className="text-xs text-red-400/60 uppercase font-black tracking-[0.3em] mb-4">
                                ⚔️ Curses
                            </div>
                            <div className="text-4xl font-black text-red-400">{cursesDiscovered}</div>
                            <div className="text-xs text-zinc-500 mt-2">/ {curses.length} total</div>
                        </div>

                        {/* Active */}
                        <div className="p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                            <div className="text-xs text-zinc-500 uppercase font-black tracking-[0.3em] mb-4">
                                Active
                            </div>
                            <div className="text-4xl font-black text-white">{activeTotal}</div>
                            <div className="text-xs text-zinc-500 mt-2">Ready to use</div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BLESSINGS SECTION */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <section className="space-y-8">
                    {/* Section Header */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent blur-3xl -z-10" />
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">🛡️</div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                                        Blessings
                                    </h2>
                                    <p className="text-sm text-emerald-400/60">Power up your team with divine artifacts</p>
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                            <div className="px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-xl">
                                <span className="text-sm font-black text-emerald-400">{boostsDiscovered} / {boosts.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Boosts by Rarity */}
                    <div className="space-y-10 pl-4 border-l-2 border-emerald-500/20">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityBoosts = boosts.filter((p) => p.rarity === rarity);
                            if (rarityBoosts.length === 0) return null;

                            const config = RARITY_CONFIG[rarity];
                            const discovered = rarityBoosts.filter(p => discoveredSet.has(p.id)).length;

                            return (
                                <div key={`boost-${rarity}`} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.gradient} text-black font-black text-xs uppercase tracking-widest`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-white/10" />
                                        <div className="text-xs text-zinc-500 font-mono">{discovered} / {rarityBoosts.length}</div>
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
                </section>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* CURSES SECTION */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <section className="space-y-8">
                    {/* Section Header */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent blur-3xl -z-10" />
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">⚔️</div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent">
                                        Curses
                                    </h2>
                                    <p className="text-sm text-red-400/60">Sabotage your opponents with dark magic</p>
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
                            <div className="px-4 py-2 bg-red-900/30 border border-red-500/30 rounded-xl">
                                <span className="text-sm font-black text-red-400">{cursesDiscovered} / {curses.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Curses by Rarity */}
                    <div className="space-y-10 pl-4 border-l-2 border-red-500/20">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityCurses = curses.filter((p) => p.rarity === rarity);
                            if (rarityCurses.length === 0) return null;

                            const config = RARITY_CONFIG[rarity];
                            const discovered = rarityCurses.filter(p => discoveredSet.has(p.id)).length;

                            return (
                                <div key={`curse-${rarity}`} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.gradient} text-black font-black text-xs uppercase tracking-widest`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-white/10" />
                                        <div className="text-xs text-zinc-500 font-mono">{discovered} / {rarityCurses.length}</div>
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
                </section>

                {/* Empty state */}
                {allPowerups.length === 0 && (
                    <div className="text-center py-24">
                        <div className="text-8xl mb-6">🎴</div>
                        <div className="text-2xl font-black text-zinc-500 uppercase tracking-widest">
                            No Artifacts Yet
                        </div>
                        <div className="text-zinc-600 mt-2">
                            Complete the draft and open card packs to discover artifacts!
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
