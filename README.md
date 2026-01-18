# 🏈 Fantasy Roguelite

A next-generation fantasy football web application with roguelite mechanics. Build your dynasty, draft real NFL players, compete on the waiver wire, and unleash powerful artifacts to dominate your league.

![Status](https://img.shields.io/badge/Status-Alpha-orange)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## ✨ Features

### 🎯 10-Team Snake Draft
- Professional draft room with real-time pick tracking
- Snake draft logic (order reverses each round)
- Live draft history and team pick order visualization
- 110+ real 2025-2026 NFL players ready to be drafted
- Mock draft automation for testing

### 💰 FAAB Waiver Wire
- **Free Agent Acquisition Budget** system ($100 per team)
- Blind bidding on available players
- Drop-to-add logic when rosters are full
- Waiver priority rotation after successful claims
- Manual waiver processing trigger for league commissioners

### 🃏 Roguelite Powerup System
- Collectible artifacts that modify gameplay
- Weekly card pack selection (pick 1 of 4 offered powerups)
- Multipliers, bonus points, and opponent curses
- Rarity-weighted drops: Common (70%), Rare (20%), Epic (9%), Legendary (1%)
- Self-targeting and opponent-targeting effects

### ⚔️ Weekly Matchup Simulator
- Full game simulation engine with realistic stat generation
- Position-based scoring (QB yards, RB rushing, WR receiving, etc.)
- Powerup effects applied during matchups (multipliers, bonuses, curses)
- Fumble tracking with "Curse of the Fumble" penalty support
- Automatic score calculation and matchup finalization

### 🧬 Player Trait Mutations
- Dynamic trait system based on player performance
- **Positive Traits**: Hot Hand (+10%), Genius (+15%), Clutch (+5pts), Legendary Aura (+2pts permanent)
- **Negative Traits**: Cold Streak (-10%), Shook (-20%), Vulnerable (-3pts)
- Traits expire after N weeks or persist permanently (Legendary)
- Mutation chance increases with extreme performances

### 🛡️ Admin Dashboard
- Commissioner controls for league management
- "Force Advance Week" button with two-step confirmation
- Real-time week status and matchup debugging
- Season completion detection

### 📊 League Views
- **Standings**: Live W-L-T records, Points For/Against, Streak tracking
- **Schedule**: Week-by-week matchup overview with scores and status
- **Team Management**: Lineup swaps, roster moves, player cards
- **Activity Feed**: League transaction log (adds, drops, traits gained)
- **Artifacts Inventory**: View collected powerups and their effects

### 🏟️ Real NFL Rosters (2025-2026)
**Quarterbacks**: Josh Allen, Lamar Jackson, Patrick Mahomes, Jalen Hurts, C.J. Stroud, and 15 more  
**Running Backs**: Christian McCaffrey, Bijan Robinson, Breece Hall, Jahmyr Gibbs, Saquon Barkley, and 23 more  
**Wide Receivers**: Justin Jefferson, CeeDee Lamb, Ja'Marr Chase, Tyreek Hill, and 31 more  
**Tight Ends**: Sam LaPorta, Travis Kelce, Mark Andrews, and 12 more  
**Defense/ST & Kickers**: All major teams represented

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended: v22+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/DevGodLoL/fantasy-roguelite.git
cd fantasy-roguelite

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Push database schema (creates SQLite DB)
npm run prisma:push

# Seed the database with NFL players and demo data
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Project Structure

```
fantasy-roguelite/
├── prisma/
│   ├── schema.prisma      # Database schema (30+ models)
│   ├── seed.ts            # NFL player + powerup seeding
│   └── dev.db             # SQLite database
├── scripts/
│   ├── run-mock-draft.ts  # Automated draft testing
│   └── verify-powerups.ts # Powerup engine validation
├── src/
│   ├── app/
│   │   ├── page.tsx       # Home page
│   │   ├── leagues/       # League listing
│   │   └── league/[id]/
│   │       ├── page.tsx        # League dashboard + standings
│   │       ├── admin/          # Commissioner controls
│   │       ├── draft/          # Draft room
│   │       ├── schedule/       # Season schedule
│   │       ├── team/[teamId]/  # Team management
│   │       ├── week/[num]/     # Weekly matchup view
│   │       ├── waivers/        # Waiver wire
│   │       ├── inventory/      # Artifacts collection
│   │       └── transactions/   # Activity log
│   ├── generated/
│   │   └── client/        # Prisma generated client
│   └── lib/
│       └── prisma.ts      # Database singleton
└── prisma.config.ts       # Prisma Windows configuration
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router & Server Actions |
| **Prisma 5.22** | Type-safe ORM with SQLite |
| **Better-SQLite3** | Fast embedded database |
| **TypeScript 5** | Full type safety |
| **Tailwind CSS 4** | Modern utility-first styling |

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run seed` | Reset database with NFL players + demo league |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm run db:check` | Full database health check |
| `npm run verify` | Validate powerup scoring engine |

---

## 🎮 How to Play

1. **Create or Join a League**  
   Navigate to `/leagues` and select a league to join.

2. **Enter the Draft Room**  
   Click "Go to Draft Room" to start drafting your team with real NFL players.

3. **Build Your Roster**  
   Draft strategically across 15 rounds: QB, RB, WR, TE, FLEX, DST, K, and bench spots.

4. **Manage Your Lineup**  
   Set your starting lineup each week. Swap players between starter slots and bench.

5. **Open Your Card Pack**  
   Each week, open a pack of 4 random powerups and choose 1 to add to your arsenal.

6. **Hit the Waiver Wire**  
   Use your $100 FAAB budget to bid on undrafted players and improve your team.

7. **Watch the Simulation**  
   Commissioners can advance weeks via the Admin Dashboard. Scores are generated based on player stats and powerup effects.

8. **Track Your Progress**  
   View standings, check your streak, and watch players gain traits based on performance!

---

## 🗃️ Database Models

| Model | Description |
|-------|-------------|
| **User** | Player accounts |
| **League** | Fantasy leagues with settings |
| **Team** | User teams with FAAB balance and waiver priority |
| **Player** | Real NFL players (110+ seeded) |
| **PlayerTrait** | Dynamic mutations based on performance |
| **PlayerPerformance** | Weekly stat tracking |
| **RosterSlot** | Team roster positions |
| **Draft / DraftPick** | Draft state and selections |
| **Week / Matchup** | Season structure and head-to-head games |
| **WaiverClaim** | FAAB bids on free agents |
| **Powerup** | Roguelite artifact definitions |
| **TeamPowerup** | Owned powerups |
| **TeamPowerupOffer** | Weekly pack contents |
| **LeagueTransaction** | Activity log entries |

---

## 🪟 Windows Notes

This project uses **Prisma v5** with **Better-SQLite3**. For Windows stability:

1. `prisma.config.ts` resolves `DATABASE_URL` to absolute Windows-safe paths
2. Prisma Client output is set to `./src/generated/client`
3. All scripts ensure clean database disconnects
4. Use `npm run db:check` to verify database health

If you encounter issues:
```bash
# Clear and regenerate
rm -rf node_modules/.prisma src/generated
npm run prisma:generate
npm run prisma:push
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] 10-team snake draft system
- [x] FAAB waiver wire with blind bidding
- [x] Real 2025-2026 NFL rosters
- [x] Roguelite powerup engine
- [x] Weekly matchup simulator with stat generation
- [x] Player trait mutation system
- [x] 14-week season schedule generator
- [x] Admin Dashboard with week advancement
- [x] Standings with W-L-T, PF/PA, streaks
- [x] Card pack selection (pick 1 of 4)
- [x] League activity feed

### 🚧 In Progress
- [ ] Lineup lock before game simulation
- [ ] Enhanced player cards with trait display
- [ ] Matchup preview with projected scores

### 📋 Planned
- [ ] Playoff bracket system (Weeks 15-17)
- [ ] Trade system between teams
- [ ] Live stat ingestion from real NFL API
- [ ] Mobile-responsive design overhaul
- [ ] User authentication (NextAuth)
- [ ] Multi-league support per user

---

## 📄 License

This project is for educational and personal use.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ⚡ by the Fantasy Roguelite Team  
*Last updated: January 2026*
