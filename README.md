# Fantasy Roguelite 🏈⚔️

**Version 0.7.0 - "Ascension of the Commander"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts. Now featuring a persistent meta-progression system!

## 🌟 Key Features

### 💎 The Eternal Gridiron (New Dashboard)
-   **Command Center:** A complete UI overhaul of the main league dashboard.
-   **Bento-Grid Layout:** High-impact "Arena" card for live matchups, flanked by "Intel" sidebars.
-   **Live Battle Integration:** Real-time (simulated) score tracking and "Enter Battle" status.
-   **Roguelite Trackers:** Direct visibility of Campaign Floors and Gold Treasury.

### 🎖️ Commander System (Meta-Progression)
-   **Persistent Leveling:** Earn **Prestige XP** across seasons to level up your Commander profile.
-   **Hall of Valor:** A recap screen at the end of each season to calculate your "Season Score" based on wins, gold, artifacts, and quests.
-   **The Badge:** Your "Commander LVL" is persistently displayed in the header, showcasing your veteran status.
-   **Ascension:** "Claim Rewards & Ascend" functionality to bank your XP and prepare for the next run.

### 🏆 Full Playoff System
-   **17-Week Seasons:** 14 regular season floors + 3 playoff weeks.
-   **Automatic Seeding:** Top 6 teams qualify for the championship (1 & 2 get BYE weeks).
-   **The Playoff Gauntlet:** A premium bracket page at `/league/[id]/playoffs`.
-   **The Spoils of War:** Improved rewards UI highlighting "The Crown Prince" (Champion) and "The Phoenix Risen" (Consolation winner).

### 📜 Quest Log (Optimized!)
-   **32+ Quests:** Season-long challenges across 4 rarity tiers.
-   **Unified UI:** Consistent progress bars and status lines ("Objective Met", "Impossible", "In Pursuit").
-   **Hidden Challenges:** Secret objectives with dynamic discovery UI.

## 🛠️ Developer Guide

### Prerequisites
-   Node.js 18+
-   SQLite (via Prisma)

### Quick Start
1.  **Install:** `npm install`
2.  **Database:** `npx prisma migrate dev`
3.  **Seed World:** `npm run seed`
4.  **Expand Players:** `npx tsx scripts/seed-expanded-players.ts`
5.  **Seed Shop:** `npx tsx scripts/seed-shop.ts`
6.  **Run:** `npm run dev`

### 🏗️ Prisma on Windows
To avoid the "Prisma Client not found" or "Generating..." hang on Windows:
1.  **Generate:** `npx prisma generate`
2.  **Cleanup:** Ensure no `prisma-query-engine` processes are stuck in Task Manager.
3.  **Pathing:** Use absolute paths for `DATABASE_URL` in `.env`.

### 🎮 How to Play (Dev Mode)

#### Regular Season
1.  **Draft:** Complete the draft at `/league/[id]/draft` (or use `npx tsx scripts/auto-complete-draft.ts`).
2.  **Battle:** Simulate weeks via the **Admin Dashboard** or CLI scripts.
3.  **Loot:** Open Ancient Chests to upgrade your team.
4.  **Quests:** Track your path to glory in the **Quest Log**.
5.  **Ascend:** At season's end, visit the **Hall of Valor** to claim Prestige XP.

#### Simulation Tools
-   **Mid-Season Jump:** `npx tsx scripts/set-mid-season.ts` (Fast-forwards to Week 8)
-   **Full Season Sim:** `npx tsx scripts/e2e-season-test.ts` (Runs Week 1-17)

### 🧪 Testing
Run a full 17-week simulation:
```bash
npx tsx scripts/e2e-season-test.ts
```

---
*Built by The DevGods | Powered by Next.js & Prisma*
