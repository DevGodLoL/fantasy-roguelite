import { db } from "@/lib/prisma";

export default async function LeagueActivity({ leagueId }: { leagueId: string }) {
    const events = await db.waiverClaim.findMany({
        where: {
            team: { leagueId },
            status: "successful",
        },
        orderBy: { processedAt: "desc" },
        take: 8,
        include: {
            team: true,
            playerToAdd: true,
            playerToDrop: true,
        },
    });

    if (events.length === 0) {
        return (
            <div className="p-8 bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl text-center">
                <div className="text-4xl mb-3 opacity-50">📜</div>
                <div className="text-zinc-500 italic text-sm">
                    The scroll is empty...
                </div>
                <div className="text-zinc-600 text-xs mt-1">
                    No transactions yet
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
                <div className="divide-y divide-white/5">
                    {events.map((event, index) => (
                        <div
                            key={event.id}
                            className="p-4 flex items-start gap-4 text-sm hover:bg-white/5 transition-all group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Icon */}
                            <div className="mt-0.5 relative">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                                    {event.playerToDrop ? "🔄" : "📜"}
                                </div>
                                {/* Connector line */}
                                {index < events.length - 1 && (
                                    <div className="absolute left-1/2 top-full h-5 w-px bg-gradient-to-b from-zinc-700 to-transparent" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="text-zinc-300 leading-snug">
                                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                        {event.team.name}
                                    </span>
                                    {" "}
                                    <span className="text-zinc-500">summoned</span>
                                    {" "}
                                    <span className="font-bold text-emerald-400">
                                        {event.playerToAdd.name}
                                    </span>
                                    {" "}
                                    <span className="text-[10px] uppercase text-zinc-600 font-bold">
                                        {event.playerToAdd.position}
                                    </span>
                                </div>

                                {event.playerToDrop && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-zinc-600">⚰️</span>
                                        <span className="text-zinc-500">Released</span>
                                        <span className="text-red-400/80 font-medium">
                                            {event.playerToDrop.name}
                                        </span>
                                        <span className="text-[10px] uppercase text-zinc-700">
                                            {event.playerToDrop.position}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Timestamp */}
                            <div className="text-right shrink-0">
                                <div className="text-[10px] text-zinc-600 font-mono uppercase">
                                    {event.processedAt
                                        ? formatTimeAgo(new Date(event.processedAt))
                                        : 'Just now'
                                    }
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
