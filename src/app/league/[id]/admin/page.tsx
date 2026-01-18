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
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30">
            {/* Nav */}
            <div className="bg-zinc-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/league/${id}`} className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest">
                        ← Back to League
                    </Link>
                    <h1 className="text-xl font-black uppercase tracking-tighter text-red-500">League Admin</h1>
                </div>
            </div>

            <main className="max-w-2xl mx-auto p-6">
                <AdminDashboard
                    leagueId={id}
                    currentWeekNumber={currentWeekNumber}
                    totalWeeks={league.weeks.length}
                    isSeasonOver={isSeasonOver}
                    debugMatchups={activeWeek ? activeWeek.matchups : []}
                />
            </main>
        </div>
    );
}
