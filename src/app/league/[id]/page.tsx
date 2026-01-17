import { db } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const league = await db.league.findUnique({
    where: { id },
    include: {
      teams: { include: { owner: true } },
      weeks: { orderBy: { number: "asc" } },
      matchups: {
        include: { week: true, homeTeam: true, awayTeam: true },
        orderBy: [{ week: { number: "asc" } }],
      },
      draft: true,
    },
  });

  if (!league) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-8 lg:p-16 space-y-16">
        {/* Breadcrumbs & Header */}
        <header className="space-y-4">
          <Link
            href="/leagues"
            className="text-zinc-500 hover:text-purple-400 transition-colors text-sm font-medium flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to All Leagues
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              {league.name}
            </h1>
            <div className="px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-500">
              ID: {league.id}
            </div>
            {league.draft?.status !== 'completed' ? (
              <Link
                href={`/league/${id}/draft`}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-full transition-all"
              >
                Go to Draft Room
              </Link>
            ) : (
              <div className="flex gap-3">
                <Link
                  href={`/league/${id}/schedule`}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs rounded-full transition-all"
                >
                  Schedule
                </Link>
                <Link
                  href={`/league/${id}/waivers`}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-full transition-all"
                >
                  Waiver Wire
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Teams Column */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-500/80">Competing Fractions</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
            </div>
            <div className="grid gap-4">
              {league.teams.map((t) => (
                <Link
                  key={t.id}
                  href={`/league/${id}/team/${t.id}`}
                  className="group relative block p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl transition-all hover:bg-zinc-900/60 hover:border-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-bold group-hover:text-purple-400 transition-colors">{t.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">
                        Lord: {t.owner?.displayName || t.owner?.email}
                      </div>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-800 group-hover:bg-purple-500/20 text-zinc-500 group-hover:text-purple-400 transition-all">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Schedule Column */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500/80">Chronicles of War</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>
            <div className="space-y-4">
              {league.weeks.map((w) => {
                const weekMatchups = league.matchups.filter(m => m.weekId === w.id);
                return (
                  <div key={w.id} className="p-6 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Week {w.number}</h3>
                      <Link
                        href={`/league/${id}/week/${w.number}`}
                        className="text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                      >
                        Enter Battlefield
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {weekMatchups.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-sm py-2 px-3 bg-white/5 rounded-lg">
                          <span className={m.homeScore > m.awayScore ? 'font-bold text-white' : 'text-zinc-500'}>{m.homeTeam.name}</span>
                          <span className="text-[10px] font-black text-zinc-700 mx-2">VS</span>
                          <span className={m.awayScore > m.homeScore ? 'font-bold text-white' : 'text-zinc-500'}>{m.awayTeam.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
