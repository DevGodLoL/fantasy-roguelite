import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addPlayerToRoster, dropPlayer } from "../actions";
import RosterManager from "./RosterManager";

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
                include: { draft: true }
            },
            rosterSlots: {
                include: { player: true },
                // We'll sort in memory
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

    // Sort roster slots by standard fantasy order
    const sortOrder: Record<string, number> = {
        QB: 1,
        RB: 2,
        WR: 3,
        TE: 4,
        FLEX: 5,
        DST: 6,
        K: 7,
        BENCH: 8
    };

    const sortedRoster = [...team.rosterSlots].sort((a, b) => {
        // First sort by starter vs bench (low number = starter = first)
        const aScore = (a.isStarter ? 0 : 100) + (sortOrder[a.slotType] || 99);
        const bScore = (b.isStarter ? 0 : 100) + (sortOrder[b.slotType] || 99);
        return aScore - bScore;
    });

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
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
            {/* Animated Background Mesh */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-12 space-y-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-blue-400 transition-colors text-sm font-medium flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> {team.league.name}
                        </Link>
                        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                            {team.name}
                        </h1>
                        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest">
                            Owned by <span className="text-zinc-200">{team.owner.displayName || team.owner.email}</span>
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-md">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Season Record</div>
                            <div className="text-xl font-bold">0 - 0 - 0</div>
                        </div>
                    </div>
                </header>

                {draftStatus !== "completed" ? (
                    <div className="bg-zinc-900/50 border border-white/5 p-12 rounded-[2rem] text-center space-y-6">
                        <div className="text-4xl">⚔️</div>
                        <h2 className="text-2xl font-bold">Draft in Progress</h2>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            The rosters are being formed in the Draft Room. Once the draft is finalized, you can manage your squad and hit the waiver wire.
                        </p>
                        <Link
                            href={`/league/${leagueId}/draft`}
                            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-full transition-all"
                        >
                            Enter Draft Room
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Active Powerups Row */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500/80">Active Artifacts</h2>
                            <div className="flex flex-wrap gap-4">
                                {team.powerups.length > 0 ? (
                                    team.powerups.map((tp) => (
                                        <div
                                            key={tp.id}
                                            className="relative group overflow-hidden px-5 py-4 bg-zinc-900/80 border border-blue-500/20 rounded-2xl transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                        >
                                            <div className="relative z-10">
                                                <div className="text-blue-400 text-xs font-bold uppercase mb-1">{tp.powerup.rarity}</div>
                                                <div className="font-bold text-lg leading-tight">{tp.powerup.name}</div>
                                                <div className="text-zinc-400 text-sm mt-1 max-w-[200px]">{tp.powerup.description}</div>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-zinc-600 italic text-sm border border-dashed border-zinc-800 rounded-2xl px-6 py-8 w-full text-center">
                                        No active powerups. Visit the Pack Shop to gain an advantage.
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="grid lg:grid-cols-3 gap-12">
                            {/* Main Roster Table */}
                            <section className="lg:col-span-2 space-y-6">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-purple-500/80">Battle Formation</h2>
                                <RosterManager
                                    leagueId={leagueId}
                                    teamId={teamId}
                                    slots={sortedRoster}
                                />
                            </section>

                            {/* Side Drawer: Available Players */}
                            <section className="space-y-6">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500/80">Waiver Wire</h2>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availablePlayers.length > 0 ? (
                                        availablePlayers.map((player) => (
                                            <div key={player.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-emerald-500/30 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-zinc-100">{player.name}</div>
                                                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">
                                                            {player.position} · {player.teamAbbr}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {team.rosterSlots
                                                            .filter(s => !s.playerId && (s.slotType === player.position || s.slotType === "FLEX" || s.slotType === "BENCH"))
                                                            .slice(0, 1)
                                                            .map(slot => (
                                                                <form key={slot.id} action={async () => {
                                                                    "use server";
                                                                    await addPlayerToRoster(leagueId, teamId, slot.id, player.id);
                                                                }}>
                                                                    <button className="px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-emerald-400 transition-colors">
                                                                        Claim
                                                                    </button>
                                                                </form>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-zinc-600 text-sm italic">All players have been recruited.</p>
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
