import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { pickPlayer, startDraft } from "./actions";

export default async function DraftRoom({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await prisma.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: { orderBy: { createdAt: "asc" } },
            draft: {
                include: {
                    picks: {
                        include: { player: true, team: true },
                        orderBy: { pickNumber: "desc" },
                    },
                },
            },
        },
    });

    if (!league || !league.draft) {
        notFound();
    }

    const { draft } = league;
    const numTeams = league.teams.length;

    // Calculate who is picking
    const currentPickIndex = draft.currentPick - 1;
    const currentRound = Math.floor(currentPickIndex / numTeams) + 1;
    const pickInRound = (currentPickIndex % numTeams) + 1;

    let activeTeamIndex;
    if (draft.format === "snake") {
        const isEvenRound = currentRound % 2 === 0;
        activeTeamIndex = isEvenRound ? numTeams - pickInRound : pickInRound - 1;
    } else {
        activeTeamIndex = pickInRound - 1;
    }
    const activeTeam = league.teams[activeTeamIndex];

    // Get drafted player IDs
    const draftedPlayerIds = await prisma.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const availablePlayers = await prisma.player.findMany({
        where: { id: { notIn: draftedPlayerIds } },
        orderBy: { name: "asc" },
    });

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-white transition-colors">
                        ← {league.name}
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <h1 className="font-black uppercase tracking-tighter text-xl">Draft Room</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Draft Status</div>
                        <div className={`text-sm font-bold ${draft.status === 'drafting' ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`}>
                            {draft.status.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                    {draft.status === 'pre_draft' && (
                        <form action={async () => {
                            "use server";
                            await startDraft(draft.id, leagueId);
                        }}>
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-full transition-all">
                                Commence Draft
                            </button>
                        </form>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Available Players */}
                <aside className="w-[400px] border-r border-white/5 flex flex-col bg-zinc-950/20">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Available Mercenaries</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search players..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {availablePlayers.map((player) => (
                            <div
                                key={player.id}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                            >
                                <div>
                                    <div className="font-bold text-sm">{player.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono uppercase">
                                        <span className="text-blue-400">{player.position}</span> · {player.teamAbbr}
                                    </div>
                                </div>
                                {draft.status === 'drafting' && (
                                    <form action={async () => {
                                        "use server";
                                        await pickPlayer(leagueId, draft.id, activeTeam.id, player.id);
                                    }}>
                                        <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase rounded-lg hover:bg-blue-400 transition-all">
                                            Pick
                                        </button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Center: Main Dashboard */}
                <main className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Active Pick Status */}
                    <div className="relative overflow-hidden rounded-[2rem] p-12 bg-zinc-900/30 border border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">Currently Selecting</div>
                                <h3 className="text-5xl font-black tracking-tight">{activeTeam.name}</h3>
                                <div className="flex gap-4">
                                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                        <div className="text-[10px] text-zinc-500 uppercase font-black">Round</div>
                                        <div className="text-xl font-bold">{currentRound}</div>
                                    </div>
                                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-blue-400">
                                        <div className="text-[10px] text-blue-500/50 uppercase font-black">Pick</div>
                                        <div className="text-xl font-bold">{draft.currentPick}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0 animate-pulse">
                                <div className="h-32 w-32 rounded-full border-4 border-blue-600/20 border-t-blue-600 flex items-center justify-center">
                                    <span className="text-xs font-black text-blue-400 uppercase">On the Clock</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Picks Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Draft History</h2>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {draft.picks.map((pick) => (
                                <div key={pick.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-2 right-3 text-[10px] font-black text-white/10 group-hover:text-blue-500/20 transition-colors">#{pick.pickNumber}</div>
                                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Round {pick.round}</div>
                                    <div className="font-bold text-white truncate">{pick.player?.name}</div>
                                    <div className="text-[10px] text-zinc-500 truncate mt-1">
                                        To <span className="text-zinc-300">{pick.team.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Right: Team Summary / Board Summary */}
                <aside className="w-[300px] border-l border-white/5 bg-zinc-950/40 p-6 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Pick Order</h2>
                        <div className="space-y-2">
                            {league.teams.map((t, i) => {
                                const isPicking = t.id === activeTeam.id;
                                return (
                                    <div
                                        key={t.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isPicking ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-white/5 border border-transparent opacity-50'
                                            }`}
                                    >
                                        <span className="text-[10px] font-black w-4 text-zinc-500">{i + 1}</span>
                                        <span className="text-sm font-bold truncate">{t.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
