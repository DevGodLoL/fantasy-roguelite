import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const teamId = body?.teamId as string | undefined;
  const weekId = body?.weekId as string | undefined;
  const powerupId = body?.powerupId as string | undefined;

  if (!teamId || !weekId || !powerupId) {
    return NextResponse.json(
      { error: "Missing teamId, weekId, or powerupId" },
      { status: 400 }
    );
  }

  // Prevent duplicates for same team/week/powerup
  const existing = await prisma.teamPowerup.findFirst({
    where: { teamId, weekId, powerupId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, teamPowerup: existing, already: true });
  }

  const created = await prisma.teamPowerup.create({
    data: {
      teamId,
      weekId,
      powerupId,
      isConsumed: false,
    },
  });

  return NextResponse.json({ ok: true, teamPowerup: created });
}
