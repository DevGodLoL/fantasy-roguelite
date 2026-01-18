import { db } from "@/lib/prisma";
import Link from "next/link";

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

export default async function TransactionsPage({
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
        take: 50,
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
            {/* Nav */}
            <div className="bg-zinc-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/league/${id}`} className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest">
                        ← Back to League
                    </Link>
                    <h1 className="text-xl font-black uppercase tracking-tighter text-emerald-500">Transaction History</h1>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-6">
                <div className="space-y-4">
                    {transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                {/* Icon/Type */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${tx.type === 'ADD' ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
                                        tx.type === 'DROP' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                                            'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    {tx.type === 'ADD' ? '+' : tx.type === 'DROP' ? '-' : '?'}
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-white text-lg leading-none mb-1">
                                                {tx.description}
                                            </div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wide font-bold">
                                                {tx.team.name} • {tx.player?.position}
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-zinc-600">
                                            {timeAgo(tx.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                            No transactions yet.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
