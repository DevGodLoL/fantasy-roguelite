import { db } from "@/lib/prisma";
import { PERSONALITIES, Archetype } from "@/lib/game-data/personalities";

export default async function LeagueActivity({ leagueId, limit = 10 }: { leagueId: string; limit?: number }) {
    const transactions = await db.leagueTransaction.findMany({
        where: { leagueId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            team: true,
            player: true,
        },
    });

    if (transactions.length === 0) {
        return (
            <div className="p-8 bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl text-center">
                <div className="text-4xl mb-3 opacity-50">📜</div>
                <div className="text-zinc-500 italic text-sm">
                    The chronicles are silent...
                </div>
                <div className="text-zinc-600 text-xs mt-1">
                    No history recorded in this realm.
                </div>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'TRAIT_GAINED': return '✨';
            case 'ADD': return '➕';
            case 'DROP': return '⚰️';
            case 'SHOP_PURCHASE': return '🛍️';
            case 'MISSION_COMPLETE': return '🎯';
            default: return '📜';
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case 'TRAIT_GAINED': return 'from-purple-500/20 to-indigo-600/10 border-purple-500/20 text-purple-400';
            case 'ADD': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400';
            case 'DROP': return 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400';
            case 'SHOP_PURCHASE': return 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400';
            case 'MISSION_COMPLETE': return 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400';
            default: return 'from-zinc-500/20 to-zinc-600/10 border-zinc-500/20 text-zinc-400';
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-white/5">
                    {transactions.map((tx, index) => (
                        <div
                            key={tx.id}
                            className="p-4 flex items-start gap-4 text-sm hover:bg-white/5 transition-all group"
                        >
                            {/* Icon */}
                            <div className="mt-0.5 shrink-0">
                                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br border flex items-center justify-center text-lg ${getColors(tx.type)}`}>
                                    {getIcon(tx.type)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-1 min-w-0">
                                <div className="text-zinc-300 leading-snug">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-white group-hover:text-purple-400 transition-colors uppercase text-[11px] tracking-tight truncate">
                                            {tx.team.name}
                                        </span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/5 ${PERSONALITIES[tx.team.archetype as Archetype]?.color || 'text-zinc-500'}`}>
                                            {PERSONALITIES[tx.team.archetype as Archetype]?.icon} {PERSONALITIES[tx.team.archetype as Archetype]?.title}
                                        </span>
                                    </div>
                                    <p className="text-zinc-400 text-xs mt-1">
                                        {tx.description}
                                    </p>
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="text-right shrink-0">
                                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                    {formatTimeAgo(new Date(tx.createdAt))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
