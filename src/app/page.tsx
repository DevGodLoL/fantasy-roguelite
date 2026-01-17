import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const leagues = await prisma.league.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 text-center lg:items-start lg:text-left">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
            Fantasy <span className="text-blue-600 dark:text-blue-400">Roguelite</span>
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-zinc-600 dark:text-zinc-400">
            A revolutionary fantasy football experience. Drafter your team, play your weekly cards, and dominate the league with legendary powerups.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          <Link
            href="/leagues"
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-black px-8 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
          >
            Enter League Hall
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center rounded-2xl border-2 border-zinc-200 px-8 text-lg font-bold transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            View Docs
          </a>
        </div>

        {leagues.length > 0 && (
          <div className="w-full space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Leagues</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/league/${league.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {league.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 font-mono">{league.id}</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-blue-500/5 transition-all group-hover:scale-150" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 text-zinc-400 text-sm">
        Built with Next.js, Prisma, and Roguelite Magic.
      </footer>
    </div>
  );
}
