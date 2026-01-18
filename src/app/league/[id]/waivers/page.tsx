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
        <div className="min-h-screen bg-[#030303] text-white font-sans flex flex-col selection:bg-purple-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-900/8 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER - MARKET COMMAND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-20 h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/60 backdrop-blur-xl sticky top-0 shrink-0">
                <div className="flex items-center gap-6">
                    <Link href={`/league/${leagueId}`} className="text-zinc-500 hover:text-purple-400 transition-all flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back to Command
                    </Link>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                            🔮
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">Mercenary Marketplace</h1>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Recruit new souls for your legion</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* User FAAB Balance */}
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Treasury</div>
                        <div className="text-xl font-black text-blue-400 font-mono italic">${userTeam.faabBalance}</div>
                    </div>

                    <form action={async () => {
                        "use server";
                        await processWaivers(leagueId);
                    }}>
                        <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            Execute Contracts Now
                        </button>
                    </form>
                </div>
            </header>

            <div className="relative z-10 flex-1 grid lg:grid-cols-12 gap-0 overflow-hidden">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* LEFT: CONTRACTS & HIERARCHY */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <aside className="lg:col-span-3 border-r border-white/10 bg-black/40 backdrop-blur-sm p-8 space-y-10 overflow-y-auto custom-scrollbar">
                    {/* Pending Claims Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[.3em] text-purple-400 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" /> Active Contracts
                            </h2>
                            <span className="text-[10px] font-bold text-zinc-600 px-2 py-0.5 bg-white/5 rounded-md">{pendingClaims.length}</span>
                        </div>

                        <div className="space-y-4">
                            {pendingClaims.length > 0 ? (
                                pendingClaims.map((claim) => (
                                    <div key={claim.id} className="group p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3 relative transition-all hover:bg-zinc-900/60 hover:border-purple-500/30">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <div className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">
                                                    {claim.playerToAdd.name}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                                                    {claim.playerToAdd.position} · {claim.playerToAdd.teamAbbr}
                                                </div>
                                            </div>
                                            <div className="text-blue-400 font-mono text-sm font-black italic bg-blue-500/10 px-2 py-1 rounded-lg">
                                                ${claim.bidAmount}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                            <div className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">
                                                {claim.playerToDrop ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-red-500/50">Drop</span>
                                                        <span className="text-zinc-400">{claim.playerToDrop.name.split(' ').pop()}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-500/50">No Drop</span>
                                                )}
                                            </div>

                                            <form action={async () => {
                                                "use server";
                                                await cancelClaim(claim.id, leagueId);
                                            }}>
                                                <button className="text-[9px] uppercase font-black text-zinc-600 hover:text-red-400 transition-colors tracking-[.2em]">
                                                    Void
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 border border-dashed border-white/5 rounded-[2rem] text-center flex flex-col items-center gap-3">
                                    <span className="text-3xl opacity-20">📜</span>
                                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">No active contracts found.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Waiver Priority Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[.3em] text-blue-400">Command Hierarchy</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                        </div>

                        <div className="space-y-2">
                            {league.teams.map((t, i) => {
                                const isUser = t.id === userTeam.id;
                                return (
                                    <div
                                        key={t.id}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all border ${isUser
                                                ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                                                : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black italic w-4 ${isUser ? "text-purple-400" : "text-zinc-600"}`}>{i + 1}</span>
                                            <span className={`text-xs font-bold truncate max-w-[120px] ${isUser ? "text-white" : "text-zinc-400"}`}>
                                                {t.name}
                                            </span>
                                        </div>
                                        <span className={`text-[11px] font-mono italic font-bold ${isUser ? "text-purple-300" : "text-blue-900"}`}>
                                            ${t.faabBalance}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </aside>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* MAIN: MERCENARY ROSTER */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <main className="lg:col-span-9 p-8 md:p-12 overflow-hidden h-full flex flex-col">
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
