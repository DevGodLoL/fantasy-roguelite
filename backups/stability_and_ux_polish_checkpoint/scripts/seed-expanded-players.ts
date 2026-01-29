import { db } from '../src/lib/prisma';

const NAMES = {
    QB: ['J. Burrow', 'L. Jackson', 'J. Fields', 'T. Lawrence', 'D. Prescott', 'K. Cousins', 'J. Goff', 'G. Smith', 'R. Wilson', 'M. Stafford', 'A. Rodgers', 'D. Watson', 'K. Murray', 'J. Love', 'B. Mayfield', 'D. Carr', 'B. Young', 'C. Stroud', 'A. Richardson', 'W. Levis', 'S. Howell', 'D. Jones', 'R. Tannehill', 'J. Garoppolo', 'K. Pickett', 'B. Purdy', 'T. Tagovailoa', 'J. Herbert', 'P. Mahomes', 'J. Allen', 'J. Hurts'],
    RB: ['C. McCaffrey', 'N. Chubb', 'S. Barkley', 'J. Jacobs', 'D. Henry', 'T. Pollard', 'J. Mixon', 'A. Kamara', 'R. Stevenson', 'N. Harris', 'T. Etienne', 'K. Walker', 'B. Hall', 'D. Pierce', 'J. Cook', 'J. Williams', 'D. Swift', 'R. White', 'I. Pacheco', 'B. Robinson', 'A. Gibson', 'A. Dillon', 'E. Elliott', 'D. Cook', 'K. Herbert', 'S. Perine', 'J. McKinnon', 'D. Foreman', 'C. Hubbard', 'T. Allgeier', 'Z. Charbonnet', 'D. Achane', 'T. Spears', 'R. Johnson', 'K. Miller', 'Z. Moss', 'Chuba Hubbard', 'K. Williams'],
    WR: ['D. Adams', 'A.J. Brown', 'S. Diggs', 'C. Kupp', 'T. Hill', 'J. Chase', 'J. Jefferson', 'A. St. Brown', 'G. Wilson', 'C. Olave', 'D. Smith', 'J. Waddle', 'T. Higgins', 'A. Cooper', 'K. Allen', 'M. Williams', 'C. Ridley', 'D. Samuel', 'B. Aiyuk', 'T. Lockett', 'D. Metcalf', 'C. Godwin', 'M. Evans', 'D. Moore', 'J. Dotson', 'G. Pickens', 'C. Watson', 'J. Jeudy', 'C. Sutton', 'M. Brown', 'T. Burks', 'R. Doubs', 'G. Davis', 'J. Smith-Schuster', 'O. Beckham', 'Z. Flowers', 'J. Addison', 'Q. Johnston', 'J. Reed', 'R. Rice', 'T. Dell', 'M. Wilson', 'D. Douglas'],
    TE: ['T. Kelce', 'M. Andrews', 'T. Hockenson', 'G. Kittle', 'D. Goedert', 'D. Waller', 'K. Pitts', 'P. Freiermuth', 'E. Engram', 'D. Njoku', 'C. Kmet', 'D. Schultz', 'G. Dulcich', 'C. Okonkwo', 'T. McBride', 'J. Ferguson', 'M. Gesicki', 'H. Hurst', 'T. Higbee', 'I. Likely', 'S. LaPorta', 'D. Kincaid', 'L. Musgrave'],
    K: ['J. Tucker', 'H. Butker', 'T. Bass', 'E. McPherson', 'D. Carlson', 'Y. Koo', 'J. Sanders', 'M. Gay', 'G. Gano', 'B. Maher', 'C. Santos', 'J. Myers', 'K. Fairbairn', 'M. Prater', 'C. Dicker', 'G. Zuerlein', 'N. Folk', 'J. Slye', 'W. Lutz', 'R. Gould'],
    DST: ['49ers', 'Eagles', 'Cowboys', 'Bills', 'Jets', 'Patriots', 'Saints', 'Ravens', 'Steelers', 'Dolphins', 'Broncos', 'Chiefs', 'Bengals', 'Browns', 'Commanders', 'Packers', 'Seahawks', 'Jaguars', 'Giants', 'Lions']
};

const TEAM_ABBR = ['SF', 'PHI', 'DAL', 'BUF', 'NYJ', 'NE', 'NO', 'BAL', 'PIT', 'MIA', 'DEN', 'KC', 'CIN', 'CLE', 'WAS', 'GB', 'SEA', 'JAX', 'NYG', 'DET', 'MIN', 'CHI', 'ATL', 'CAR', 'TB', 'LAR', 'ARI', 'LV', 'LAC', 'IND', 'TEN', 'HOU'];

async function main() {
    console.log('🌱 Seeding Expanded Player Pool (Batch Mode)...');

    // Create many players
    const players = [];
    // Helper to randomize
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const randStat = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

    // Helper to generate ID
    const genId = (name: string, pos: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + pos.toLowerCase() + '-' + Math.floor(Math.random() * 1000);

    // 1. Generate QBs
    for (const name of NAMES.QB) players.push({ name, position: 'QB', teamAbbr: pick(TEAM_ABBR), adp: randStat(10, 150), nflPlayerId: genId(name, 'QB') });
    // 2. Generate RBs
    for (const name of NAMES.RB) {
        players.push({ name, position: 'RB', teamAbbr: pick(TEAM_ABBR), adp: randStat(5, 120), nflPlayerId: genId(name, 'RB') });
        players.push({ name: name + ' Jr.', position: 'RB', teamAbbr: pick(TEAM_ABBR), adp: randStat(100, 200), nflPlayerId: genId(name + ' Jr.', 'RB') });
    }
    // 3. Generate WRs
    for (const name of NAMES.WR) {
        players.push({ name, position: 'WR', teamAbbr: pick(TEAM_ABBR), adp: randStat(5, 120), nflPlayerId: genId(name, 'WR') });
        players.push({ name: name + ' II', position: 'WR', teamAbbr: pick(TEAM_ABBR), adp: randStat(100, 200), nflPlayerId: genId(name + ' II', 'WR') });
    }
    // 4. Generate TEs
    for (const name of NAMES.TE) players.push({ name, position: 'TE', teamAbbr: pick(TEAM_ABBR), adp: randStat(30, 160), nflPlayerId: genId(name, 'TE') });
    // 5. Generate K/DST
    for (const name of NAMES.K) players.push({ name, position: 'K', teamAbbr: pick(TEAM_ABBR), adp: randStat(140, 200), nflPlayerId: genId(name, 'K') });
    for (const name of NAMES.DST) players.push({ name, position: 'DST', teamAbbr: 'DEF', adp: randStat(130, 200), nflPlayerId: genId(name, 'DST') });

    console.log(`Prepared ${players.length} players. Checking for existing to strictly add NEW ones...`);

    // Fetch existing names to avoid conflicts manually since we don't have a unique constraint on Name
    const existing = await db.player.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map(p => p.name));

    const newPlayers = players.filter(p => !existingNames.has(p.name));

    if (newPlayers.length > 0) {
        console.log(`Inserting ${newPlayers.length} new players...`);
        // Batch 50 at a time to be safe
        const batchSize = 50;
        for (let i = 0; i < newPlayers.length; i += batchSize) {
            const batch = newPlayers.slice(i, i + batchSize);
            await db.player.createMany({
                data: batch
            });
            console.log(`  Inserted batch ${i} - ${i + batch.length}`);
        }
        console.log('✅ Success.');
    } else {
        console.log("⚠️ No new players to add.");
    }
}

main();
