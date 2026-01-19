import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { simulateWeek } from "./actions";
import LineupManager from "./LineupManager";
import PackOpening from "./PackOpening";
import BattleRecap from "./BattleRecap";
import MissionsPanel from "./MissionsPanel";
import { selectMissionsForWeek } from "@/lib/game-data/missions";

const USER_TEAM_NAME = "The DevGods";

export default async function WeekPage({
    params,
}: {
    params: Promise<{ id: string; weekNumber: string }>;
}) {
    const { id: leagueId, weekNumber } = await params;
    const weekNum = parseInt(weekNumber, 10);

    const league = await db.league.findUnique({
        where: { id: leagueId },
    });

    if (!league) {
        notFound();
    }

    const week = await db.week.findUnique({
        where: { leagueId_number: { leagueId, number: weekNum } },
        include: {
            matchups: {
                include: {
                    homeTeam: {
                        include: {
                            rosterSlots: {
                                include: {
                                    player: {
                                        include: {
                                            performances: true,
                                        },
                                    },
                                },
                                orderBy: { slotType: "asc" },
                            },
                        },
                    },
                    awayTeam: {
                        include: {
                            rosterSlots: {
                                include: {
                                    player: {
                                        include: {
                                            performances: true,
                                        },
                                    },
                                },
                                orderBy: { slotType: "asc" },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!week) {
        notFound();
    }

    // Find user's matchup
    const userMatchup = week.matchups.find(
        (m) =>
            m.homeTeam.name === USER_TEAM_NAME ||
            m.awayTeam.name === USER_TEAM_NAME
    );

    const isUserHome = userMatchup?.homeTeam.name === USER_TEAM_NAME;
    const userTeam = isUserHome ? userMatchup?.homeTeam : userMatchup?.awayTeam;
    const oppTeam = isUserHome ? userMatchup?.awayTeam : userMatchup?.homeTeam;
    const userScore = isUserHome ? userMatchup?.homeScore : userMatchup?.awayScore;
    const oppScore = isUserHome ? userMatchup?.awayScore : userMatchup?.homeScore;

    // Get all weeks to show navigation
    const allWeeks = await db.week.findMany({
        where: { leagueId },
        orderBy: { number: "asc" },
        include: {
            matchups: {
                where: {
                    OR: [
                        { homeTeam: { id: userTeam?.id } },
                        { awayTeam: { id: userTeam?.id } },
                    ],
                },
            },
        },
    });

    // --- POWERUP LOGIC ---
    let activePowerup = null;
    let powerupOffers: any[] = [];
    let allOffers: any[] = []; // All offers including chosen (for recap)
    let userRerolls = 0; // Track rerolls for pack opening

    // Helper to generate offers if needed
    const generateOffersIfNeeded = async (teamId: string, weekId: string) => {
        // Check if offers exist
        const existing = await db.teamPowerupOffer.findMany({
            where: { teamId, weekId },
            include: { powerup: true }
        });

        if (existing.length > 0) return existing;

        // No offers exist - generate new ones
        const allPowerups = await db.powerup.findMany({ where: { type: 'card' } });

        // Select 4 powerups with rarity weighting
        const selectRarity = () => {
            const r = Math.random();
            if (r < 0.7) return "common";
            if (r < 0.9) return "rare";
            if (r < 0.99) return "epic";
            return "legendary";
        };

        const selected: typeof allPowerups = [];
        while (selected.length < 4 && selected.length < allPowerups.length) {
            const targetRarity = selectRarity();
            const candidates = allPowerups.filter(
                p => p.rarity === targetRarity && !selected.find(s => s.id === p.id)
            );
            if (candidates.length > 0) {
                selected.push(candidates[Math.floor(Math.random() * candidates.length)]);
            } else {
                // Fallback to any unselected
                const any = allPowerups.filter(p => !selected.find(s => s.id === p.id));
                if (any.length > 0) {
                    selected.push(any[Math.floor(Math.random() * any.length)]);
                }
            }
        }

        // Create offers
        if (selected.length > 0) {
            await db.teamPowerupOffer.createMany({
                data: selected.map(p => ({
                    teamId,
                    weekId,
                    powerupId: p.id,
                    isChosen: false
                }))
            });
        }

        return await db.teamPowerupOffer.findMany({
            where: { teamId, weekId },
            include: { powerup: true }
        });
    };

    if (userTeam) {
        // Fetch team's reroll count
        const teamData = await db.team.findUnique({
            where: { id: userTeam.id },
            select: { rerolls: true }
        });
        userRerolls = teamData?.rerolls ?? 0;

        // Check for active powerup
        const tp = await db.teamPowerup.findFirst({
            where: { teamId: userTeam.id, weekId: week.id },
            include: { powerup: true }
        });
        if (tp) activePowerup = tp;

        // Check matchup status to determine if we need offers
        const matchupStatus = userMatchup?.status;
        const isFinalCheck = matchupStatus === 'final';

        // Auto-generate offers on page load if none exist and week is not final
        if (!tp && !isFinalCheck) {
            allOffers = await generateOffersIfNeeded(userTeam.id, week.id);
        } else {
            // Fetch existing offers for recap
            allOffers = await db.teamPowerupOffer.findMany({
                where: { teamId: userTeam.id, weekId: week.id },
                include: { powerup: true }
            });
        }

        // Filter to unchosen offers for pack opening display
        if (!tp) {
            powerupOffers = allOffers.filter(o => !o.isChosen);
        }
    }

    // Fetch opponent's powerup (only show after battle is final)
    let opponentPowerup = null;
    if (oppTeam && userMatchup?.status === 'final') {
        const oppTp = await db.teamPowerup.findFirst({
            where: { teamId: oppTeam.id, weekId: week.id },
            include: { powerup: true }
        });
        if (oppTp) opponentPowerup = oppTp;
    }

    // --- WEEKLY MISSIONS ---
    let userMissions: any[] = [];
    if (userTeam) {
        // Check if missions exist for this week
        const existingMissions = await db.teamMission.findMany({
            where: { teamId: userTeam.id, weekId: week.id }
        });

        if (existingMissions.length === 0 && userMatchup?.status !== 'final') {
            // Generate new missions for this week
            const missionTemplates = selectMissionsForWeek(3);

            await db.teamMission.createMany({
                data: missionTemplates.map(m => ({
                    teamId: userTeam.id,
                    weekId: week.id,
                    code: m.code,
                    name: m.name,
                    description: m.description,
                    type: m.type,
                    targetPosition: m.targetPosition || null,
                    targetValue: m.targetValue,
                    rewardType: m.rewardType,
                    rewardValue: m.rewardValue,
                    progress: 0,
                    isCompleted: false
                }))
            });

            // Fetch the newly created missions
            userMissions = await db.teamMission.findMany({
                where: { teamId: userTeam.id, weekId: week.id }
            });
        } else {
            userMissions = existingMissions;
        }
    }

    // Organize roster into starters and bench
    const getOrganizedRoster = (
        slots: {
            id: string;
            slotType: string;
            player: {
                id: string;
                name: string;
                teamAbbr: string | null;
                position: string;
                performances: { points: number; weekId: string }[];
            } | null;
        }[]
    ) => {
        const mappedSlots = slots.map(s => ({
            ...s,
            player: s.player ? {
                ...s.player,
                points: s.player.performances.find((p) => p.weekId === week.id)?.points
            } : null
        }));

        const starters = mappedSlots.filter((s) => s.slotType !== "BENCH");
        const bench = mappedSlots.filter((s) => s.slotType === "BENCH");
        return { starters, bench };
    };

    const userRoster = userTeam ? getOrganizedRoster(userTeam.rosterSlots) : null;
    const oppRoster = oppTeam ? getOrganizedRoster(oppTeam.rosterSlots) : null;

    const isLive = userMatchup?.status === "live";
    const isFinal = userMatchup?.status === "final";
    const isScheduled = userMatchup?.status === "scheduled";

    // Win/Loss display logic
    const userWon = isFinal && (userScore || 0) > (oppScore || 0);
    const userLost = isFinal && (userScore || 0) < (oppScore || 0);
    const isTie = isFinal && (userScore || 0) === (oppScore || 0) && userScore !== null;

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-purple-900/8 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] bg-blue-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STICKY HEADER - BATTLE COMMAND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Command
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="text-xl hidden sm:inline">⚔️</span>
                            <h1 className="font-black uppercase tracking-tighter text-lg sm:text-xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                Floor {weekNum}{userMatchup?.round && <span className="text-zinc-500"> • {userMatchup.round.replace('_', ' ').toUpperCase()}</span>}
                            </h1>
                            <span
                                className={`text-[9px] font-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-widest border w-fit ${isFinal
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : isLive
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                                        : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                                    }`}
                            >
                                {isFinal ? "Conquered" : isLive ? "In Battle" : "Approaching"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Week Navigation */}
                        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                            {allWeeks.slice(0, 14).map((w) => (
                                <Link
                                    key={w.id}
                                    href={`/league/${leagueId}/week/${w.number}`}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${w.number === weekNum
                                        ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]"
                                        : w.matchups[0]?.status === "final"
                                            ? "bg-zinc-800/50 text-zinc-400 hover:text-white"
                                            : "text-zinc-600 hover:text-zinc-300"
                                        }`}
                                >
                                    {w.number}
                                </Link>
                            ))}
                        </div>

                        {/* Simulate Button */}
                        {isScheduled && (
                            <form
                                action={async () => {
                                    "use server";
                                    await simulateWeek(leagueId, weekNum);
                                }}
                            >
                                <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    ⚡ Resolve Battle
                                </button>
                            </form>
                        )}

                        {isFinal && weekNum < allWeeks.length && (
                            <Link
                                href={`/league/${leagueId}/week/${weekNum + 1}`}
                                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                Next Floor →
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12 space-y-10">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BATTLE RESULT / POWERUP SECTION */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <section className="space-y-6">
                    {userTeam && (
                        <>
                            {/* 1. Show Active Powerup */}
                            {activePowerup && (
                                <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(147,51,234,0.1)] relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                                            ✨
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-purple-400 tracking-[.2em] mb-1">Enchanted Artifact Active</div>
                                            <h3 className="text-2xl font-black text-white">{activePowerup.powerup.name}</h3>
                                            <p className="text-sm text-zinc-400 max-w-xl">{activePowerup.powerup.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest text-right w-full">Current State</div>
                                        <div className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${activePowerup.isConsumed
                                            ? "bg-zinc-800 text-zinc-500 border-zinc-700"
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                                            }`}>
                                            {activePowerup.isConsumed ? "Energy Depleted" : "Empowerment Active"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Show Pack Opening if offers exist (Only if NOT final) */}
                            {!isFinal && !activePowerup && powerupOffers.length > 0 && (
                                <PackOpening
                                    leagueId={leagueId}
                                    teamId={userTeam.id}
                                    weekId={week.id}
                                    weekNumber={weekNum}
                                    offers={powerupOffers}
                                    rerolls={userRerolls}
                                />
                            )}
                        </>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* WEEKLY MISSIONS - Side panel or below depending on state */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {userTeam && userMissions.length > 0 && (
                        <div className="mb-6">
                            <MissionsPanel missions={userMissions} isFinal={isFinal} />
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* BATTLE ARENA (VERSUS) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {userMatchup && userTeam && oppTeam && (
                        <div className="relative">
                            {/* VS Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 blur-3xl -z-10" />

                            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-10 relative overflow-hidden">
                                {/* Result Badge */}
                                {isFinal && (
                                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg z-20 ${userWon ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                                        userLost ? "bg-red-500 text-white shadow-red-500/20" :
                                            "bg-zinc-700 text-white"
                                        }`}>
                                        {userWon ? "👑 VICTORY" : userLost ? "💀 DEFEAT" : "⚖️ STALEMATE"}
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                                    {/* User Team Hand */}
                                    <div className={`flex-1 flex flex-col items-center gap-3 transition-all duration-500 ${userLost ? 'grayscale opacity-50 contrast-75' : ''}`}>
                                        <div className="relative">
                                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-[0_0_30px_rgba(147,51,234,0.3)] border-2 border-white/10`}>
                                                {userTeam.name.charAt(0)}
                                            </div>
                                            {userWon && <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Your Legion</div>
                                            <h2 className="text-lg sm:text-xl font-black tracking-tight">{userTeam.name}</h2>
                                        </div>
                                        <div className={`text-4xl sm:text-5xl font-black tracking-tighter transition-all ${userWon ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-zinc-200'}`}>
                                            {(userScore || 0).toFixed(1)}
                                        </div>

                                        {/* User Artifact Badge */}
                                        {activePowerup ? (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${activePowerup.powerup.rarity === 'legendary'
                                                ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                                : activePowerup.powerup.rarity === 'epic'
                                                    ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                    : activePowerup.powerup.rarity === 'rare'
                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                        : 'bg-zinc-800/50 border-zinc-700'
                                                }`}>
                                                <span className="text-lg">✨</span>
                                                <div className="text-left">
                                                    <div className={`text-xs font-bold ${activePowerup.powerup.rarity === 'legendary' ? 'text-amber-400'
                                                        : activePowerup.powerup.rarity === 'epic' ? 'text-purple-400'
                                                            : activePowerup.powerup.rarity === 'rare' ? 'text-blue-400'
                                                                : 'text-zinc-400'
                                                        }`}>
                                                        {activePowerup.powerup.name}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500">
                                                        {activePowerup.powerup.kind === 'multiplier'
                                                            ? `${activePowerup.powerup.value}x multiplier`
                                                            : `+${activePowerup.powerup.value} pts`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 opacity-50">
                                                <span className="text-lg opacity-30">📦</span>
                                                <span className="text-xs text-zinc-600">No artifact</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* VS Splatter */}
                                    <div className="relative shrink-0 py-2 sm:py-4">
                                        <div className="text-xl sm:text-3xl font-black text-zinc-700 italic select-none">VS</div>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-0.5 h-16 sm:h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent rotate-12" />
                                        </div>
                                    </div>

                                    {/* Opponent Team Hand */}
                                    <div className={`flex-1 flex flex-col items-center gap-3 transition-all duration-500 ${userWon ? 'grayscale opacity-50 contrast-75' : ''}`}>
                                        <div className="relative">
                                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 flex items-center justify-center text-2xl sm:text-3xl font-black border-2 border-white/5 shadow-inner`}>
                                                {oppTeam.name.charAt(0)}
                                            </div>
                                            {userLost && <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">The Enemy</div>
                                            <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-300">{oppTeam.name}</h2>
                                        </div>
                                        <div className={`text-4xl sm:text-5xl font-black tracking-tighter transition-all ${userLost ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]' : 'text-zinc-600'}`}>
                                            {(oppScore || 0).toFixed(1)}
                                        </div>

                                        {/* Opponent Artifact Badge - Revealed after battle */}
                                        {isFinal && opponentPowerup ? (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${opponentPowerup.powerup.rarity === 'legendary'
                                                ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                                                : opponentPowerup.powerup.rarity === 'epic'
                                                    ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                    : opponentPowerup.powerup.rarity === 'rare'
                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                        : 'bg-zinc-800/50 border-zinc-700'
                                                }`}>
                                                <span className="text-lg">⚔️</span>
                                                <div className="text-left">
                                                    <div className={`text-xs font-bold ${opponentPowerup.powerup.rarity === 'legendary' ? 'text-amber-400'
                                                        : opponentPowerup.powerup.rarity === 'epic' ? 'text-purple-400'
                                                            : opponentPowerup.powerup.rarity === 'rare' ? 'text-blue-400'
                                                                : 'text-zinc-400'
                                                        }`}>
                                                        {opponentPowerup.powerup.name}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500">
                                                        {opponentPowerup.powerup.kind === 'multiplier'
                                                            ? `${opponentPowerup.powerup.value}x multiplier`
                                                            : opponentPowerup.powerup.scope === 'opponent'
                                                                ? `-${opponentPowerup.powerup.value} pts curse`
                                                                : `+${opponentPowerup.powerup.value} pts`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isFinal ? (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 opacity-50">
                                                <span className="text-lg opacity-30">📦</span>
                                                <span className="text-xs text-zinc-600">No artifact</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50 opacity-50">
                                                <span className="text-lg opacity-30">❓</span>
                                                <span className="text-xs text-zinc-600">Unknown</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* BATTLE RECAP (Post-Battle Analysis) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {isFinal && userTeam && oppTeam && (
                        <BattleRecap
                            userScore={userScore || 0}
                            oppScore={oppScore || 0}
                            userTeamName={userTeam.name}
                            oppTeamName={oppTeam.name}
                            activePowerup={activePowerup}
                            allOffers={allOffers}
                        />
                    )}
                </section>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BATTLE FORMATIONS (LINEUPS) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* User Roster */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl">⚔️</div>
                            <h2 className="text-xs font-black uppercase tracking-[.3em] text-emerald-400">
                                Your War Formation
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
                        </div>

                        {userRoster && (
                            <LineupManager
                                leagueId={leagueId}
                                weekNumber={weekNum}
                                starters={userRoster.starters}
                                bench={userRoster.bench}
                                isFinal={isFinal}
                                title={userTeam?.name}
                            />
                        )}
                    </div>

                    {/* Opponent Roster */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl">🛡️</div>
                            <h2 className="text-xs font-black uppercase tracking-[.3em] text-red-400">
                                Opponent Defenses
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
                        </div>

                        {oppRoster && (
                            <LineupManager
                                leagueId={leagueId}
                                weekNumber={weekNum}
                                starters={oppRoster.starters}
                                bench={oppRoster.bench}
                                isFinal={isFinal}
                                readOnly={true}
                                title={oppTeam?.name}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
