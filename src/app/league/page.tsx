import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LeaguePage() {
  // Redirect to the first available league
  const league = await db.league.findFirst();
  if (league) {
    redirect(`/league/${league.id}`);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">No Leagues Found</h1>
        <p className="text-zinc-500">Create a league to get started.</p>
      </div>
    </main>
  );
}
