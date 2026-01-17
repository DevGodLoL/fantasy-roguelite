import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const league = await prisma.league.findFirst({
    include: {
      teams: true,
      weeks: true,
      matchups: true,
    },
  });

  return NextResponse.json({ league });
}
