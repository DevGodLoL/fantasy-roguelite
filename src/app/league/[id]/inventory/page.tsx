import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: leagueId } = await params;

    const league = await db.league.findUnique({
        where: { id: leagueId },
        include: { teams: true },
    });

    if (!league) return notFound();

    const userTeam = league.teams.find((t) => t.name === "The DevGods") || league.teams[0];

    // Fetch data
    const allPowerups = await db.powerup.findMany({ orderBy: { code: "asc" } });
    const teamPowerups = await db.teamPowerup.findMany({
        where: { teamId: userTeam.id },
        include: { powerup: true }
    });

    const ownedCounts: Record<string, number> = {};
    const activeCounts: Record<string, number> = {};

    teamPowerups.forEach((tp) => {
        ownedCounts[tp.powerupId] = (ownedCounts[tp.powerupId] || 0) + 1;
        if (!tp.isConsumed) {
            activeCounts[tp.powerupId] = (activeCounts[tp.powerupId] || 0) + 1;
        }
    });

    // For demonstration, we'll show all cards as discovered
    const discoveredIds = allPowerups.map((p) => p.id);
    const discoveredSet = new Set(discoveredIds);

    const totalPowerups = allPowerups.length;
    const discoveredCount = discoveredSet.size;
    const activeTotal = Object.values(activeCounts).reduce((a, b) => a + b, 0);
    const progressPercent = Math.round((discoveredCount / totalPowerups) * 100);

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-amber-500/30">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ATMOSPHERIC BACKGROUND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HEADER - THE ANCIENT COMMAND */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/league/${leagueId}`}
                            className="text-zinc-500 hover:text-amber-400 transition-all flex items-center gap-2 group text-sm font-bold uppercase tracking-widest"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Command
                        </Link>
                        <div className="h-6 w-px bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                                🛡️
                            </div>
                            <div>
                                <h1 className="font-black uppercase tracking-tighter text-base sm:text-xl bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
                                    The Ancient Armory
                                </h1>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black leading-none mt-1">
                                    Secure Vault of Power & Malice
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block px-4 py-2 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                            <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Vault Status</div>
                            <div className="text-sm font-bold text-white tracking-widest uppercase">Chamber Secure</div>
                        </div>
                    </div>
                </div>
            </header>

            <InventoryClient
                allPowerups={allPowerups}
                ownedCounts={ownedCounts}
                discoveredIds={discoveredIds}
                discoveredCount={discoveredCount}
                totalPowerups={totalPowerups}
                progressPercent={progressPercent}
                activeTotal={activeTotal}
            />
        </div>
    );
}
