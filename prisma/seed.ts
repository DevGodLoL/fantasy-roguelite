import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// 1. Validate Env
const url = process.env.DATABASE_URL;
if (!url || url.trim() === "") {
  throw new Error("DATABASE_URL is missing or empty. Ensure .env exists and is loaded.");
}

// 2. Setup Adapter & Client
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 START SEED...");

  console.log("1) upserting demo user...");
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      displayName: "Demo User",
    },
  });
  console.log("   user id:", user.id);

  console.log("2) creating demo league...");
  const league = await prisma.league.upsert({
    where: { name: "Demo League" },
    update: {},
    create: { name: "Demo League" },
  });

  console.log("   league id:", league.id);

  console.log("3) Cleaning up existing demo data...");
  const existingLeague = await prisma.league.findUnique({
    where: { name: "Demo League" }
  });

  if (existingLeague) {
    // Delete children in order to avoid FK violations
    await prisma.teamPowerupOffer.deleteMany({
      where: { team: { leagueId: existingLeague.id } }
    });
    await prisma.teamPowerup.deleteMany({
      where: { team: { leagueId: existingLeague.id } }
    });
    await prisma.teamWeekStats.deleteMany({
      where: { team: { leagueId: existingLeague.id } }
    });
    await prisma.matchup.deleteMany({
      where: { leagueId: existingLeague.id }
    });
    await prisma.week.deleteMany({
      where: { leagueId: existingLeague.id }
    });
    await prisma.team.deleteMany({
      where: { leagueId: existingLeague.id }
    });
  }

  console.log("4) creating Team A...");
  const teamA = await prisma.team.create({
    data: { leagueId: league.id, ownerId: user.id, name: "Team A" },
  });
  console.log("   teamA id:", teamA.id);

  console.log("5) creating Team B (and User 2)...");
  const user2 = await prisma.user.upsert({
    where: { email: "demo2@example.com" },
    update: {},
    create: {
      email: "demo2@example.com",
      displayName: "Demo User 2",
    },
  });

  const teamB = await prisma.team.create({
    data: { leagueId: league.id, ownerId: user2.id, name: "Team B" },
  });
  console.log("   teamB id:", teamB.id);

  console.log("6) creating Week 1...");
  const week1 = await prisma.week.create({
    data: { leagueId: league.id, number: 1 },
  });
  console.log("   week1 id:", week1.id);

  console.log("   populating stats...");
  // Team A: 100/40/60 = 200 pts
  await prisma.teamWeekStats.create({
    data: {
      teamId: teamA.id,
      weekId: week1.id,
      passYds: 100,
      rushYds: 40,
      recYds: 60
    }
  });
  // Team B: 90/50/70 = 210 pts
  await prisma.teamWeekStats.create({
    data: {
      teamId: teamB.id,
      weekId: week1.id,
      passYds: 90,
      rushYds: 50,
      recYds: 70
    }
  });

  console.log("7) creating Matchup...");
  const matchup = await prisma.matchup.create({
    data: {
      leagueId: league.id,
      weekId: week1.id,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id,
      homeScore: 200,
      awayScore: 210,
    },
  });
  console.log("   matchup id:", matchup.id);

  console.log("8) upserting base powerups...");
  const powerups = [
    {
      code: "PASS_YDS_X15",
      name: "1.5x Passing Yards (next week)",
      description: "Multiply your QB passing yards by 1.5 for the next matchup.",
      value: 1.5,
    },
    {
      code: "RUSH_YDS_X15",
      name: "1.5x Rushing Yards (next week)",
      description: "Multiply your RB rushing yards by 1.5 for the next matchup.",
      value: 1.5,
    },
    {
      code: "REC_YDS_X15",
      name: "1.5x Receiving Yards (next week)",
      description: "Multiply your WR/TE receiving yards by 1.5 for the next matchup.",
      value: 1.5,
    },
    {
      code: "PLUS_10",
      name: "+10 points (next week)",
      description: "Add +10 points to your team score for the next matchup.",
      value: 10,
    },
  ];

  for (const p of powerups) {
    await prisma.powerup.upsert({
      where: { code: p.code },
      update: { name: p.name, description: p.description, value: p.value },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        value: p.value,
      },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
