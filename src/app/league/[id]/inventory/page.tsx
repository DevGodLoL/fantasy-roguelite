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
}: {
    powerup: Powerup;
    isDiscovered: boolean;
    count?: number;
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
                        border-2 border-zinc-700/50
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
                        <div className="text-[10px] uppercase text-white/40 font-mono">
                            {powerup.scope === "opponent" ? "⚔️ Curse" : "🛡️ Buff"}
                        </div>
                        {powerup.value && (
                            <div className={`text-sm font-black ${config.textColor}`}>
                                {powerup.kind === "multiplier"
                                    ? `${powerup.value}x`
                                    : `+${powerup.value}`}
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

    // Fetch ALL powerups in the game
    const allPowerups = await db.powerup.findMany({
        orderBy: { code: "asc" },
    });

    // Fetch team's discovered powerups (both active and consumed)
    const teamPowerups = await db.teamPowerup.findMany({
        where: { teamId: userTeam.id },
        include: {
            powerup: true,
            week: true,
        },
    });

    // Create a map of powerupId -> count owned
    const ownedCounts = new Map<string, number>();
    const activeCounts = new Map<string, number>();

    teamPowerups.forEach((tp) => {
        ownedCounts.set(tp.powerupId, (ownedCounts.get(tp.powerupId) || 0) + 1);
        if (!tp.isConsumed) {
            activeCounts.set(tp.powerupId, (activeCounts.get(tp.powerupId) || 0) + 1);
        }
    });

    // Set of discovered powerup IDs
    const discoveredIds = new Set(teamPowerups.map((tp) => tp.powerupId));

    // Group powerups by rarity
    const groupedPowerups = RARITY_ORDER.map((rarity) => ({
        rarity,
        config: RARITY_CONFIG[rarity],
        powerups: allPowerups.filter((p) => p.rarity === rarity),
    }));

    // Stats
    const totalPowerups = allPowerups.length;
    const discoveredCount = discoveredIds.size;
    const activeTotal = Array.from(activeCounts.values()).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-amber-500/30">
            {/* Animated background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-amber-900/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-purple-900/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[60%] left-[50%] w-[25%] h-[25%] bg-blue-900/5 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
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
                    <h1 className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Artifact Collection
                    </h1>
                </div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-16">
                {/* Hero Stats */}
                <section className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
                    <div className="relative grid md:grid-cols-4 gap-6">
                        {/* Collection Progress */}
                        <div className="md:col-span-2 p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                            <div className="text-xs text-zinc-500 uppercase font-black tracking-[0.3em] mb-4">
                                Collection Progress
                            </div>
                            <div className="flex items-end gap-4 mb-4">
                                <div className="text-6xl font-black bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                                    {discoveredCount}
                                </div>
                                <div className="text-2xl text-zinc-600 font-black mb-2">/ {totalPowerups}</div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(discoveredCount / totalPowerups) * 100}%` }}
                                />
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                                {Math.round((discoveredCount / totalPowerups) * 100)}% of all artifacts discovered
                            </div>
                        </div>

                        {/* Active Artifacts */}
                        <div className="p-8 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-3xl">
                            <div className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.3em] mb-4">
                                Active
                            </div>
                            <div className="text-5xl font-black text-emerald-400">{activeTotal}</div>
                            <div className="text-xs text-zinc-500 mt-2">Ready to deploy</div>
                        </div>

                        {/* Total Collected */}
                        <div className="p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                            <div className="text-xs text-zinc-500 uppercase font-black tracking-[0.3em] mb-4">
                                Total Acquired
                            </div>
                            <div className="text-5xl font-black text-white">{teamPowerups.length}</div>
                            <div className="text-xs text-zinc-500 mt-2">All time</div>
                        </div>
                    </div>
                </section>

                {/* Rarity breakdown stats */}
                <section className="grid grid-cols-4 gap-4">
                    {RARITY_ORDER.map((rarity) => {
                        const config = RARITY_CONFIG[rarity];
                        const total = allPowerups.filter((p) => p.rarity === rarity).length;
                        const discovered = allPowerups.filter(
                            (p) => p.rarity === rarity && discoveredIds.has(p.id)
                        ).length;

                        return (
                            <div
                                key={rarity}
                                className={`p-4 rounded-2xl border ${config.border} ${config.bgCard}`}
                            >
                                <div className={`text-[10px] uppercase font-black tracking-[0.2em] ${config.textColor} mb-2`}>
                                    {config.icon} {config.label}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-black ${config.textColor}`}>{discovered}</span>
                                    <span className="text-sm text-zinc-600">/ {total}</span>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Collection Grid by Rarity */}
                {groupedPowerups.map(({ rarity, config, powerups }) => (
                    <section key={rarity} className="space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-4">
                            <div
                                className={`
                                    px-4 py-2 rounded-xl
                                    bg-gradient-to-r ${config.gradient}
                                    text-black font-black text-sm uppercase tracking-widest
                                `}
                            >
                                {config.icon} {config.label}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                            <div className="text-xs text-zinc-500 font-mono">
                                {powerups.filter((p) => discoveredIds.has(p.id)).length} / {powerups.length}
                            </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {powerups.map((powerup) => (
                                <CollectibleCard
                                    key={powerup.id}
                                    powerup={powerup}
                                    isDiscovered={discoveredIds.has(powerup.id)}
                                    count={ownedCounts.get(powerup.id) || 0}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {/* Empty state if no powerups */}
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
