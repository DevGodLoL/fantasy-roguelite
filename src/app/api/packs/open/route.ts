import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function sample<T>(arr: T[], n: number) {
  const copy = [...arr];
  copy.sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

export async function POST() {
  // For now: "current team" = Team A in Demo League, week = 1
  const league = await prisma.league.findFirst({ where: { name: "Demo League" } });
  if (!league) return NextResponse.json({ error: "Demo League not found" }, { status: 404 });

  const team = await prisma.team.findFirst({
    where: { leagueId: league.id, name: "Team A" },
  });
  if (!team) return NextResponse.json({ error: "Team A not found" }, { status: 404 });

  const week = await prisma.week.findFirst({
    where: { leagueId: league.id, number: 1 },
  });
  if (!week) return NextResponse.json({ error: "Week 1 not found" }, { status: 404 });

  const all = await prisma.powerup.findMany();

  // Basic rule: don't offer already-consumed powerups for this team/week
  const already = await prisma.teamPowerup.findMany({
    where: { teamId: team.id, weekId: week.id },
    select: { powerupId: true },
  });
  const alreadyIds = new Set(already.map((x) => x.powerupId));

  const eligible = all.filter((p) => !alreadyIds.has(p.id));
  const picks = sample(eligible.length >= 3 ? eligible : all, 3);

  return NextResponse.json({
    teamId: team.id,
    weekId: week.id,
    picks,
  });
}
