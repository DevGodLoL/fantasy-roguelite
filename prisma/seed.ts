import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import { resolve } from "path";

const root = process.cwd();
const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
let url = rawUrl;
let dbPath = "./dev.db";

if (rawUrl.startsWith("file:")) {
  dbPath = rawUrl.slice(rawUrl.indexOf(":") + 1);
  url = `file:${resolve(root, dbPath)}`;
}

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- SEEDING: THE REAL NFL 2025-2026 ROSTER ---");
  console.log("Using URL:", url);

  // Cleanup
  try {
    await prisma.waiverClaim.deleteMany();
    await prisma.draftPick.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.rosterSlot.deleteMany();
    await prisma.teamPowerup.deleteMany();
    await prisma.teamPowerupOffer.deleteMany();
    await prisma.matchup.deleteMany();
    await prisma.teamWeekStats.deleteMany();
    await prisma.week.deleteMany();
    await prisma.team.deleteMany();
    await prisma.leagueSettings.deleteMany();
    await prisma.leagueMember.deleteMany();
    await prisma.league.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();
    await prisma.powerup.deleteMany();
  } catch (e) {
    console.log("Cleanup warning (some tables may not exist yet):", (e as Error).message);
  }

  console.log("1) Creating Admin User...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@fantasy.com",
      displayName: "The Commissioner",
    },
  });

  console.log("2) Creating Demo League...");
  const league = await prisma.league.create({
    data: {
      name: "NFL Roguelite - Season 1",
    },
  });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: admin.id,
      role: "owner",
    },
  });

  await prisma.leagueSettings.create({
    data: {
      leagueId: league.id,
      rosterQB: 1,
      rosterRB: 2,
      rosterWR: 2,
      rosterTE: 1,
      rosterFLEX: 1,
      rosterDST: 1,
      rosterK: 1,
      bench: 6,
      initialFaab: 100,
    },
  });

  console.log("3) Creating 10 Teams...");
  const teamNames = [
    "The DevGods",
    "Metropolis Titans",
    "Gotham Knights",
    "Central City Speedsters",
    "Star City Archers",
    "Coast City Lanterns",
    "Atlantis Royals",
    "Themiscyra Warriors",
    "Wakanda Forever",
    "Asgardian Thunder"
  ];

  for (let i = 0; i < 10; i++) {
    const owner = await prisma.user.create({
      data: {
        email: `team${i + 1}@example.com`,
        displayName: `Manager ${i + 1}`,
      },
    });

    const team = await prisma.team.create({
      data: {
        leagueId: league.id,
        ownerId: owner.id,
        name: teamNames[i],
        faabBalance: 100,
        waiverPriority: i + 1,
      },
    });

    // Create standard roster slots
    const slots = [
      { type: "QB", count: 1 },
      { type: "RB", count: 2 },
      { type: "WR", count: 2 },
      { type: "TE", count: 1 },
      { type: "FLEX", count: 1 },
      { type: "DST", count: 1 },
      { type: "K", count: 1 },
      { type: "BENCH", count: 6 },
    ];

    for (const slot of slots) {
      for (let j = 0; j < slot.count; j++) {
        await prisma.rosterSlot.create({
          data: {
            teamId: team.id,
            slotType: slot.type,
            isStarter: slot.type !== "BENCH",
          },
        });
      }
    }
  }

  console.log("4) Seeding Real NFL Players (2025 Projections)...");

  const players = [
    // --- QUARTERBACKS ---
    { name: "Josh Allen", pos: "QB", team: "BUF" },
    { name: "Lamar Jackson", pos: "QB", team: "BAL" },
    { name: "Patrick Mahomes", pos: "QB", team: "KC" },
    { name: "Jalen Hurts", pos: "QB", team: "PHI" },
    { name: "C.J. Stroud", pos: "QB", team: "HOU" },
    { name: "Joe Burrow", pos: "QB", team: "CIN" },
    { name: "Jordan Love", pos: "QB", team: "GB" },
    { name: "Brock Purdy", pos: "QB", team: "SF" },
    { name: "Dak Prescott", pos: "QB", team: "DAL" },
    { name: "Anthony Richardson", pos: "QB", team: "IND" },
    { name: "Kyler Murray", pos: "QB", team: "ARI" },
    { name: "Caleb Williams", pos: "QB", team: "CHI" },
    { name: "Jayden Daniels", pos: "QB", team: "WAS" },
    { name: "Justin Herbert", pos: "QB", team: "LAC" },
    { name: "Jared Goff", pos: "QB", team: "DET" },
    { name: "Tua Tagovailoa", pos: "QB", team: "MIA" },
    { name: "Kirk Cousins", pos: "QB", team: "ATL" },
    { name: "Trevor Lawrence", pos: "QB", team: "JAX" },
    { name: "Aaron Rodgers", pos: "QB", team: "NYJ" },
    { name: "Matthew Stafford", pos: "QB", team: "LAR" },

    // --- RUNNING BACKS ---
    { name: "Christian McCaffrey", pos: "RB", team: "SF" },
    { name: "Bijan Robinson", pos: "RB", team: "ATL" },
    { name: "Breece Hall", pos: "RB", team: "NYJ" },
    { name: "Jahmyr Gibbs", pos: "RB", team: "DET" },
    { name: "Saquon Barkley", pos: "RB", team: "PHI" },
    { name: "Jonathan Taylor", pos: "RB", team: "IND" },
    { name: "Kyren Williams", pos: "RB", team: "LAR" },
    { name: "Travis Etienne Jr.", pos: "RB", team: "JAX" },
    { name: "Derrick Henry", pos: "RB", team: "BAL" },
    { name: "Isiah Pacheco", pos: "RB", team: "KC" },
    { name: "James Cook", pos: "RB", team: "BUF" },
    { name: "Rachaad White", pos: "RB", team: "TB" },
    { name: "Joe Mixon", pos: "RB", team: "HOU" },
    { name: "Alvin Kamara", pos: "RB", team: "NO" },
    { name: "Kenneth Walker III", pos: "RB", team: "SEA" },
    { name: "De'Von Achane", pos: "RB", team: "MIA" },
    { name: "Josh Jacobs", pos: "RB", team: "GB" },
    { name: "D'Andre Swift", pos: "RB", team: "CHI" },
    { name: "James Conner", pos: "RB", team: "ARI" },
    { name: "David Montgomery", pos: "RB", team: "DET" },
    { name: "Najee Harris", pos: "RB", team: "PIT" },
    { name: "Brian Robinson Jr.", pos: "RB", team: "WAS" },
    { name: "Raheem Mostert", pos: "RB", team: "MIA" },
    { name: "Jonathon Brooks", pos: "RB", team: "CAR" },
    { name: "Zack Moss", pos: "RB", team: "CIN" },
    { name: "Javonte Williams", pos: "RB", team: "DEN" },
    { name: "Nick Chubb", pos: "RB", team: "CLE" },
    { name: "Aaron Jones", pos: "RB", team: "MIN" },
    { name: "Tony Pollard", pos: "RB", team: "TEN" },
    { name: "Rhamondre Stevenson", pos: "RB", team: "NE" },
    { name: "Zamir White", pos: "RB", team: "LV" },
    { name: "Jerome Ford", pos: "RB", team: "CLE" },
    { name: "Jaylen Warren", pos: "RB", team: "PIT" },
    { name: "Tyjae Spears", pos: "RB", team: "TEN" },
    { name: "Chuba Hubbard", pos: "RB", team: "CAR" },

    // --- WIDE RECEIVERS ---
    { name: "Justin Jefferson", pos: "WR", team: "MIN" },
    { name: "CeeDee Lamb", pos: "WR", team: "DAL" },
    { name: "Ja'Marr Chase", pos: "WR", team: "CIN" },
    { name: "Tyreek Hill", pos: "WR", team: "MIA" },
    { name: "Amon-Ra St. Brown", pos: "WR", team: "DET" },
    { name: "A.J. Brown", pos: "WR", team: "PHI" },
    { name: "Puka Nacua", pos: "WR", team: "LAR" },
    { name: "Garrett Wilson", pos: "WR", team: "NYJ" },
    { name: "Marvin Harrison Jr.", pos: "WR", team: "ARI" },
    { name: "Drake London", pos: "WR", team: "ATL" },
    { name: "Chris Olave", pos: "WR", team: "NO" },
    { name: "Nico Collins", pos: "WR", team: "HOU" },
    { name: "Davante Adams", pos: "WR", team: "NYJ" },
    { name: "Brandon Aiyuk", pos: "WR", team: "SF" },
    { name: "Michael Pittman Jr.", pos: "WR", team: "IND" },
    { name: "Mike Evans", pos: "WR", team: "TB" },
    { name: "Deebo Samuel Sr.", pos: "WR", team: "SF" },
    { name: "Stefon Diggs", pos: "WR", team: "HOU" },
    { name: "Jaylen Waddle", pos: "WR", team: "MIA" },
    { name: "Cooper Kupp", pos: "WR", team: "LAR" },
    { name: "DeVonta Smith", pos: "WR", team: "PHI" },
    { name: "DK Metcalf", pos: "WR", team: "SEA" },
    { name: "Zay Flowers", pos: "WR", team: "BAL" },
    { name: "Malik Nabers", pos: "WR", team: "NYG" },
    { name: "George Pickens", pos: "WR", team: "PIT" },
    { name: "Tank Dell", pos: "WR", team: "HOU" },
    { name: "Tee Higgins", pos: "WR", team: "CIN" },
    { name: "Jordan Addison", pos: "WR", team: "MIN" },
    { name: "Terry McLaurin", pos: "WR", team: "WAS" },
    { name: "Keenan Allen", pos: "WR", team: "CHI" },
    { name: "Amari Cooper", pos: "WR", team: "BUF" },
    { name: "Rashee Rice", pos: "WR", team: "KC" },
    { name: "Christian Kirk", pos: "WR", team: "JAX" },
    { name: "Chris Godwin", pos: "WR", team: "TB" },
    { name: "Xavier Worthy", pos: "WR", team: "KC" },

    // --- TIGHT ENDS ---
    { name: "Sam LaPorta", pos: "TE", team: "DET" },
    { name: "Travis Kelce", pos: "TE", team: "KC" },
    { name: "Mark Andrews", pos: "TE", team: "BAL" },
    { name: "Trey McBride", pos: "TE", team: "ARI" },
    { name: "Dalton Kincaid", pos: "TE", team: "BUF" },
    { name: "George Kittle", pos: "TE", team: "SF" },
    { name: "Kyle Pitts", pos: "TE", team: "ATL" },
    { name: "Evan Engram", pos: "TE", team: "JAX" },
    { name: "Jake Ferguson", pos: "TE", team: "DAL" },
    { name: "Brock Bowers", pos: "TE", team: "LV" },
    { name: "Dallas Goedert", pos: "TE", team: "PHI" },
    { name: "David Njoku", pos: "TE", team: "CLE" },
    { name: "Cole Kmet", pos: "TE", team: "CHI" },
    { name: "Dalton Schultz", pos: "TE", team: "HOU" },
    { name: "T.J. Hockenson", pos: "TE", team: "MIN" },
    { name: "Pat Freiermuth", pos: "TE", team: "PIT" },
    { name: "Taysom Hill", pos: "TE", team: "NO" },
    { name: "Hunter Henry", pos: "TE", team: "NE" },
    { name: "Jonnu Smith", pos: "TE", team: "MIA" },
    { name: "Gerald Everett", pos: "TE", team: "CHI" },
    { name: "Cade Otton", pos: "TE", team: "TB" },
    { name: "Mike Gesicki", pos: "TE", team: "CIN" },
    { name: "Noah Fant", pos: "TE", team: "SEA" },

    // Additional QBs for depth
    { name: "Deshaun Watson", pos: "QB", team: "CLE" },
    { name: "Geno Smith", pos: "QB", team: "SEA" },
    { name: "Derek Carr", pos: "QB", team: "NO" },
    { name: "Baker Mayfield", pos: "QB", team: "TB" },
    { name: "Sam Darnold", pos: "QB", team: "MIN" },

    // --- DEFENSE / SPECIAL TEAMS ---
    { name: "Browns DST", pos: "DST", team: "CLE" },
    { name: "Cowboys DST", pos: "DST", team: "DAL" },
    { name: "Ravens DST", pos: "DST", team: "BAL" },
    { name: "49ers DST", pos: "DST", team: "SF" },
    { name: "Jets DST", pos: "DST", team: "NYJ" },
    { name: "Bills DST", pos: "DST", team: "BUF" },
    { name: "Steelers DST", pos: "DST", team: "PIT" },
    { name: "Chiefs DST", pos: "DST", team: "KC" },
    { name: "Dolphins DST", pos: "DST", team: "MIA" },
    { name: "Saints DST", pos: "DST", team: "NO" },
    { name: "Texans DST", pos: "DST", team: "HOU" },
    { name: "Lions DST", pos: "DST", team: "DET" },
    { name: "Eagles DST", pos: "DST", team: "PHI" },
    { name: "Broncos DST", pos: "DST", team: "DEN" },
    { name: "Patriots DST", pos: "DST", team: "NE" },
    { name: "Chargers DST", pos: "DST", team: "LAC" },

    // --- KICKERS ---
    { name: "Brandon Aubrey", pos: "K", team: "DAL" },
    { name: "Justin Tucker", pos: "K", team: "BAL" },
    { name: "Harrison Butker", pos: "K", team: "KC" },
    { name: "Jake Elliott", pos: "K", team: "PHI" },
    { name: "Tyler Bass", pos: "K", team: "BUF" },
    { name: "Younghoe Koo", pos: "K", team: "ATL" },
    { name: "Jason Sanders", pos: "K", team: "MIA" },
    { name: "Evan McPherson", pos: "K", team: "CIN" },
    { name: "Cameron Dicker", pos: "K", team: "LAC" },
    { name: "Jake Moody", pos: "K", team: "SF" },
    { name: "Chris Boswell", pos: "K", team: "PIT" },
    { name: "Ka'imi Fairbairn", pos: "K", team: "HOU" },
    { name: "Matt Gay", pos: "K", team: "IND" },
    { name: "Cairo Santos", pos: "K", team: "CHI" },
    { name: "Daniel Carlson", pos: "K", team: "LV" },
    { name: "Blake Grupe", pos: "K", team: "NO" },
  ];

  for (const p of players) {
    await prisma.player.create({
      data: {
        name: p.name,
        position: p.pos,
        teamAbbr: p.team,
        nflPlayerId: `real_${p.name.toLowerCase().replace(/ /g, "_")}`,
      },
    });
  }

  console.log("5) Initializing the Draft...");
  await prisma.draft.create({
    data: {
      leagueId: league.id,
      status: "pre_draft",
      format: "snake",
      currentPick: 1,
    },
  });

  console.log("6) Upserting Powerups...");
  const powerups = [
    {
      code: "XP_BOOST_15",
      name: "Experience Relic",
      description: "Multiply this week's total score by 1.15x.",
      rarity: "rare",
      kind: "multiplier",
      value: 1.15,
    },
    {
      code: "PASS_TD_BONUS_2",
      name: "Quarterback's Tome",
      description: "Earn +2 points for every Passing TD this week.",
      rarity: "common",
      kind: "bonus_points",
      value: 2.0,
    },
    {
      code: "CURSE_OF_THE_FUMBLE",
      name: "Cursed Totem",
      description: "Opponent loses 5 points for every fumble lost.",
      rarity: "epic",
      scope: "opponent",
      kind: "penalty",
      value: 5.0,
    },
  ];

  for (const p of powerups) {
    await prisma.powerup.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  console.log("--- SEEDING COMPLETE ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
