import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import WaiverPlayerList from "./WaiverPlayerList";
import { submitWaiverClaim, processWaivers, cancelClaim } from "./actions";

export default async function WaiversPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: {
            teams: {
                include: {
                    owner: true,
                    rosterSlots: { include: { player: true } }
                },
                orderBy: { waiverPriority: "asc" },
            },
            draft: true,
        },
    });

    if (!league) notFound();

    // Identify User Team (Mock: "The DevGods" or fallback to first team)
    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    const rosteredPlayerIds = await db.rosterSlot
        .findMany({
            where: { team: { leagueId }, playerId: { not: null } },
            select: { playerId: true },
        })
        .then((slots) => slots.map((s) => s.playerId) as string[]);

    const availablePlayers = await db.player.findMany({
        where: { id: { notIn: rosteredPlayerIds } },
        orderBy: { adp: "asc" },
        take: 500, // Limit to top 500 available players to prevent crash
    });

    const pendingClaims = await db.waiverClaim.findMany({
        where: { status: "pending", team: { leagueId } },
        include: { team: true, playerToAdd: true, playerToDrop: true },
        orderBy: { bidAmount: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col">
            {/* Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-white transition-all hover:-translate-x-1">
                        ← {league.name}
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic">Waiver Wire</h1>
                </div>

                <div className="flex items-center gap-4">
                    <form action={async () => {
                        "use server";
                        await processWaivers(leagueId);
                    }}>
                        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            Process Waivers Now
                        </button>
                    </form>
                </div>
            </header>

            <div className="flex-1 grid lg:grid-cols-12 gap-0 overflow-hidden">
                {/* Left: Pending Claims */}
                <aside className="lg:col-span-3 border-r border-white/5 bg-zinc-950/20 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> Pending Claims
                        </h2>
                        <div className="space-y-3">
                            {pendingClaims.length > 0 ? (
                                pendingClaims.map((claim) => (
                                    <div key={claim.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2 relative group italic">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                                                {claim.playerToAdd.name}
                                            </div>
                                            <div className="text-blue-400 font-mono text-xs font-black">${claim.bidAmount}</div>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 flex justify-between">
                                            <span>Team: {claim.team.name}</span>
                                            {claim.playerToDrop && (
                                                <span className="text-red-400/50 italic">Drops: {claim.playerToDrop.name}</span>
                                            )}
                                        </div>
                                        <form action={async () => {
                                            "use server";
                                            await cancelClaim(claim.id, leagueId);
                                        }} className="pt-2">
                                            <button className="text-[10px] uppercase font-black text-white/20 hover:text-red-400 transition-colors">Cancel</button>
                                        </form>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center text-zinc-600 text-xs">
                                    No active claims.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Waiver Priority</h2>
                        <div className="space-y-1">
                            {league.teams.map((t, i) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] text-xs">
                                    <span className="text-zinc-500 font-mono italic">{i + 1}</span>
                                    <span className="font-bold flex-1 px-3 truncate">{t.name}</span>
                                    <span className="text-blue-400 font-mono">${t.faabBalance}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Center: Available Players */}
                <main className="lg:col-span-9 p-8 md:p-12 overflow-hidden h-[calc(100vh-5rem)]">
                    <WaiverPlayerList
                        leagueId={leagueId}
                        players={availablePlayers}
                        userTeam={userTeam}
                    />
                </main>
            </div>
        </div>
    );
}
