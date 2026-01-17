import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArtifactCard from "@/components/ArtifactCard";

export default async function InventoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const league = await db.league.findUnique({
        where: { id },
        include: { teams: true },
    });

    if (!league) return notFound();

    // Identify User Team (Mock)
    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    // Fetch Inventory
    const teamPowerups = await db.teamPowerup.findMany({
        where: { teamId: userTeam.id },
        include: {
            powerup: true,
            week: true,
        },
        orderBy: { week: { number: 'desc' } }
    });

    const activePowerups = teamPowerups.filter(tp => !tp.isConsumed);
    const usedPowerups = teamPowerups.filter(tp => tp.isConsumed);

    // Fetch Collection Stats
    const totalUniquePowerups = await db.powerup.count();
    const collectedIds = new Set(teamPowerups.map(tp => tp.powerupId));

    // Rarity Dist
    const rarityCounts = teamPowerups.reduce((acc, tp) => {
        const r = tp.powerup.rarity || 'common';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500/30">
            {/* Nav */}
            <div className="bg-zinc-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/league/${id}`} className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest">
                        ← Back to League
                    </Link>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Artifact Vault</h1>
                </div>
            </div>

            <main className="max-w-6xl mx-auto p-6 space-y-12">

                {/* Stats Header */}
                <section className="grid md:grid-cols-4 gap-4">
                    <div className="p-6 bg-zinc-900/30 border border-white/10 rounded-2xl">
                        <div className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-2">Collection Progress</div>
                        <div className="text-4xl font-black text-white">{collectedIds.size} <span className="text-zinc-600 text-lg">/ {totalUniquePowerups}</span></div>
                    </div>
                    {['common', 'rare', 'epic', 'legendary'].map(rarity => (
                        <div key={rarity} className="p-6 bg-zinc-900/30 border border-white/10 rounded-2xl">
                            <div className={`text-xs uppercase font-black tracking-widest mb-2 opacity-70 ${rarity === 'legendary' ? 'text-amber-400' :
                                rarity === 'epic' ? 'text-purple-400' :
                                    rarity === 'rare' ? 'text-blue-400' : 'text-zinc-500'
                                }`}>{rarity} Found</div>
                            <div className="text-4xl font-black text-white">{rarityCounts[rarity] || 0}</div>
                        </div>
                    ))}
                </section>

                {/* Active Loadout */}
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                        Active Artifacts
                    </h2>
                    {activePowerups.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activePowerups.map(tp => (
                                <ArtifactCard
                                    key={tp.id}
                                    powerup={tp.powerup}
                                    weekNumber={tp.week?.number}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600">
                            <div className="text-4xl mb-4">🎒</div>
                            <div className="font-bold uppercase tracking-widest">No Active Artifacts</div>
                            <div className="text-sm mt-2">Open a pack or wait for the next supply drop.</div>
                        </div>
                    )}
                </section>

                {/* History */}
                <section className="opacity-80">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-zinc-700 rounded-full"></span>
                        Depleted / History
                    </h2>
                    {usedPowerups.length > 0 ? (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {usedPowerups.map(tp => (
                                <ArtifactCard
                                    key={tp.id}
                                    powerup={tp.powerup}
                                    weekNumber={tp.week?.number}
                                    isConsumed={true}
                                    size="sm"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-zinc-600 italic">No history yet.</div>
                    )}
                </section>

            </main>
        </div>
    );
}
