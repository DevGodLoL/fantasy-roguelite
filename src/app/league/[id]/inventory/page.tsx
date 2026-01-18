import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

// Rarity order and styling
const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;

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

// Type configuration for Boosts vs Curses
const TYPE_CONFIG = {
    boost: {
        label: "BLESSINGS",
        subtitle: "Power up your team",
        icon: "🛡️",
        gradient: "from-emerald-500 via-green-400 to-teal-500",
        bgGlow: "bg-emerald-900/5",
        borderColor: "border-emerald-500/30",
    },
    curse: {
        label: "CURSES",
        subtitle: "Sabotage your opponent",
        icon: "⚔️",
        gradient: "from-red-500 via-rose-400 to-pink-500",
        bgGlow: "bg-red-900/5",
        borderColor: "border-red-500/30",
    },
};

interface Powerup {
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

function CollectibleCard({
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
    const config = RARITY_CONFIG[powerup.rarity] || RARITY_CONFIG.common;

    // Face-down card for undiscovered
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

    // Face-up discovered card
    return (
        <div className="group relative">
            <div
                className={`
                    relative aspect-[3/4] rounded-2xl overflow-hidden
                    ${config.bgCard}
                    border-2 ${config.border}
                    ${config.glow}
                    transition-all duration-300
                    hover:scale-105
                    cursor-pointer
                `}
            >
                {/* Shine effect overlay */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{
                        background:
                            "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
                        backgroundSize: "200% 200%",
                        animation: "shine 1.5s ease-in-out infinite",
                    }}
                />

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
                    <p className="text-xs text-white/70 leading-relaxed flex-1">
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

                {/* Corner accent */}
                <div
                    className={`
                        absolute bottom-0 right-0 w-16 h-16
                        bg-gradient-to-tl ${config.gradient}
                        opacity-10 rounded-tl-[50px]
                    `}
                />
            </div>
        </div>
    );
}

// Rarity section component
function RaritySection({
    rarity,
    powerups,
    discoveredIds,
    ownedCounts,
    isCurse,
}: {
    rarity: string;
    powerups: Powerup[];
    discoveredIds: Set<string>;
    ownedCounts: Map<string, number>;
    isCurse: boolean;
}) {
    const config = RARITY_CONFIG[rarity];
    if (powerups.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Rarity header */}
            <div className="flex items-center gap-3">
                <div
                    className={`
                        px-3 py-1.5 rounded-lg
                        bg-gradient-to-r ${config.gradient}
                        text-black font-black text-xs uppercase tracking-widest
                    `}
                >
                    {config.icon} {config.label}
                </div>
                <div className="h-px flex-1 bg-white/10" />
                <div className="text-xs text-zinc-500 font-mono">
                    {powerups.filter((p) => discoveredIds.has(p.id)).length} / {powerups.length}
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {powerups.map((powerup) => (
                    <CollectibleCard
                        key={powerup.id}
                        powerup={powerup}
                        isDiscovered={discoveredIds.has(powerup.id)}
                        count={ownedCounts.get(powerup.id) || 0}
                        isCurse={isCurse}
                    />
                ))}
            </div>
        </div>
    );
}

export default async function InventoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

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

    // Create maps
    const ownedCounts = new Map<string, number>();
    const activeCounts = new Map<string, number>();

    teamPowerups.forEach((tp) => {
        ownedCounts.set(tp.powerupId, (ownedCounts.get(tp.powerupId) || 0) + 1);
        if (!tp.isConsumed) {
            activeCounts.set(tp.powerupId, (activeCounts.get(tp.powerupId) || 0) + 1);
        }
    });

    const discoveredIds = new Set(teamPowerups.map((tp) => tp.powerupId));

    // Separate into Boosts and Curses
    const boosts = allPowerups.filter((p) => p.scope !== "opponent");
    const curses = allPowerups.filter((p) => p.scope === "opponent");

    // Stats
    const totalPowerups = allPowerups.length;
    const discoveredCount = discoveredIds.size;
    const activeTotal = Array.from(activeCounts.values()).reduce((a, b) => a + b, 0);
    const boostsDiscovered = boosts.filter(p => discoveredIds.has(p.id)).length;
    const cursesDiscovered = curses.filter(p => discoveredIds.has(p.id)).length;

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
                        {RARITY_ORDER.map((rarity) => (
                            <RaritySection
                                key={`boost-${rarity}`}
                                rarity={rarity}
                                powerups={boosts.filter((p) => p.rarity === rarity)}
                                discoveredIds={discoveredIds}
                                ownedCounts={ownedCounts}
                                isCurse={false}
                            />
                        ))}
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
                        {RARITY_ORDER.map((rarity) => (
                            <RaritySection
                                key={`curse-${rarity}`}
                                rarity={rarity}
                                powerups={curses.filter((p) => p.rarity === rarity)}
                                discoveredIds={discoveredIds}
                                ownedCounts={ownedCounts}
                                isCurse={true}
                            />
                        ))}
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
