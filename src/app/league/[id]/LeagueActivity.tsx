import { db } from "@/lib/prisma";


export default async function LeagueActivity({ leagueId }: { leagueId: string }) {
    const events = await db.waiverClaim.findMany({
        where: {
            team: { leagueId },
            status: "successful",
        },
        orderBy: { processedAt: "desc" },
        take: 10,
        include: {
            team: true,
            playerToAdd: true,
            playerToDrop: true,
        },
    });

    if (events.length === 0) {
        return (
            <div className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl text-zinc-500 italic text-sm text-center">
                The league is quiet... for now.
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl overflow-hidden">
            <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Recent Transactions</h3>
            </div>
            <div className="divide-y divide-white/5">
                {events.map((event) => (
                    <div key={event.id} className="p-4 flex items-center gap-4 text-sm hover:bg-white/5 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            W
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="text-zinc-300">
                                <span className="font-bold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                    {event.team.name}
                                </span>
                                {" "}claimed{" "}
                                <span className="font-bold text-emerald-400">
                                    {event.playerToAdd.name}
                                </span>
                            </div>
                            {event.playerToDrop && (
                                <div className="text-xs text-zinc-600">
                                    dropped <span className="text-red-400/70">{event.playerToDrop.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-mono shrink-0">
                            {event.processedAt ? new Date(event.processedAt).toLocaleDateString() : 'Unknown time'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
