import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const league = await db.league.findFirst({
    include: {
      teams: true,
      weeks: true,
      matchups: true,
    },
  });

  return NextResponse.json({ league });
}
