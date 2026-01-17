import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      teams: { include: { owner: true } },
      weeks: { orderBy: { number: "asc" } },
      matchups: {
        include: { week: true, homeTeam: true, awayTeam: true },
        orderBy: [{ week: { number: "asc" } }],
      },
    },
  });

  if (!league) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p>League not found.</p>
        <Link className="underline" href="/leagues">
          Back to leagues
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <div className="space-y-2">
        <Link className="underline" href="/leagues">
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold">{league.name}</h1>
        <div className="text-sm opacity-70">{league.id}</div>
      </div>

      <section>
        <h2 className="text-xl font-semibold">Teams</h2>
        <ul className="mt-3 space-y-2">
          {league.teams.map((t) => (
            <li key={t.id} className="rounded-xl border p-4">
              <div className="font-medium">{t.name}</div>
              <div className="text-sm opacity-70">
                Owner: {t.owner?.displayName ?? t.owner?.email ?? t.ownerId}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Weeks</h2>
        <ul className="mt-3 space-y-2">
          {league.weeks.map((w) => (
            <li key={w.id} className="rounded-xl border p-4">
              <Link
                href={`/league/${id}/week/${w.number}`}
                className="underline"
              >
                Week {w.number}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Upcoming Matchups</h2>
        <p className="mt-2 text-gray-600">
          {league.matchups.filter((m) => m.status === "scheduled").length}{" "}
          scheduled matchup(s)
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Matchups</h2>
        <ul className="mt-3 space-y-2">
          {league.matchups.map((m) => (
            <li key={m.id} className="rounded-xl border p-4">
              <div className="text-sm opacity-70">Week {m.week.number}</div>
              <div className="font-medium">
                {m.homeTeam.name} vs {m.awayTeam.name}
              </div>
              <div className="text-sm opacity-70">
                {m.homeScore} – {m.awayScore} ({m.status})
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
