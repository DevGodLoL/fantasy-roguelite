# 🏈 Fantasy Roguelite

A next-generation fantasy football web application with roguelite mechanics. Build your dynasty, draft real NFL players, compete on the waiver wire, and unleash powerful artifacts to dominate your league.

![Draft Room Preview](https://img.shields.io/badge/Status-In%20Development-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![Prisma](https://img.shields.io/badge/Prisma-7.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

---

## ✨ Features

### 🎯 10-Team Snake Draft
- Professional draft room with real-time pick tracking
- Snake draft logic (order reverses each round)
- Live draft history and team pick order visualization
- 110+ real 2025-2026 NFL players ready to be drafted

### 💰 FAAB Waiver Wire
- **Free Agent Acquisition Budget** system ($100 per team)
- Blind bidding on available players
- Drop-to-add logic when rosters are full
- Waiver priority rotation after successful claims
- Manual waiver processing trigger for league commissioners

### 🃏 Roguelite Powerup System
- Collectible artifacts that modify gameplay
- Multipliers, bonus points, and curses
- Weekly activation during matchups
- Rarity tiers: Common, Rare, Epic, Legendary

### 🏟️ Real NFL Rosters (2025-2026)
**Quarterbacks**: Josh Allen, Lamar Jackson, Patrick Mahomes, Jalen Hurts, C.J. Stroud, and 15 more  
**Running Backs**: Christian McCaffrey, Bijan Robinson, Breece Hall, Jahmyr Gibbs, Saquon Barkley, and 23 more  
**Wide Receivers**: Justin Jefferson, CeeDee Lamb, Ja'Marr Chase, Tyreek Hill, and 31 more  
**Tight Ends**: Sam LaPorta, Travis Kelce, Mark Andrews, and 12 more  
**Defense/ST & Kickers**: All major teams represented

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended: v24)
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

# Run database migrations
npm run prisma:migrate

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
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # NFL player seeding script
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx       # Home page
│   │   ├── leagues/       # League listing
│   │   └── league/[id]/
│   │       ├── page.tsx   # League dashboard
│   │       ├── draft/     # Draft room
│   │       ├── team/      # Team management
│   │       └── waivers/   # Waiver wire marketplace
│   └── lib/
│       └── prisma.ts      # Database client
├── dev.db                 # SQLite database (local)
└── prisma.config.ts       # Prisma configuration
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **Prisma 7** | Type-safe ORM |
| **Better-SQLite3** | Fast local database |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Styling |

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run seed` | Reset database with NFL players |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Apply database migrations |
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

4. **Hit the Waiver Wire**  
   After the draft, use your $100 FAAB budget to bid on undrafted players.

5. **Activate Powerups**  
   Use roguelite artifacts to boost your weekly scores or curse your opponents.

---

## 🗃️ Database Models

- **User** - Player accounts
- **League** - Fantasy leagues with settings
- **Team** - User teams with FAAB balance and waiver priority
- **Player** - Real NFL players (110+ seeded)
- **RosterSlot** - Team roster positions
- **Draft** - Draft state and format
- **DraftPick** - Individual draft selections
- **WaiverClaim** - FAAB bids on free agents
- **Powerup** - Roguelite artifact definitions
- **Matchup** - Weekly head-to-head matchups

---

## 🪟 Windows Notes

This project uses **Prisma v7** with **Better-SQLite3**. For Windows stability:

1. `prisma.config.ts` resolves `DATABASE_URL` to absolute paths
2. All scripts ensure clean database disconnects
3. Use `npm run db:check` to verify database health

---

## 🗺️ Roadmap

- [x] 10-team snake draft system
- [x] FAAB waiver wire with blind bidding
- [x] Real 2025-2026 NFL rosters
- [x] Roguelite powerup engine
- [ ] Weekly matchup simulator
- [ ] Live scoring with stat ingestion
- [ ] Season schedule generator
- [ ] Playoff bracket system
- [ ] Trade system between teams
- [ ] Mobile-responsive design

---

## 📄 License

This project is for educational and personal use.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ⚡ by the Fantasy Roguelite Team
