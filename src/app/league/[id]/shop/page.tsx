import { db } from "@/lib/prisma";
import Link from "next/link";
import RelicCard from "./RelicCard"; // Client Component

export default async function ShopPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Fetch Shop Data
    const league = await db.league.findUnique({
        where: { id },
        include: { teams: true }
    });

    // Assume user is 'The DevGods' for demo, or first team
    const userTeam = league?.teams.find(t => t.name === "The DevGods") || league?.teams[0];

    // Debug log if needed (server-side)
    if (!userTeam && league?.teams) {
        console.error("No teams found in league:", league.id);
    }

    // Fetch ONLY Relics (we added type='relic')
    // Since we just ran a migration, make sure we filter correctly.
    // We added 'type' field.
    // Fetch Relics (Persistent)
    const relics = await db.powerup.findMany({
        where: { type: "relic" },
        orderBy: { price: "asc" }
    });

    // Fetch Consumables (Cards)
    const consumables = await db.powerup.findMany({
        where: { type: "card" },
        orderBy: { price: "asc" }
    });

    if (!userTeam) return <div>User team not found</div>;

    // Decorate relics with ICON from our constant if needed, 
    // but we stored them in DB without icon. 
    // We can map them client side or just use generic icons.
    // For now, let's just use what's in DB + simple mapping if needed.

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30 pb-20">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ATMOSPHERIC BACKGROUND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-900/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:h-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link href={`/league/${id}`} className="p-2 sm:p-0 text-zinc-500 hover:text-white transition-colors">
                            ← <span className="hidden sm:inline">BACK</span>
                        </Link>
                        <div>
                            <div className="text-[8px] sm:text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-0.5 sm:mb-1">Black Market</div>
                            <h1 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
                                The Relic <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Emporium</span>
                            </h1>
                        </div>
                    </div>

                    {/* PLAYER WEALTH */}
                    <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-end gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-white/5 rounded-xl sm:rounded-full border border-white/10">
                            <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest sm:hidden">Gold</div>
                            <div className="text-right">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest hidden sm:block">Available Gold</div>
                                <div className="text-sm sm:text-xl font-black text-amber-400 leading-none flex items-center justify-end gap-1.5 sm:gap-2">
                                    {userTeam.gold}<span className="text-xs sm:text-lg">🪙</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-end gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-white/5 rounded-xl sm:rounded-full border border-white/10">
                            <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest sm:hidden">Rerolls</div>
                            <div className="text-right">
                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest hidden sm:block">Rerolls</div>
                                <div className="text-sm sm:text-xl font-black text-purple-400 leading-none flex items-center justify-end gap-1.5 sm:gap-2">
                                    {userTeam.rerolls}<span className="text-xs sm:text-lg">🎲</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHOP CONTENT */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 max-w-6xl mx-auto p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relics.map(relic => (
                        <RelicCard
                            key={relic.id}
                            relic={{ ...relic, icon: "🏺" }} // Add icon logic mapping here if desired
                            userParams={{
                                gold: userTeam.gold,
                                teamId: userTeam.id,
                                leagueId: id
                            }}
                        />
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* CONSUMABLES SECTION */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {consumables.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="text-2xl">📜</div>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-400">
                                Scrolls & Contracts
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {consumables.map(item => (
                                <RelicCard
                                    key={item.id}
                                    relic={{
                                        ...item,
                                        icon: item.kind === 'reroll_add' ? "📜" : "🧪" // Simple icon logic
                                    }}
                                    userParams={{
                                        gold: userTeam.gold,
                                        teamId: userTeam.id,
                                        leagueId: id
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {relics.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        <h3 className="text-xl font-bold">The Merchant is Away</h3>
                        <p>No relics currently available.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
