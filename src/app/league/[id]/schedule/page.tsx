import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { generateSchedule } from "./actions";
import { revalidatePath } from "next/cache";

export default async function SchedulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { createdAt: "asc" } },
            weeks: {
                orderBy: { number: "asc" },
                include: {
                    matchups: {
                        include: {
                            homeTeam: true,
                            awayTeam: true,
                        },
                    },
                },
            },
            draft: true,
        },
    });

    if (!league) {
        notFound();
    }

    const isDraftComplete = league.draft?.status === "completed";
    // Check if any week has matchups (not just if weeks exist)
    const hasSchedule = league.weeks.some(w => w.matchups.length > 0);

    // Format team name for display
    const formatTeamName = (name: string) => {
        const parts = name.split(' ');
        return parts.length > 1 ? parts.slice(-1)[0] : name;
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans">
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-white transition-colors">
                        ← {league.name}
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <h1 className="font-black uppercase tracking-tighter text-xl">Season Schedule</h1>
                </div>

                {isDraftComplete && !hasSchedule && (
                    <form action={async () => {
                        "use server";
                        await generateSchedule(leagueId);
                    }}>
                        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-full transition-all">
                            Generate 14-Week Schedule
                        </button>
                    </form>
                )}

                {hasSchedule && (
                    <div className="text-xs text-zinc-500">
                        {league.weeks.length} weeks · {league.teams.length} teams
                    </div>
                )}
            </header>

            <main className="p-8">
                {!isDraftComplete ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏈</div>
                        <h2 className="text-2xl font-bold text-zinc-400 mb-2">Draft First!</h2>
                        <p className="text-zinc-600 mb-6">Complete the draft before generating the season schedule.</p>
                        <Link
                            href={`/league/${leagueId}/draft`}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all"
                        >
                            Go to Draft Room
                        </Link>
                    </div>
                ) : !hasSchedule ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📅</div>
                        <h2 className="text-2xl font-bold text-zinc-400 mb-2">No Schedule Yet</h2>
                        <p className="text-zinc-600 mb-6">Click the button above to generate a 14-week round-robin schedule.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Schedule Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {league.weeks.map((week) => (
                                <div
                                    key={week.id}
                                    className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-white">Week {week.number}</h3>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${week.matchups.every(m => m.status === "final")
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : week.matchups.some(m => m.status === "live")
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-zinc-800 text-zinc-400"
                                            }`}>
                                            {week.matchups.every(m => m.status === "final")
                                                ? "Complete"
                                                : week.matchups.some(m => m.status === "live")
                                                    ? "Live"
                                                    : "Scheduled"
                                            }
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {week.matchups.map((matchup) => (
                                            <Link
                                                key={matchup.id}
                                                href={`/league/${leagueId}/week/${week.number}`}
                                                className="block p-3 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 text-right">
                                                        <div className="text-xs font-bold truncate">{formatTeamName(matchup.awayTeam.name)}</div>
                                                        {matchup.status === "final" && (
                                                            <div className={`text-lg font-black ${matchup.awayScore > matchup.homeScore ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                {matchup.awayScore.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="px-3 text-zinc-600 text-xs font-bold">
                                                        {matchup.status === "final" ? "FINAL" : "@"}
                                                    </div>

                                                    <div className="flex-1 text-left">
                                                        <div className="text-xs font-bold truncate">{formatTeamName(matchup.homeTeam.name)}</div>
                                                        {matchup.status === "final" && (
                                                            <div className={`text-lg font-black ${matchup.homeScore > matchup.awayScore ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                                {matchup.homeScore.toFixed(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 justify-center text-xs text-zinc-500 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                <span>Scheduled</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <span>Live</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                <span>Complete</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
