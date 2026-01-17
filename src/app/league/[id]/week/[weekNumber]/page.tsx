import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { consumePowerup, selectPowerup, ensurePackOffers } from "./actions";

// NEW: Helper for stat-based score calculation
// Returns granular breakdown for debugging/UI
function calculateScore(
    stats: { passYds: number; rushYds: number; recYds: number } | null,
    powerup: { code: string; value: number | null } | null
) {
    if (!stats) return { base: 0, effective: 0 };

    const base = stats.passYds + stats.rushYds + stats.recYds;

    if (!powerup) {
        return { base, effective: base };
    }

    let effPass = stats.passYds;
    let effRush = stats.rushYds;
    let effRec = stats.recYds;
    let bonus = 0;

    // Apply Multipliers
    if (powerup.code === "PASS_YDS_X15") {
        effPass = stats.passYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "RUSH_YDS_X15") {
        effRush = stats.rushYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "REC_YDS_X15") {
        effRec = stats.recYds * (powerup.value ?? 1.5);
    } else if (powerup.code === "PLUS_10") {
        bonus = 10;
    }

    const effective = effPass + effRush + effRec + bonus;
    return { base, effective };
}

export default async function WeekPage({
    params,
}: {
    params: Promise<{ id: string; weekNumber: string }>;
}) {
    const { id: leagueId, weekNumber } = await params;
    const numWeek = parseInt(weekNumber, 10);

    const league = await prisma.league.findUniqueOrThrow({
        where: { id: leagueId },
    });

    const week = await prisma.week.findUniqueOrThrow({
        where: { leagueId_number: { leagueId, number: numWeek } },
    });

    const matchups = await prisma.matchup.findMany({
        where: { weekId: week.id },
        include: {
            homeTeam: true,
            awayTeam: true,
        },
    });

    const teams = await prisma.team.findMany({
        where: { leagueId },
        orderBy: { name: "asc" },
    });

    const teamPowerups = await prisma.teamPowerup.findMany({
        where: { weekId: week.id },
        include: { powerup: true },
    });

    // Fetch Stats
    const allStats = await prisma.teamWeekStats.findMany({
        where: { weekId: week.id }
    });

    const teamPowerupOffers = await prisma.teamPowerupOffer.findMany({
        where: { weekId: week.id },
        include: { powerup: true },
    });

    // Helpers
    const getTeamPowerup = (teamId: string) => teamPowerups.find((tp) => tp.teamId === teamId);
    const getTeamOffers = (teamId: string) => teamPowerupOffers.filter((o) => o.teamId === teamId);
    const getTeamStats = (teamId: string) => allStats.find((s) => s.teamId === teamId) || null;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
            <div>
                <Link
                    href={`/league/${leagueId}`}
                    className="text-blue-600 hover:underline mb-4 inline-block"
                >
                    ← Back to {league.name}
                </Link>
                <h1 className="text-3xl font-bold">Week {weekNumber}</h1>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Matchups</h2>
                <div className="space-y-4">
                    {matchups.map((m) => {
                        const homePowerup = getTeamPowerup(m.homeTeamId);
                        const awayPowerup = getTeamPowerup(m.awayTeamId);
                        const homeStats = getTeamStats(m.homeTeamId);
                        const awayStats = getTeamStats(m.awayTeamId);

                        const { base: homeBase, effective: homeEff } = calculateScore(
                            homeStats,
                            homePowerup && !homePowerup.isConsumed ? homePowerup.powerup : null
                        );

                        const { base: awayBase, effective: awayEff } = calculateScore(
                            awayStats,
                            awayPowerup && !awayPowerup.isConsumed ? awayPowerup.powerup : null
                        );

                        return (
                            <div key={m.id} className="border p-4 rounded bg-gray-50">
                                <div className="grid grid-cols-2 gap-4 divide-x">
                                    {/* Home Team */}
                                    <div className="px-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="font-bold text-lg">
                                                {m.homeTeam.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-gray-500 text-sm">
                                                    Base: {homeBase}
                                                </span>
                                                {" → "}
                                                <span className="font-bold text-blue-700 text-xl">
                                                    {homeEff.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats Line */}
                                        {homeStats && (
                                            <div className="text-xs text-gray-500 mb-2 font-mono">
                                                Pass: {homeStats.passYds} | Rush: {homeStats.rushYds} | Rec: {homeStats.recYds}
                                            </div>
                                        )}

                                        {homePowerup && !homePowerup.isConsumed ? (
                                            <div className="bg-purple-50 p-2 rounded text-xs border border-purple-200 text-purple-800">
                                                <span className="font-bold">
                                                    ⚡ {homePowerup.powerup.name}
                                                </span>
                                                : {homePowerup.powerup.description}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-xs italic">
                                                No active powerup
                                            </div>
                                        )}
                                    </div>

                                    {/* Away Team */}
                                    <div className="px-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="font-bold text-lg">
                                                {m.awayTeam.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-gray-500 text-sm">
                                                    Base: {awayBase}
                                                </span>
                                                {" → "}
                                                <span className="font-bold text-blue-700 text-xl">
                                                    {awayEff.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats Line */}
                                        {awayStats && (
                                            <div className="text-xs text-gray-500 mb-2 font-mono">
                                                Pass: {awayStats.passYds} | Rush: {awayStats.rushYds} | Rec: {awayStats.recYds}
                                            </div>
                                        )}

                                        {awayPowerup && !awayPowerup.isConsumed ? (
                                            <div className="bg-purple-50 p-2 rounded text-xs border border-purple-200 text-purple-800">
                                                <span className="font-bold">
                                                    ⚡ {awayPowerup.powerup.name}
                                                </span>
                                                : {awayPowerup.powerup.description}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-xs italic">
                                                No active powerup
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 text-center text-xs text-gray-400 uppercase tracking-widest border-t pt-2">
                                    Status: {m.status}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Open Pack</h2>
                <div className="space-y-6">
                    {teams.map((team) => {
                        const activePowerup = getTeamPowerup(team.id);
                        const offers = getTeamOffers(team.id);

                        return (
                            <div key={team.id} className="border p-4 rounded shadow-sm">
                                <h3 className="font-bold text-lg mb-2">{team.name}</h3>

                                {activePowerup ? (
                                    // STATE 1: Powerup Selected (Active or Consumed)
                                    <div
                                        className={`p-4 rounded border ${activePowerup.isConsumed
                                                ? "bg-gray-100 border-gray-300 text-gray-500"
                                                : "bg-green-50 border-green-200 text-green-900"
                                            }`}
                                    >
                                        <div className="font-bold flex items-center gap-2">
                                            {activePowerup.isConsumed ? (
                                                <span>✗ Consumed:</span>
                                            ) : (
                                                <span>✓ Active:</span>
                                            )}
                                            <span>{activePowerup.powerup.name}</span>
                                        </div>
                                        <p className="text-sm mt-1">
                                            {activePowerup.powerup.description}
                                        </p>
                                        {activePowerup.powerup.rarity && (
                                            <p className={`text-xs mt-2 uppercase font-semibold ${activePowerup.powerup.rarity === 'common' ? 'text-gray-500' :
                                                    activePowerup.powerup.rarity === 'rare' ? 'text-blue-500' :
                                                        activePowerup.powerup.rarity === 'epic' ? 'text-purple-600' :
                                                            'text-orange-500'
                                                }`}>
                                                Rarity: {activePowerup.powerup.rarity}
                                            </p>
                                        )}

                                        {activePowerup.isConsumed ? (
                                            <p className="text-xs mt-2 italic text-gray-400">This powerup has been used and no longer applies.</p>
                                        ) : (
                                            <form action={consumePowerup} className="mt-4">
                                                <input type="hidden" name="teamPowerupId" value={activePowerup.id} />
                                                <input type="hidden" name="leagueId" value={leagueId} />
                                                <input type="hidden" name="weekNumber" value={weekNumber} />
                                                <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition">
                                                    Use Powerup
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                ) : offers.length > 0 ? (
                                    // STATE 2: Pack Opened, Offers Available
                                    <form action={selectPowerup} className="space-y-3">
                                        <input type="hidden" name="teamId" value={team.id} />
                                        <input type="hidden" name="weekId" value={week.id} />
                                        <input type="hidden" name="leagueId" value={leagueId} />
                                        <input
                                            type="hidden"
                                            name="weekNumber"
                                            value={weekNumber}
                                        />

                                        <p className="text-sm font-semibold text-gray-700">Select one powerup from your pack:</p>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {offers.map((offer) => (
                                                <label
                                                    key={offer.id}
                                                    className="flex flex-col border p-3 rounded cursor-pointer hover:bg-blue-50 transition relative"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="radio"
                                                            name="powerupId"
                                                            value={offer.powerupId}
                                                            required
                                                            className="mt-1"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-sm">{offer.powerup.name}</div>
                                                            <div className="text-xs text-gray-600 mt-1">{offer.powerup.description}</div>

                                                            <div className={`text-[10px] uppercase font-bold mt-2 ${offer.powerup.rarity === 'common' ? 'text-gray-400' :
                                                                    offer.powerup.rarity === 'rare' ? 'text-blue-500' :
                                                                        offer.powerup.rarity === 'epic' ? 'text-purple-600' :
                                                                            'text-orange-500'
                                                                }`}>
                                                                {offer.powerup.rarity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                            >
                                                Select Powerup
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    // STATE 3: Pack Not Opened Yet
                                    <div className="bg-gray-50 border border-dashed border-gray-300 p-6 rounded text-center">
                                        <p className="text-gray-600 mb-4">You have a pack waiting to be opened for this week!</p>

                                        <form
                                            action={async () => {
                                                "use server";
                                                await ensurePackOffers(leagueId, team.id, week.id);
                                            }}
                                        >
                                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-700 transition font-bold text-lg animate-pulse">
                                                🎁 Open Pack
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
