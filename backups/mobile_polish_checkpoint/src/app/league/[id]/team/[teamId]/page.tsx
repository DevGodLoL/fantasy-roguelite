import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addPlayerToRoster, dropPlayer } from "../actions";
import RosterManager from "./RosterManager";

// Rarity color configurations
const RARITY_CONFIG = {
    common: {
        bg: "from-zinc-700/30 to-zinc-800/40",
        border: "border-zinc-600/30",
        text: "text-zinc-400",
        glow: "",
        badge: "bg-zinc-700/50 text-zinc-300",
    },
    rare: {
        bg: "from-blue-700/20 to-blue-900/30",
        border: "border-blue-500/30",
        text: "text-blue-400",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
        badge: "bg-blue-500/20 text-blue-300",
    },
    epic: {
        bg: "from-purple-700/20 to-purple-900/30",
        border: "border-purple-500/30",
        text: "text-purple-400",
        glow: "shadow-[0_0_20px_rgba(147,51,234,0.15)]",
        badge: "bg-purple-500/20 text-purple-300",
    },
    legendary: {
        bg: "from-amber-600/20 to-amber-900/30",
        border: "border-amber-500/40",
        text: "text-amber-400",
        glow: "shadow-[0_0_25px_rgba(251,191,36,0.2)]",
        badge: "bg-amber-500/20 text-amber-300",
    },
};

function getRarityIcon(rarity: string) {
    switch (rarity.toLowerCase()) {
        case "legendary": return "👑";
        case "epic": return "💎";
        case "rare": return "⚔️";
        default: return "📜";
    }
}

