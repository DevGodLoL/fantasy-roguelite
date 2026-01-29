import "dotenv/config";
import { PrismaClient } from "../src/generated/client";
import { resolve } from "path";

// --- DATABASE PATH UNIFICATION ---
// Use the environment variable if present, otherwise default to prisma/dev.db
const root = process.cwd();
const defaultPath = resolve(root, "prisma/dev.db");
const url = process.env.DATABASE_URL || `file:${defaultPath}`;

console.log(`[Seed] Connecting to database at: ${url}`);

const prisma = new PrismaClient({
  datasources: { db: { url } }
});

async function main() {
  console.log("--- SEEDING: THE REAL NFL 2025-2026 ROSTER ---");
  console.log("Using URL:", url);

  // Cleanup
  try {
    await prisma.league.updateMany({
      data: {
        championTeamId: null,
        consolationWinnerId: null
      }
    });
    await prisma.teamTitle.deleteMany();
    await prisma.teamMission.deleteMany();
    await prisma.teamPowerup.deleteMany();
    await prisma.teamPowerupOffer.deleteMany();
    await prisma.leagueTransaction.deleteMany();
    await prisma.waiverClaim.deleteMany();
    await prisma.draftPick.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.rosterSlot.deleteMany();
    await prisma.matchup.deleteMany();
    await prisma.teamWeekStats.deleteMany();
    await prisma.playerPerformance.deleteMany();
    await prisma.playerTrait.deleteMany();
    await prisma.week.deleteMany();
    await prisma.team.deleteMany();
    await prisma.leagueSettings.deleteMany();
    await prisma.leagueMember.deleteMany();
    await prisma.league.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();
    await prisma.powerup.deleteMany();
  } catch (e) {
    console.log("Cleanup warning:", (e as Error).message);
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
      ownerId: admin.id,
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
      rosterFlex: 1,
      rosterDST: 1,
      rosterK: 1,
      rosterBench: 6,
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

  console.log("4) Seeding Real NFL Players (2025 Projections with ADP)...");

  // Players with ADP (Average Draft Position) for 2025-2026 season
  // ADP based on 10-team PPR league rankings
  const players = [
    // --- TOP TIER (ADP 1-12) - First Round ---
    { name: "Christian McCaffrey", pos: "RB", team: "SF", adp: 1.0 },
    { name: "CeeDee Lamb", pos: "WR", team: "DAL", adp: 2.0 },
    { name: "Ja'Marr Chase", pos: "WR", team: "CIN", adp: 3.0 },
    { name: "Tyreek Hill", pos: "WR", team: "MIA", adp: 4.0 },
    { name: "Bijan Robinson", pos: "RB", team: "ATL", adp: 5.0 },
    { name: "Breece Hall", pos: "RB", team: "NYJ", adp: 6.0 },
    { name: "Justin Jefferson", pos: "WR", team: "MIN", adp: 7.0 },
    { name: "Amon-Ra St. Brown", pos: "WR", team: "DET", adp: 8.0 },
    { name: "Jahmyr Gibbs", pos: "RB", team: "DET", adp: 9.0 },
    { name: "A.J. Brown", pos: "WR", team: "PHI", adp: 10.0 },
    { name: "Saquon Barkley", pos: "RB", team: "PHI", adp: 11.0 },
    { name: "Puka Nacua", pos: "WR", team: "LAR", adp: 12.0 },

    // --- SECOND ROUND (ADP 13-24) ---
    { name: "Jonathan Taylor", pos: "RB", team: "IND", adp: 13.0 },
    { name: "Garrett Wilson", pos: "WR", team: "NYJ", adp: 14.0 },
    { name: "Marvin Harrison Jr.", pos: "WR", team: "ARI", adp: 15.0 },
    { name: "De'Von Achane", pos: "RB", team: "MIA", adp: 16.0 },
    { name: "Kyren Williams", pos: "RB", team: "LAR", adp: 17.0 },
    { name: "Derrick Henry", pos: "RB", team: "BAL", adp: 18.0 },
    { name: "Travis Etienne Jr.", pos: "RB", team: "JAX", adp: 19.0 },
    { name: "Drake London", pos: "WR", team: "ATL", adp: 20.0 },
    { name: "Chris Olave", pos: "WR", team: "NO", adp: 21.0 },
    { name: "Nico Collins", pos: "WR", team: "HOU", adp: 22.0 },
    { name: "Davante Adams", pos: "WR", team: "NYJ", adp: 23.0 },
    { name: "Malik Nabers", pos: "WR", team: "NYG", adp: 24.0 },

    // --- THIRD ROUND (ADP 25-36) ---
    { name: "Isiah Pacheco", pos: "RB", team: "KC", adp: 25.0 },
    { name: "Josh Allen", pos: "QB", team: "BUF", adp: 26.0 },
    { name: "James Cook", pos: "RB", team: "BUF", adp: 27.0 },
    { name: "Brandon Aiyuk", pos: "WR", team: "SF", adp: 28.0 },
    { name: "Sam LaPorta", pos: "TE", team: "DET", adp: 29.0 },
    { name: "Jalen Hurts", pos: "QB", team: "PHI", adp: 30.0 },
    { name: "Mike Evans", pos: "WR", team: "TB", adp: 31.0 },
    { name: "Deebo Samuel Sr.", pos: "WR", team: "SF", adp: 32.0 },
    { name: "Travis Kelce", pos: "TE", team: "KC", adp: 33.0 },
    { name: "Jaylen Waddle", pos: "WR", team: "MIA", adp: 34.0 },
    { name: "Lamar Jackson", pos: "QB", team: "BAL", adp: 35.0 },
    { name: "Stefon Diggs", pos: "WR", team: "HOU", adp: 36.0 },

    // --- FOURTH ROUND (ADP 37-48) ---
    { name: "Joe Mixon", pos: "RB", team: "HOU", adp: 37.0 },
    { name: "Patrick Mahomes", pos: "QB", team: "KC", adp: 38.0 },
    { name: "Cooper Kupp", pos: "WR", team: "LAR", adp: 39.0 },
    { name: "DeVonta Smith", pos: "WR", team: "PHI", adp: 40.0 },
    { name: "Rachaad White", pos: "RB", team: "TB", adp: 41.0 },
    { name: "Alvin Kamara", pos: "RB", team: "NO", adp: 42.0 },
    { name: "Kenneth Walker III", pos: "RB", team: "SEA", adp: 43.0 },
    { name: "Mark Andrews", pos: "TE", team: "BAL", adp: 44.0 },
    { name: "DK Metcalf", pos: "WR", team: "SEA", adp: 45.0 },
    { name: "Zay Flowers", pos: "WR", team: "BAL", adp: 46.0 },
    { name: "George Pickens", pos: "WR", team: "PIT", adp: 47.0 },
    { name: "C.J. Stroud", pos: "QB", team: "HOU", adp: 48.0 },

    // --- FIFTH ROUND (ADP 49-60) ---
    { name: "Josh Jacobs", pos: "RB", team: "GB", adp: 49.0 },
    { name: "Tank Dell", pos: "WR", team: "HOU", adp: 50.0 },
    { name: "Tee Higgins", pos: "WR", team: "CIN", adp: 51.0 },
    { name: "Trey McBride", pos: "TE", team: "ARI", adp: 52.0 },
    { name: "D'Andre Swift", pos: "RB", team: "CHI", adp: 53.0 },
    { name: "Dalton Kincaid", pos: "TE", team: "BUF", adp: 54.0 },
    { name: "Jordan Addison", pos: "WR", team: "MIN", adp: 55.0 },
    { name: "Joe Burrow", pos: "QB", team: "CIN", adp: 56.0 },
    { name: "Terry McLaurin", pos: "WR", team: "WAS", adp: 57.0 },
    { name: "George Kittle", pos: "TE", team: "SF", adp: 58.0 },
    { name: "Michael Pittman Jr.", pos: "WR", team: "IND", adp: 59.0 },
    { name: "James Conner", pos: "RB", team: "ARI", adp: 60.0 },

    // --- SIXTH ROUND (ADP 61-72) ---
    { name: "Keenan Allen", pos: "WR", team: "CHI", adp: 61.0 },
    { name: "Anthony Richardson", pos: "QB", team: "IND", adp: 62.0 },
    { name: "Amari Cooper", pos: "WR", team: "BUF", adp: 63.0 },
    { name: "David Montgomery", pos: "RB", team: "DET", adp: 64.0 },
    { name: "Rashee Rice", pos: "WR", team: "KC", adp: 65.0 },
    { name: "Jayden Daniels", pos: "QB", team: "WAS", adp: 66.0 },
    { name: "Christian Kirk", pos: "WR", team: "JAX", adp: 67.0 },
    { name: "Caleb Williams", pos: "QB", team: "CHI", adp: 68.0 },
    { name: "Chris Godwin", pos: "WR", team: "TB", adp: 69.0 },
    { name: "Najee Harris", pos: "RB", team: "PIT", adp: 70.0 },
    { name: "Kyle Pitts", pos: "TE", team: "ATL", adp: 71.0 },
    { name: "Jordan Love", pos: "QB", team: "GB", adp: 72.0 },

    // --- SEVENTH ROUND (ADP 73-84) ---
    { name: "Brian Robinson Jr.", pos: "RB", team: "WAS", adp: 73.0 },
    { name: "Xavier Worthy", pos: "WR", team: "KC", adp: 74.0 },
    { name: "Brock Purdy", pos: "QB", team: "SF", adp: 75.0 },
    { name: "Evan Engram", pos: "TE", team: "JAX", adp: 76.0 },
    { name: "Tony Pollard", pos: "RB", team: "TEN", adp: 77.0 },
    { name: "Jake Ferguson", pos: "TE", team: "DAL", adp: 78.0 },
    { name: "Jonathon Brooks", pos: "RB", team: "CAR", adp: 79.0 },
    { name: "Rhamondre Stevenson", pos: "RB", team: "NE", adp: 80.0 },
    { name: "Dak Prescott", pos: "QB", team: "DAL", adp: 81.0 },
    { name: "Aaron Jones", pos: "RB", team: "MIN", adp: 82.0 },
    { name: "Brock Bowers", pos: "TE", team: "LV", adp: 83.0 },
    { name: "Kyler Murray", pos: "QB", team: "ARI", adp: 84.0 },

    // --- EIGHTH ROUND (ADP 85-96) ---
    { name: "Nick Chubb", pos: "RB", team: "CLE", adp: 85.0 },
    { name: "Dallas Goedert", pos: "TE", team: "PHI", adp: 86.0 },
    { name: "Raheem Mostert", pos: "RB", team: "MIA", adp: 87.0 },
    { name: "Zack Moss", pos: "RB", team: "CIN", adp: 88.0 },
    { name: "Justin Herbert", pos: "QB", team: "LAC", adp: 89.0 },
    { name: "David Njoku", pos: "TE", team: "CLE", adp: 90.0 },
    { name: "Javonte Williams", pos: "RB", team: "DEN", adp: 91.0 },
    { name: "Jared Goff", pos: "QB", team: "DET", adp: 92.0 },
    { name: "Cole Kmet", pos: "TE", team: "CHI", adp: 93.0 },
    { name: "Tua Tagovailoa", pos: "QB", team: "MIA", adp: 94.0 },
    { name: "Chuba Hubbard", pos: "RB", team: "CAR", adp: 95.0 },
    { name: "Zamir White", pos: "RB", team: "LV", adp: 96.0 },

    // --- NINTH ROUND (ADP 97-108) ---
    { name: "Dalton Schultz", pos: "TE", team: "HOU", adp: 97.0 },
    { name: "Jerome Ford", pos: "RB", team: "CLE", adp: 98.0 },
    { name: "T.J. Hockenson", pos: "TE", team: "MIN", adp: 99.0 },
    { name: "Jaylen Warren", pos: "RB", team: "PIT", adp: 100.0 },
    { name: "Tyjae Spears", pos: "RB", team: "TEN", adp: 101.0 },
    { name: "Pat Freiermuth", pos: "TE", team: "PIT", adp: 102.0 },
    { name: "Kirk Cousins", pos: "QB", team: "ATL", adp: 103.0 },
    { name: "Trevor Lawrence", pos: "QB", team: "JAX", adp: 104.0 },
    { name: "Taysom Hill", pos: "TE", team: "NO", adp: 105.0 },
    { name: "Baker Mayfield", pos: "QB", team: "TB", adp: 106.0 },
    { name: "Hunter Henry", pos: "TE", team: "NE", adp: 107.0 },
    { name: "Aaron Rodgers", pos: "QB", team: "NYJ", adp: 108.0 },

    // --- TENTH ROUND (ADP 109-120) ---
    { name: "Matthew Stafford", pos: "QB", team: "LAR", adp: 109.0 },
    { name: "Jonnu Smith", pos: "TE", team: "MIA", adp: 110.0 },
    { name: "Sam Darnold", pos: "QB", team: "MIN", adp: 111.0 },
    { name: "Deshaun Watson", pos: "QB", team: "CLE", adp: 112.0 },
    { name: "Gerald Everett", pos: "TE", team: "CHI", adp: 113.0 },
    { name: "Geno Smith", pos: "QB", team: "SEA", adp: 114.0 },
    { name: "Cade Otton", pos: "TE", team: "TB", adp: 115.0 },
    { name: "Derek Carr", pos: "QB", team: "NO", adp: 116.0 },
    { name: "Mike Gesicki", pos: "TE", team: "CIN", adp: 117.0 },
    { name: "Noah Fant", pos: "TE", team: "SEA", adp: 118.0 },

    // --- DEFENSE / SPECIAL TEAMS (ADP 120-150) ---
    { name: "49ers DST", pos: "DST", team: "SF", adp: 120.0 },
    { name: "Browns DST", pos: "DST", team: "CLE", adp: 122.0 },
    { name: "Cowboys DST", pos: "DST", team: "DAL", adp: 124.0 },
    { name: "Ravens DST", pos: "DST", team: "BAL", adp: 126.0 },
    { name: "Jets DST", pos: "DST", team: "NYJ", adp: 128.0 },
    { name: "Bills DST", pos: "DST", team: "BUF", adp: 130.0 },
    { name: "Steelers DST", pos: "DST", team: "PIT", adp: 132.0 },
    { name: "Chiefs DST", pos: "DST", team: "KC", adp: 134.0 },
    { name: "Dolphins DST", pos: "DST", team: "MIA", adp: 136.0 },
    { name: "Saints DST", pos: "DST", team: "NO", adp: 138.0 },
    { name: "Texans DST", pos: "DST", team: "HOU", adp: 140.0 },
    { name: "Lions DST", pos: "DST", team: "DET", adp: 142.0 },
    { name: "Eagles DST", pos: "DST", team: "PHI", adp: 144.0 },
    { name: "Broncos DST", pos: "DST", team: "DEN", adp: 146.0 },
    { name: "Patriots DST", pos: "DST", team: "NE", adp: 148.0 },
    { name: "Chargers DST", pos: "DST", team: "LAC", adp: 150.0 },

    // --- KICKERS (ADP 130-160) ---
    { name: "Brandon Aubrey", pos: "K", team: "DAL", adp: 131.0 },
    { name: "Justin Tucker", pos: "K", team: "BAL", adp: 133.0 },
    { name: "Harrison Butker", pos: "K", team: "KC", adp: 135.0 },
    { name: "Jake Elliott", pos: "K", team: "PHI", adp: 137.0 },
    { name: "Tyler Bass", pos: "K", team: "BUF", adp: 139.0 },
    { name: "Younghoe Koo", pos: "K", team: "ATL", adp: 141.0 },
    { name: "Jason Sanders", pos: "K", team: "MIA", adp: 143.0 },
    { name: "Evan McPherson", pos: "K", team: "CIN", adp: 145.0 },
    { name: "Cameron Dicker", pos: "K", team: "LAC", adp: 147.0 },
    { name: "Jake Moody", pos: "K", team: "SF", adp: 149.0 },
    { name: "Chris Boswell", pos: "K", team: "PIT", adp: 151.0 },
    { name: "Ka'imi Fairbairn", pos: "K", team: "HOU", adp: 153.0 },
    { name: "Matt Gay", pos: "K", team: "IND", adp: 155.0 },
    { name: "Cairo Santos", pos: "K", team: "CHI", adp: 157.0 },
    { name: "Daniel Carlson", pos: "K", team: "LV", adp: 159.0 },
    { name: "Blake Grupe", pos: "K", team: "NO", adp: 161.0 },
  ];

  for (const p of players) {
    await prisma.player.create({
      data: {
        name: p.name,
        position: p.pos,
        teamAbbr: p.team,
        adp: p.adp,
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
    },
  });

  console.log("6) Upserting Powerups...");
  const powerups = [
    // === LEGENDARY TIER ===
    {
      code: "INFINITY_GAUNTLET",
      name: "Infinity Gauntlet",
      description: "Doubles your entire team's score this week. Ultimate power.",
      rarity: "legendary",
      kind: "points_multiplier",
      value: 2.0,
    },
    {
      code: "PHOENIX_REBIRTH",
      name: "Phoenix Rebirth",
      description: "If you lose this week, gain +50 bonus points. Rise from the ashes.",
      rarity: "legendary",
      kind: "points_flat",
      value: 50.0,
    },

    // === EPIC TIER ===
    {
      code: "CURSE_OF_THE_FUMBLE",
      name: "Cursed Totem",
      description: "Opponent loses 5 points for every fumble lost.",
      rarity: "epic",
      scope: "opponent",
      kind: "points_flat_penalty",
      value: 5.0,
    },
    {
      code: "DARK_RITUAL",
      name: "Dark Ritual",
      description: "Sacrifice 20 points to reduce opponent's score by 30.",
      rarity: "epic",
      scope: "opponent",
      kind: "points_flat_penalty",
      value: 30.0,
    },
    {
      code: "BERSERKER_RAGE",
      name: "Berserker Rage",
      description: "1.25x multiplier on total score. Unleash the fury.",
      rarity: "epic",
      kind: "points_multiplier",
      value: 1.25,
    },

    // === RARE TIER ===
    {
      code: "XP_BOOST_15",
      name: "Experience Relic",
      description: "Multiply this week's total score by 1.15x.",
      rarity: "rare",
      kind: "points_multiplier",
      value: 1.15,
    },
    {
      code: "PASS_YDS_X15",
      name: "Aerial Assault",
      description: "1.5x multiplier on passing yards.",
      rarity: "rare",
      kind: "points_multiplier",
      value: 1.5,
    },
    {
      code: "RUSH_YDS_X15",
      name: "Ground Game",
      description: "1.5x multiplier on rushing yards.",
      rarity: "rare",
      kind: "points_multiplier",
      value: 1.5,
    },
    {
      code: "REC_YDS_X15",
      name: "Sticky Hands",
      description: "1.5x multiplier on receiving yards.",
      rarity: "rare",
      kind: "points_multiplier",
      value: 1.5,
    },
    {
      code: "TD_CELEBRATION",
      name: "Touchdown Dance",
      description: "+3 bonus points per touchdown scored by your team.",
      rarity: "rare",
      kind: "points_flat",
      value: 3.0,
    },

    // === COMMON TIER ===
    {
      code: "PASS_TD_BONUS_2",
      name: "Quarterback's Tome",
      description: "Earn +2 points for every Passing TD this week.",
      rarity: "common",
      kind: "points_flat",
      value: 2.0,
    },
    {
      code: "PLUS_10",
      name: "Small Blessing",
      description: "Add 10 bonus points this week.",
      rarity: "common",
      kind: "points_flat",
      value: 10.0,
    },
    {
      code: "LUCKY_CHARM",
      name: "Lucky Charm",
      description: "+5 bonus points. A little luck goes a long way.",
      rarity: "common",
      kind: "points_flat",
      value: 5.0,
    },
    {
      code: "IRON_WILL",
      name: "Iron Will",
      description: "1.05x multiplier. Consistency is key.",
      rarity: "common",
      kind: "points_multiplier",
      value: 1.05,
    },
    {
      code: "TITAN_SLAYER",
      name: "Titan Slayer",
      description: "Deals massive damage to Bosses. +40 pts in Playoff matchups.",
      rarity: "epic",
      kind: "bonus_points",
      value: 40.0,
      isPlayoffOnly: true,
    },
    {
      code: "relic_necromancy",
      name: "Tome of Necromancy",
      description: "1.5x multiplier for TEs, but 0.9x for WRs. Dark power has a price.",
      rarity: "epic",
      type: "relic",
      price: 150,
    },
    {
      code: "relic_vampire_fang",
      name: "Vampire Fang",
      description: "DST gains +5 bonus points per game. Siphoning essence.",
      rarity: "rare",
      type: "relic",
      price: 100,
    },
    {
      code: "relic_rush_bonus",
      name: "Boots of Haste",
      description: "Gain +1 point for every 10 rushing yards. Speed is key.",
      rarity: "rare",
      type: "relic",
      price: 120,
    },
    {
      code: "AEGIS_OF_CHAMPIONS",
      name: "Aegis of Champions",
      description: "Reduces opponent's score by 25% in the Playoffs.",
      rarity: "legendary",
      scope: "opponent",
      kind: "multiplier",
      value: 0.75,
      isPlayoffOnly: true,
    },
  ];

  for (const p of powerups) {
    await prisma.powerup.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  console.log("7) Creating Season Weeks...");
  for (let i = 1; i <= 18; i++) {
    await prisma.week.create({
      data: {
        leagueId: league.id,
        number: i,
      },
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
