# Fantasy Roguelite 🏈⚔️

**Version 0.5.0 - "The Playoff Gauntlet Update"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts. Complete 17-week seasons with full playoff support!

## 🌟 Key Features

### 🏆 Full Playoff System (New!)
-   **17-Week Seasons:** 14 regular season floors + 3 playoff weeks.
-   **Automatic Seeding:** Teams ranked by wins (points as tiebreaker).
-   **Championship Bracket:** Seeds 1-6 compete for glory (1 & 2 get BYE weeks).
-   **Redemption Arc:** Seeds 7-10 battle for the Phoenix title.
-   **Awards:**
    -   🏆 **Champion:** +500 Gold, "CHAMPION" title
    -   🔥 **Phoenix:** +50 Gold, +1 Reroll for next season, "PHOENIX" title
-   **Playoff Bracket Page:** Visual tournament bracket at `/league/[id]/playoffs`.

### 🗺️ Campaign Map
-   **Visual Dungeon Crawl:** Navigate a procedurally-styled campaign map showing all floors.
-   **Playoff Floors:** Weeks 15-17 now show distinct golden "🏆 Playoff Round" styling.
-   **Floor Status:** Each node shows completion state (conquered, active, locked).
-   **Interactive Navigation:** Click floors to jump directly to that week's matchup.

### 📜 Quest Log
-   **32 Total Quests:** Season-long challenges across 4 rarity tiers.
-   **Legendary Quests:** "The Undefeated", "Throne of Glory" (claim #1 seed).
-   **Epic Quests:** "Domination" (7 wins), "Unstoppable Force" (5-game win streak).
-   **Rare Quests:** "Hot Streak" (3 wins in a row), "Century Plus" (120+ points).
-   **Common Quests:** "First Blood", "Treasure Hunter", and more.
-   **Rich Rewards:** Earn gold, artifacts, rerolls, titles, and next-season bonuses.

### ⚔️ The Campaign
-   **Roguelike Seasons:** Play through a 14-floor regular season against AI opponents.
-   **Visual Narrative:** Each week represents a "floor" in an infinite dungeon.
-   **Simulation Engine:** Battles are resolved using realistic NFL stats simulation.
-   **Gold Economy:** Earn gold from victories to spend in the merchant's shop.

### 📱 Mobile Experience
-   **Responsive Design:** Fully polished layout for mobile browsers.
-   **Touch-Optimized:** Swipeable lists, large tap targets, and vertical stacking.
-   **Performance:** CSS-only procedural generation for instant loading.

### 🏪 The Ancient Emporium
-   **Relics:** Persistent artifacts that provide passive bonuses all season.
-   **Consumables:** Key items that provide instant or one-week benefits.
-   **Inventory:** View your artifacts in the **Ancient Armory**.

### 🃏 The Loot System
-   **Weekly Treasure Chests:** After every battle, open an **Ancient Chest** with animated reveal.
-   **Artifacts:** Equip cards to boost your team or curse your enemies.
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
2.  **Verify:** Ensure no `prisma-query-engine` processes are stuck in Task Manager.
3.  **Pathing:** Avoid using relative paths for `DATABASE_URL` in `.env`. Use an absolute path.

### 🎮 How to Play (Dev Mode)

#### Regular Season
1.  **Draft:** Complete the draft at `/league/[id]/draft`.
    -   *Tip:* Use `npx tsx scripts/auto-complete-draft.ts` to skip.
2.  **Battle:** Go to your **Campaign Map** or **Week** page.
3.  **Simulate:** 
    -   Use `npx tsx scripts/force-sim-week1.ts` to resolve the current week.
    -   Or use the **Admin Dashboard** at `/league/[id]/admin`.
4.  **Loot:** Open your weekly Treasure Chest to upgrade your team.
5.  **Quests:** Track your progress in the **Quest Log** at `/league/[id]/quests`.
6.  **Shop:** Visit the merchant to spend your hard-earned gold.

#### Playoffs (Weeks 15-17)
After Week 14, playoffs are automatically generated:
-   **Week 15 (Wildcard):** #3 vs #6, #4 vs #5, plus Consolation Semis
-   **Week 16 (Semifinals):** #1 vs lowest WC winner, #2 vs highest WC winner
-   **Week 17 (Championship):** The Grand Finale + Toilet Bowl

### 🧪 Testing

#### End-to-End Season Test
Run a full 17-week simulation to validate playoff logic:
```bash
npx tsx scripts/e2e-season-test.ts
```
This will:
- Simulate all 14 regular season weeks
- Generate playoff seedings
- Create & simulate Weeks 15-17
- Award Champion and Phoenix titles
- Validate all phases completed successfully

### 📂 Directory Structure
-   `src/app/league/[id]`: Core league pages (Dashboard, Draft, Schedule, Shop, Quests).
-   `src/app/league/[id]/campaign`: Campaign Map view.
-   `src/app/league/[id]/playoffs`: Playoff bracket page.
-   `src/app/league/[id]/quests`: Quest Log page.
-   `src/components`: UI components (Cards, Maps, Modals).
-   `src/lib/game-data`: Quest definitions, shop items, playoffs logic.
-   `src/lib/game-logic`: Simulation and scoring logic.
-   `scripts`: Utility scripts for simulation, seeding, and testing.

---
*Built by The DevGods | Powered by Next.js & Prisma*
