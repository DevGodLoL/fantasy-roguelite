import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { simulateWeek } from "./actions";
import LineupManager from "./LineupManager";
import PackOpening from "./PackOpening";
import OpenPackButton from "./OpenPackButton";

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
                                orderBy: { slotType: "asc" }, // This is usually overridden by client sorting
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

    if (userTeam) {
        // Check for active powerup
        const tp = await db.teamPowerup.findUnique({
            where: { teamId_weekId: { teamId: userTeam.id, weekId: week.id } },
            include: { powerup: true }
        });
        if (tp) activePowerup = tp;

        // Check for offers if no active powerup
        if (!tp) {
            powerupOffers = await db.teamPowerupOffer.findMany({
                where: { teamId: userTeam.id, weekId: week.id, isChosen: false },
                include: { powerup: true }
            });
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

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans">
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/league/${leagueId}/schedule`}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        ← Schedule
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <h1 className="font-black uppercase tracking-tighter text-xl">
                        Week {weekNum}
                    </h1>
                    <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${isFinal
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isLive
                                ? "bg-yellow-500/20 text-yellow-400 animate-pulse"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                    >
                        {isFinal ? "FINAL" : isLive ? "LIVE" : "SCHEDULED"}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Week Navigation */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 rounded-full p-1">
                        {allWeeks.slice(0, 18).map((w) => (
                            <Link
                                key={w.id}
                                href={`/league/${leagueId}/week/${w.number}`}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${w.number === weekNum
                                    ? "bg-blue-600 text-white"
                                    : w.matchups[0]?.status === "final"
                                        ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                        : "text-zinc-500 hover:text-white"
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
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full transition-all">
                                ⚡ Simulate Week
                            </button>
                        </form>
                    )}

                    {isFinal && weekNum < allWeeks.length && (
                        <Link
                            href={`/league/${leagueId}/week/${weekNum + 1}`}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full transition-all"
                        >
                            Next Week →
                        </Link>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {/* ROGUELITE SECTION */}
                {userTeam && (
                    <>
                        {/* 1. Show Active Powerup if exists (Always show, even if final) */}
                        {activePowerup && (
                            <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/50">
                                        ⚡
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Active Artifact</div>
                                        <div className="text-xl font-bold">{activePowerup.powerup.name}</div>
                                        <div className="text-sm text-blue-200/60">{activePowerup.powerup.description}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-white/30">Status</div>
                                    <div className={`text-sm font-bold ${activePowerup.isConsumed ? "text-zinc-500" : "text-emerald-400"}`}>
                                        {activePowerup.isConsumed ? "CONSUMED" : "READY"}
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
                            />
                        )}

                        {/* 3. Show Open Button if nothing active and no offers (Only if NOT final) */}
                        {!isFinal && !activePowerup && powerupOffers.length === 0 && (
                            <OpenPackButton
                                leagueId={leagueId}
                                teamId={userTeam.id}
                                weekId={week.id}
                            />
                        )}
                    </>
                )}

                {/* Matchup Header */}
                {userMatchup && userTeam && oppTeam && (
                    <div className="mb-8">
                        {/* Score Banner */}
                        <div className="bg-gradient-to-r from-emerald-500/10 via-zinc-900/80 to-blue-500/10 rounded-3xl p-8 border border-white/5">
                            <div className="flex items-center justify-between">
                                {/* User Team */}
                                <div className="flex-1 text-center">
                                    <div className="text-xs font-bold text-emerald-400 uppercase mb-2">
                                        Your Team
                                    </div>
                                    <div className="text-2xl font-black mb-2">
                                        {userTeam.name}
                                    </div>
                                    <div
                                        className={`text-6xl font-black ${isFinal
                                            ? (userScore || 0) > (oppScore || 0)
                                                ? "text-emerald-400"
                                                : (userScore || 0) < (oppScore || 0)
                                                    ? "text-red-400"
                                                    : "text-zinc-400"
                                            : "text-zinc-300"
                                            }`}
                                    >
                                        {(userScore || 0).toFixed(1)}
                                    </div>
                                </div>

                                <div className="text-zinc-600 font-bold text-xl px-8">VS</div>

                                {/* Opponent Team */}
                                <div className="flex-1 text-center">
                                    <div className="text-xs font-bold text-zinc-500 uppercase mb-2">
                                        Opponent
                                    </div>
                                    <div className="text-2xl font-black mb-2 text-zinc-400">
                                        {oppTeam.name}
                                    </div>
                                    <div className="text-6xl font-black text-zinc-600">
                                        {(oppScore || 0).toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Roster */}
                    <div>
                        {userRoster && (
                            <LineupManager
                                leagueId={leagueId}
                                weekNumber={weekNum}
                                starters={userRoster.starters}
                                bench={userRoster.bench}
                                isFinal={isFinal}
                                title={`${userTeam?.name || "Your Lineup"}`}
                            />
                        )}
                    </div>
                    {/* Opponent Roster */}
                    <div>
                        {oppRoster && (
                            <LineupManager
                                leagueId={leagueId}
                                weekNumber={weekNum}
                                starters={oppRoster.starters}
                                bench={oppRoster.bench}
                                isFinal={isFinal}
                                readOnly={true}
                                title={`${oppTeam?.name || "Opponent"}`}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
