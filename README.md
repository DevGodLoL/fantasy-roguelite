# Fantasy Roguelite 🏈⚔️

**Version 0.6.0 - "The Quest for Glory Optimization"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts. Complete 17-week seasons with full playoff support!

## 🌟 Key Features

### 🏆 Full Playoff System
-   **17-Week Seasons:** 14 regular season floors + 3 playoff weeks.
-   **Automatic Seeding:** Top 6 teams qualify for the championship (1 & 2 get BYE weeks).
-   **The Playoff Gauntlet:** A premium bracket page at `/league/[id]/playoffs`.
-   **The Spoils of War:** Improved rewards UI highlighting "The Crown Prince" (Champion) and "The Phoenix Risen" (Consolation winner).
-   **Standings UI:** Accurate top-6 highlight with blue/cyan "Vanguard" tiers and a clear playoff cutoff line.

### 📜 Quest Log (Optimized!)
-   **32+ Quests:** Season-long challenges across 4 rarity tiers.
-   **Unified UI:** Consistent progress bars (standardized 8px height) and status lines ("Objective Met", "Impossible", "In Pursuit").
-   **Logic Fixes:** Added "Impossible" state tracking (e.g., Perfect Season fails upon first loss).
-   **Feasibility Tuning:** Adjusted targets for "Point God" and "Season MVP" to be challenging yet achievable.
-   **Hidden Challenges:** Expanded pool of secrets with a dynamic discovery UI—see names, lore, and acquired bounties only after completion.

### 🗺️ Campaign Map
-   **Visual Dungeon Crawl:** Navigate a procedurally-styled campaign map showing all floors.
-   **Playoff Floors:** Weeks 15-17 show distinct golden "🏆 Playoff Round" styling.
-   **Interactive Navigation:** Click floors to jump directly to that week's matchup.

### ⚔️ The Campaign
-   **Roguelike Seasons:** Play through a 14-floor regular season against AI opponents.
-   **Simulation Engine:** Battles resolved using realistic NFL stats simulation.
-   **Gold Economy:** Earn gold from victories to spend in the merchant's shop.

### 📱 Mobile Experience
-   **Responsive Design:** Fully polished layout for mobile browsers.
-   **Touch-Optimized:** Swipeable lists, large tap targets, and vertical stacking.

### 🏪 The Ancient Emporium & armory
-   **Relics:** Persistent artifacts that provide passive bonuses all season.
-   **Ancient Armory:** View your artifacts and their game-altering effects.

### 🃏 The Loot System
-   **Ancient Chests:** Post-battle animated reveal with multi-stage "charging" effects.
-   **Artifact Rarities:**
    -   **Common (📜):** Simple stat boosts.
    -   **Rare (⚔️):** Position-specific multipliers.
    -   **Epic (💎):** Game-altering effects.
    -   **Legendary (👑):** Unique win conditions.

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

#### Playoffs (Weeks 15-17)
After Week 14, tournaments are automatically generated:
-   **Week 15:** Wildcard Round (#3 vs #6, #4 vs #5)
-   **Week 16:** Semifinals (top seeds enter)
-   **Week 17:** Championship + Toilet Bowl

### 🧪 Testing
Run a full 17-week simulation:
```bash
npx tsx scripts/e2e-season-test.ts
```

---
*Built by The DevGods | Powered by Next.js & Prisma*
