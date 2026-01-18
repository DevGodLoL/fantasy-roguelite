import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const league = await db.league.findUnique({
        where: { id },
        include: {
            weeks: {
                orderBy: { number: "asc" },
                include: {
                    matchups: true
                }
            }
        },
    });

    if (!league) return notFound();

    // Determine current week
    let currentWeekNumber = 1;
    let isSeasonOver = false;

    // Find first week with non-final matchups
    const activeWeek = league.weeks.find(w =>
        w.matchups.some(m => m.status !== "final")
    );

    if (activeWeek) {
        currentWeekNumber = activeWeek.number;
    } else if (league.weeks.length > 0) {
        // checks if ALL are final
        const allFinal = league.weeks.every(w => w.matchups.every(m => m.status === "final"));
        if (allFinal) {
            isSeasonOver = true;
            currentWeekNumber = league.weeks.length;
        }
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-red-500/30">
            {/* Animated Background - Deep Crimson / Dark Gray */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-red-900/10 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/10 blur-[150px] rounded-full" />

                {/* Subtle static grid for that "control room" feel */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(220,38,38,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.1) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STICKY HEADER - ARBITER'S SEAL */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <header className="relative z-30 h-20 border-b border-red-500/20 bg-black/60 backdrop-blur-xl sticky top-0 shrink-0">
                <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-full">
                    <div className="flex items-center gap-6">
                        <Link href={`/league/${id}`} className="text-zinc-500 hover:text-red-400 transition-all flex items-center gap-2 group text-xs font-black uppercase tracking-widest">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Return to Realm
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(220,38,38,0.2)] border border-red-500/30">
                                ⚖️
                            </div>
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tighter bg-gradient-to-r from-white via-white to-red-400 bg-clip-text text-transparent">Grand Arbiter's Console</h1>
                                <div className="text-[10px] text-zinc-600 uppercase tracking-[.2em] font-bold">Reshape the weave of time</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MAIN DASHBOARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 max-w-3xl mx-auto p-8 lg:p-12 space-y-12">
                <div className="space-y-4 text-center">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-[.4em] mb-4">
                        Authority Level: Sovereign
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                </div>

                <AdminDashboard
                    leagueId={id}
                    currentWeekNumber={currentWeekNumber}
                    totalWeeks={league.weeks.length}
                    isSeasonOver={isSeasonOver}
                    debugMatchups={activeWeek ? activeWeek.matchups : []}
                />

                <div className="space-y-6 pt-12">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <footer className="text-center space-y-2">
                        <p className="text-[10px] text-zinc-700 uppercase tracking-[.3em] font-black">
                            Secure Transmissions Active • Encryption Level 9
                        </p>
                        <p className="text-[9px] text-zinc-800 uppercase font-bold">
                            Fantasy Roguelite Temporal Management System v2.4.0
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
