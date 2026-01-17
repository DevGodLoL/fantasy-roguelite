import Link from "next/link";
import { db } from "@/lib/prisma";

export default async function LeaguesPage() {
  const leagues = await db.league.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Leagues</h1>

      <ul className="mt-6 space-y-3">
        {leagues.map((l) => (
          <li key={l.id} className="rounded-xl border p-4">
            <Link className="underline" href={`/league/${l.id}`}>
              {l.name}
            </Link>
            <div className="mt-1 text-xs opacity-70">{l.id}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
