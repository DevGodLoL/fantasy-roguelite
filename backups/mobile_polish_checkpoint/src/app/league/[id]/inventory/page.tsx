import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InteractiveCardGrid } from "@/components/InteractiveArtifactCard";

const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;

const RARITY_CONFIG: Record<string, {
    label: string;
    gradient: string;
    textColor: string;
    icon: string;
}> = {
    legendary: {
        label: "LEGENDARY",
        gradient: "from-amber-400 via-yellow-200 to-amber-600",
        textColor: "text-amber-300",
        icon: "👑",
    },
    epic: {
        label: "EPIC",
        gradient: "from-purple-400 via-fuchsia-300 to-purple-600",
        textColor: "text-purple-300",
        icon: "💎",
    },
    rare: {
        label: "RARE",
        gradient: "from-blue-400 via-cyan-300 to-blue-600",
        textColor: "text-blue-300",
        icon: "✨",
    },
    common: {
        label: "COMMON",
        gradient: "from-zinc-400 via-slate-300 to-zinc-600",
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
    const { id: leagueId } = await params;
    const { showAll } = await searchParams;
    const showAllCards = showAll === "true";

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: { teams: true },
    });

    if (!league) return notFound();

    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    // Fetch data
    const allPowerups = await db.powerup.findMany({ orderBy: { code: "asc" } });
    const teamPowerups = await db.teamPowerup.findMany({
        where: { teamId: userTeam.id },
        include: { powerup: true }
    });

    const ownedCounts: Record<string, number> = {};
    const activeCounts: Record<string, number> = {};

    teamPowerups.forEach((tp) => {
        ownedCounts[tp.powerupId] = (ownedCounts[tp.powerupId] || 0) + 1;
        if (!tp.isConsumed) {
            activeCounts[tp.powerupId] = (activeCounts[tp.powerupId] || 0) + 1;
        }
    });

    const discoveredIds = showAllCards
        ? allPowerups.map((p) => p.id)
        : Array.from(new Set(teamPowerups.map((tp) => tp.powerupId)));
    const discoveredSet = new Set(discoveredIds);

    const boosts = allPowerups.filter((p) => p.scope !== "opponent");
    const curses = allPowerups.filter((p) => p.scope === "opponent");

    const totalPowerups = allPowerups.length;
    const discoveredCount = discoveredSet.size;
    const activeTotal = Object.values(activeCounts).reduce((a, b) => a + b, 0);
    const progressPercent = Math.round((discoveredCount / totalPowerups) * 100);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-amber-500/30">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ATMOSPHERIC BACKGROUND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER - THE ANCIENT COMMAND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-amber-400 transition-all flex items-center gap-2 group text-sm font-bold uppercase tracking-widest"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Command
                        </Link>
                        <div className="h-6 w-px bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                🛡️
                            </div>
                            <div>
                                <h1 className="font-black uppercase tracking-tighter text-base sm:text-xl bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
                                    The Ancient Armory
                                </h1>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black leading-none mt-1">
                                    Secure Vault of Power & Malice
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="px-4 py-2 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                            <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Vault Status</div>
                            <div className="text-sm font-bold text-white tracking-widest uppercase">Chamber Secure</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 space-y-16">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* VAULT STATUS DASHBOARD */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <section className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-purple-500/5 rounded-[2.5rem] blur-3xl opacity-50" />
                    <div className="relative p-8 md:p-12 bg-black/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden">
                        {/* Glint effect */}
                        <div className="absolute -inset-x-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 transition-all duration-1000 group-hover:inset-x-full" />

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
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group/stat hover:bg-emerald-500/10 transition-all">
                                    <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2 group-hover/stat:translate-x-1 transition-transform">🛡️ Blessings</div>
                                    <div className="text-3xl font-black text-white leading-none">{boosts.filter(p => discoveredSet.has(p.id)).length}</div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mt-2">Discovered</div>
                                </div>
                                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl group/stat hover:bg-red-500/10 transition-all">
                                    <div className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-2 group-hover/stat:translate-x-1 transition-transform">⚔️ Relics</div>
                                    <div className="text-3xl font-black text-white leading-none">{curses.filter(p => discoveredSet.has(p.id)).length}</div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mt-2">Corrupted</div>
                                </div>
                                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl group/stat hover:bg-blue-500/10 transition-all">
                                    <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2 group-hover/stat:translate-x-1 transition-transform">✨ Sockets</div>
                                    <div className="text-3xl font-black text-white leading-none">{activeTotal}</div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mt-2">Equipped</div>
                                </div>
                                <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl group/stat hover:bg-purple-500/10 transition-all">
                                    <div className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-2 group-hover/stat:translate-x-1 transition-transform">🔮 Mana</div>
                                    <div className="text-3xl font-black text-white leading-none">HIGH</div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mt-2">Atmospheric</div>
                                </div>
                            </div>
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
                        <div className="px-6 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-right hidden lg:block">
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Chamber Yield • </span>
                            <span className="text-sm font-black text-white tracking-widest">{boosts.filter(p => discoveredSet.has(p.id)).length} / {boosts.length}</span>
                        </div>
                    </div>

                    <div className="space-y-12 pl-4 md:pl-8 border-l border-white/5">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityBoosts = boosts.filter((p) => p.rarity === rarity);
                            if (rarityBoosts.length === 0) return null;
                            const config = RARITY_CONFIG[rarity];
                            const discovered = rarityBoosts.filter(p => discoveredSet.has(p.id)).length;

                            return (
                                <div key={`boost-${rarity}`} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-black font-black text-[10px] uppercase tracking-[.2em] shadow-lg shadow-emerald-500/20`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                        <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{discovered} found</div>
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
                        <div className="px-6 py-2 bg-red-500/5 border border-red-500/20 rounded-full text-right hidden lg:block">
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Corruption Level • </span>
                            <span className="text-sm font-black text-white tracking-widest">{curses.filter(p => discoveredSet.has(p.id)).length} / {curses.length}</span>
                        </div>
                    </div>

                    <div className="space-y-12 pl-4 md:pl-8 border-l border-white/5">
                        {RARITY_ORDER.map((rarity) => {
                            const rarityCurses = curses.filter((p) => p.rarity === rarity);
                            if (rarityCurses.length === 0) return null;
                            const config = RARITY_CONFIG[rarity];
                            const discovered = rarityCurses.filter(p => discoveredSet.has(p.id)).length;

                            return (
                                <div key={`curse-${rarity}`} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-black font-black text-[10px] uppercase tracking-[.2em] shadow-lg shadow-red-500/20`}>
                                            {config.icon} {config.label}
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                        <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{discovered} found</div>
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
            </main>
        </div>
    );
}
