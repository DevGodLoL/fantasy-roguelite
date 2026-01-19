import { db } from "@/lib/prisma";
import Link from "next/link";
import { ScrollText, UserPlus, UserMinus, Sparkles, History, ArrowLeft } from "lucide-react";

// Helper for time
const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

export default async function GrandArchivePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const transactions = await db.leagueTransaction.findMany({
        where: { leagueId: id },
        orderBy: { createdAt: "desc" },
        include: {
            team: true,
            player: true,
        },
        take: 100,
    });

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-amber-500/30">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-amber-900/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-purple-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
                {/* Dust Participles Overlay */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/league/${id}`}
                            className="group flex items-center gap-2 text-zinc-500 hover:text-amber-400 transition-colors text-xs font-black uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Return
                        </Link>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700/20 to-amber-900/40 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                                    The Grand Archive
                                </h1>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                                    Historical Records & Omens
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto p-6 md:p-10">
                <div className="relative border-l-2 border-white/5 ml-6 pl-8 py-4 space-y-8">
                    {transactions.length > 0 ? (
                        transactions.map((tx) => {
                            // Determine visuals based on type
                            let icon = <ScrollText className="w-4 h-4" />;
                            let colorClass = "from-zinc-800 to-zinc-900 border-zinc-700 text-zinc-400";
                            let glow = "";
                            let typeLabel = "Event";

                            if (tx.type === 'ADD') {
                                icon = <UserPlus className="w-4 h-4" />;
                                colorClass = "from-emerald-900/30 to-emerald-950/50 border-emerald-500/30 text-emerald-400";
                                glow = "shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                                typeLabel = "Acquisition";
                            } else if (tx.type === 'DROP') {
                                icon = <UserMinus className="w-4 h-4" />;
                                colorClass = "from-red-900/30 to-red-950/50 border-red-500/30 text-red-400";
                                glow = "shadow-[0_0_20px_rgba(239,68,68,0.1)]";
                                typeLabel = "Departure";
                            } else if (tx.type === 'TRAIT_GAINED') {
                                icon = <Sparkles className="w-4 h-4" />;
                                colorClass = "from-purple-900/30 to-purple-950/50 border-purple-500/30 text-purple-400";
                                glow = "shadow-[0_0_20px_rgba(147,51,234,0.1)]";
                                typeLabel = "Mutation";
                            }

                            return (
                                <div key={tx.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={`
                                        absolute -left-[45px] top-6 w-5 h-5 rounded-full border-4 border-[#030303] 
                                        flex items-center justify-center transition-all duration-500
                                        bg-zinc-800 group-hover:scale-125 group-hover:bg-white
                                    `} />

                                    <div className={`
                                        relative p-5 rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300
                                        hover:translate-x-2 hover:bg-white/[0.02]
                                        ${colorClass} ${glow}
                                    `}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg bg-black/40 border border-white/5 ${colorClass.split(' ')[2]}`}>
                                                    {icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 border border-white/5 ${colorClass.split(' ')[2]}`}>
                                                            {typeLabel}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-600 font-mono">
                                                            T-{timeAgo(tx.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-zinc-200 leading-tight">
                                                        {tx.description}
                                                    </h3>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 shrink-0" />
                                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                                                            {tx.team.name}
                                                        </span>
                                                        {tx.player && (
                                                            <>
                                                                <span className="text-zinc-700 mx-1">•</span>
                                                                <span className="text-xs text-zinc-500 font-mono">
                                                                    {tx.player.position} - {tx.player.name}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center grayscale">
                                <ScrollText className="w-8 h-8 text-zinc-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black uppercase tracking-widest text-zinc-600">The Archive is Empty</h3>
                                <p className="text-xs text-zinc-700">No events have been recorded in this timeline yet.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