export default async function TeamPage({
    params,
}: {
    params: Promise<{ id: string; teamId: string }>;
}) {
    const { id: leagueId, teamId } = await params;

    const team = await db.team.findUnique({
        where: { id: teamId },
        include: {
            owner: true,
            league: {
                include: {
                    draft: true,
                    weeks: {
                        include: {
                            matchups: {
                                where: {
                                    OR: [
                                        { homeTeamId: teamId },
                                        { awayTeamId: teamId },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            rosterSlots: {
                include: { player: true },
            },
            powerups: {
                where: { isConsumed: false },
                include: { powerup: true },
            },
        },
    });

    if (!team || team.leagueId !== leagueId) {
        notFound();
    }

    // Calculate real season record
    let wins = 0, losses = 0, ties = 0;
    let currentStreak = 0;
    let streakType: 'W' | 'L' | null = null;
    const matchResults: ('W' | 'L' | 'T')[] = [];

    team.league.weeks.forEach(week => {
        week.matchups.forEach(m => {
            if (m.status === 'final') {
                const isHome = m.homeTeamId === teamId;
                const teamScore = isHome ? m.homeScore : m.awayScore;
                const oppScore = isHome ? m.awayScore : m.homeScore;

                if (teamScore > oppScore) {
                    wins++;
                    matchResults.push('W');
                } else if (teamScore < oppScore) {
                    losses++;
                    matchResults.push('L');
                } else {
                    ties++;
                    matchResults.push('T');
                }
            }
        });
    });

    // Calculate streak from most recent
    for (let i = matchResults.length - 1; i >= 0; i--) {
        if (matchResults[i] === 'T') break;
        if (streakType === null) {
            streakType = matchResults[i] as 'W' | 'L';
            currentStreak = 1;
        } else if (matchResults[i] === streakType) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Sort roster slots by standard fantasy order
    const sortOrder: Record<string, number> = {
        QB: 1, RB: 2, WR: 3, TE: 4, FLEX: 5, DST: 6, K: 7, BENCH: 8
    };

    const sortedRoster = [...team.rosterSlots].sort((a, b) => {
        const aScore = (a.isStarter ? 0 : 100) + (sortOrder[a.slotType] || 99);
        const bScore = (b.isStarter ? 0 : 100) + (sortOrder[b.slotType] || 99);
        return aScore - bScore;
    });

    const starterCount = sortedRoster.filter(s => s.isStarter && s.player).length;
    const benchCount = sortedRoster.filter(s => !s.isStarter && s.player).length;
    const totalPowerups = team.powerups.length;

    const draftStatus = team.league.draft?.status || "pre_draft";

    // Get available players (not currently on any team in this league)
    const rosteredPlayerIds = await db.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const availablePlayers = await db.player.findMany({
        where: { id: { notIn: rosteredPlayerIds } },
        orderBy: { name: "asc" },
        take: 50,
    });

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-purple-900/8 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] bg-blue-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-[60%] left-[60%] w-[25%] h-[25%] bg-amber-900/6 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12 space-y-10">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* HERO HEADER */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <header className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/10 to-purple-500/5 rounded-3xl blur-3xl -z-10" />

                    <div className="p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            {/* Team Identity */}
                            <div className="space-y-3">
                                <Link
                                    href={`/league/${leagueId}`}
                                    className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                                >
                                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                    Return to Command
                                </Link>

                                <div className="flex items-center gap-4">
                                    {/* Team Avatar */}
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                                        {team.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                                            {team.name}
                                        </h1>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            Commander: <span className="text-purple-400 font-bold">{team.owner.displayName || team.owner.email}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-4">
                                {/* Record */}
                                <div className="px-6 py-4 bg-gradient-to-br from-zinc-800/50 to-zinc-900/80 border border-zinc-700/50 rounded-2xl text-center min-w-[100px]">
                                    <div className="text-2xl font-black text-white">
                                        {wins}-{losses}{ties > 0 ? `-${ties}` : ''}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Record</div>
                                </div>

                                {/* Streak */}
                                <div className={`px-6 py-4 border rounded-2xl text-center min-w-[100px] ${streakType === 'W'
                                    ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-950/50 border-emerald-500/30'
                                    : streakType === 'L'
                                        ? 'bg-gradient-to-br from-red-900/30 to-red-950/50 border-red-500/30'
                                        : 'bg-gradient-to-br from-zinc-800/50 to-zinc-900/80 border-zinc-700/50'
                                    }`}>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-xl">
                                            {streakType === 'W' ? '🔥' : streakType === 'L' ? '💀' : '—'}
                                        </span>
                                        <span className={`text-2xl font-black ${streakType === 'W' ? 'text-emerald-400' : streakType === 'L' ? 'text-red-400' : 'text-zinc-500'
                                            }`}>
                                            {currentStreak > 0 ? `${streakType}${currentStreak}` : '—'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Streak</div>
                                </div>

                                {/* Army Size */}
                                <div className="px-6 py-4 bg-gradient-to-br from-blue-900/20 to-blue-950/40 border border-blue-500/20 rounded-2xl text-center min-w-[100px]">
                                    <div className="text-2xl font-black text-blue-400">{starterCount + benchCount}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Warriors</div>
                                </div>

                                {/* Artifacts */}
                                <div className="px-6 py-4 bg-gradient-to-br from-amber-900/20 to-amber-950/40 border border-amber-500/20 rounded-2xl text-center min-w-[100px]">
                                    <div className="text-2xl font-black text-amber-400">{totalPowerups}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Artifacts</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {draftStatus !== "completed" ? (
                    /* ═══════════════════════════════════════════════════════════════ */
                    /* DRAFT IN PROGRESS STATE */
                    /* ═══════════════════════════════════════════════════════════════ */
                    <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 p-12 rounded-3xl text-center space-y-6 shadow-[0_0_50px_rgba(147,51,234,0.1)]">
                        <div className="text-6xl animate-pulse">⚔️</div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            The Draft Ritual Continues
                        </h2>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Your army is being assembled in the Draft Chamber. Once the ritual is complete, you can command your warriors and seek reinforcements.
                        </p>
                        <Link
                            href={`/league/${leagueId}/draft`}
                            className="inline-flex px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(147,51,234,0.4)]"
                        >
                            Enter Draft Chamber →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* ACTIVE ARTIFACTS */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <section className="space-y-4">
                            <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                                <div className="text-xl sm:text-2xl">✨</div>
                                <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-400">
                                    Enchanted Artifacts
                                </h2>
                                <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                                <Link
                                    href={`/league/${leagueId}/inventory`}
                                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-400 transition-colors ml-auto sm:ml-0"
                                >
                                    View Armory →
                                </Link>
                            </div>

                            {team.powerups.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {team.powerups.slice(0, 8).map((tp) => {
                                        const config = RARITY_CONFIG[tp.powerup.rarity.toLowerCase() as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;

                                        return (
                                            <div
                                                key={tp.id}
                                                className={`
                                                    relative group overflow-hidden p-5 rounded-2xl border transition-all
                                                    bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
                                                    hover:scale-[1.02] hover:border-opacity-100
                                                `}
                                            >
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
                                                            {tp.powerup.rarity}
                                                        </span>
                                                        <span className="text-lg">{getRarityIcon(tp.powerup.rarity)}</span>
                                                    </div>
                                                    <h3 className="font-bold text-white text-lg leading-tight mb-1">
                                                        {tp.powerup.name}
                                                    </h3>
                                                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                                                        {tp.powerup.description}
                                                    </p>
                                                </div>

                                                {/* Shine effect on hover */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
                                    <div className="text-4xl mb-3 opacity-40">📦</div>
                                    <p className="text-zinc-600 italic text-sm">
                                        No artifacts equipped. Visit the <Link href={`/league/${leagueId}/inventory`} className="text-amber-500 hover:underline">Artifact Armory</Link> to gain advantages.
                                    </p>
                                </div>
                            )}
                        </section>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* ═══════════════════════════════════════════════════════════════ */}
                            {/* BATTLE FORMATION (ROSTER) */}
                            {/* ═══════════════════════════════════════════════════════════════ */}
                            <section className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">⚔️</div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                                        Battle Formation
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 uppercase tracking-wide font-bold">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" /> {starterCount} Starters
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-zinc-600" /> {benchCount} Bench
                                        </span>
                                    </div>
                                </div>

                                <RosterManager
                                    leagueId={leagueId}
                                    teamId={teamId}
                                    slots={sortedRoster}
                                />
                            </section>

                            {/* ═══════════════════════════════════════════════════════════════ */}
                            {/* WAIVER WIRE SIDEBAR */}
                            {/* ═══════════════════════════════════════════════════════════════ */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">🔮</div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
                                        Mercenary Camp
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
                                </div>

                                <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
                                    <div className="max-h-[600px] overflow-y-auto">
                                        {availablePlayers.length > 0 ? (
                                            <div className="divide-y divide-white/5">
                                                {availablePlayers.slice(0, 20).map((player) => {
                                                    const emptySlot = team.rosterSlots.find(s =>
                                                        !s.playerId && (s.slotType === player.position || s.slotType === "FLEX" || s.slotType === "BENCH")
                                                    );

                                                    return (
                                                        <div
                                                            key={player.id}
                                                            className="p-4 hover:bg-white/5 transition-all group flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {/* Position Badge */}
                                                                <div className={`
                                                                    w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black
                                                                    ${player.position === 'QB' ? 'bg-red-500/20 text-red-400' :
                                                                        player.position === 'RB' ? 'bg-blue-500/20 text-blue-400' :
                                                                            player.position === 'WR' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                                player.position === 'TE' ? 'bg-amber-500/20 text-amber-400' :
                                                                                    player.position === 'K' ? 'bg-purple-500/20 text-purple-400' :
                                                                                        'bg-zinc-700/50 text-zinc-400'}
                                                                `}>
                                                                    {player.position}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                                        {player.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                                                        {player.teamAbbr || 'FA'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {emptySlot && (
                                                                <form action={async () => {
                                                                    "use server";
                                                                    await addPlayerToRoster(leagueId, teamId, emptySlot.id, player.id);
                                                                }}>
                                                                    <button className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-all border border-emerald-500/30 hover:border-emerald-500/50">
                                                                        Recruit
                                                                    </button>
                                                                </form>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="text-4xl mb-3 opacity-40">🏜️</div>
                                                <p className="text-zinc-600 italic text-sm">
                                                    The mercenary camp is empty.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {availablePlayers.length > 20 && (
                                        <div className="p-3 border-t border-white/5 text-center">
                                            <Link
                                                href={`/league/${leagueId}/waivers`}
                                                className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
                                            >
                                                View All Free Agents →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
