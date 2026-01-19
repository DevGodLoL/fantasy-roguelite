# Fantasy Roguelite 🏈⚔️

**Version 0.4.0 - "The Quest & Campaign Update"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts. Now with a full Quest Log system and enhanced Campaign Map!

## 🌟 Key Features

### 🗺️ Campaign Map (New!)
-   **Visual Dungeon Crawl:** Navigate a procedurally-styled campaign map showing all 14 floors.
-   **Floor Status:** Each node shows completion state (conquered, active, locked).
-   **Consistent Terminology:** All weeks are now called "Floors" to match the roguelite dungeon theme.
-   **Interactive Navigation:** Click floors to jump directly to that week's matchup.

### 📜 Quest Log (New!)
-   **32 Total Quests:** Season-long challenges across 4 rarity tiers.
-   **Legendary Quests:** "The Undefeated" (complete season without a loss), "Throne of Glory" (claim #1 seed).
-   **Epic Quests:** "Domination" (win 7 matchups), "Unstoppable Force" (5-game win streak).
-   **Rare Quests:** "Hot Streak" (3 wins in a row), "Century Plus" (120+ points in a week).
-   **Common Quests:** "First Blood", "Treasure Hunter", and more.
-   **Dynamic Progress:** Real-time tracking based on your actual game performance.
-   **Rich Rewards:** Earn gold, artifacts, rerolls, titles, and next-season bonuses.

### ⚔️ The Campaign
-   **Roguelike Seasons:** Play through a 14-floor season against AI opponents.
-   **Visual Narrative:** Each week represents a "floor" in an infinite dungeon, culminating in a Final Boss.
-   **Simulation Engine:** Battles are resolved using realistic NFL stats simulation.
-   **Gold Economy:** Earn gold from victories to spend in the merchant's shop.

### 📱 Mobile Experience
-   **Responsive Design:** Fully polished layout for mobile browsers.
-   **Touch-Optimized:** Swipeable lists, large tap targets, and vertical stacking for smaller screens.
-   **Performance:** Replaced heavy textures with CSS-only procedural generation for instant loading.

### 🏪 The Ancient Emporium
-   **Relics:** Persistent artifacts that provide passive bonuses all season.
-   **Consumables:** Key items that provide instant or one-week benefits:
    -   📜 **Scrolls:** Grant Rerolls for loot packs.
    -   🧪 **Potions:** Temporary stat boosts.
    -   🎯 **Contracts:** Targeted curses for your opponents.
-   **Inventory:** View your artifacts in the **Ancient Armory**.

### 🃏 The Loot System
-   **Weekly Treasure Chests:** After every battle, open an **Ancient Chest** with animated reveal.
-   **Contained Animations:** Chest opening effects stay within boundaries (fixed overflow issues).
-   **Artifacts:** Equip cards to boost your team or curse your enemies.
    -   **Common (📜):** Simple stat boosts.
    -   **Rare (⚔️):** Position-specific multipliers.
    -   **Epic (💎):** Game-altering effects.
    -   **Legendary (👑):** Unique win conditions.

### 🛡️ My Army Page (Enhanced!)
-   **Team Name Styling:** Vibrant purple/pink/blue gradient, uppercase lettering.
-   **Themed Empty States:** Sparkle icons (✨) instead of generic boxes.
-   **Clean Hierarchy:** Removed duplicate titles - clear "Battle Formation" → "Active Starters" structure.
-   **Roster Management:** Click-to-select, then click-destination swap system.

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
Since the season is simulated, you can control the flow of time:

1.  **Draft:** Complete the draft at `/league/[id]/draft`.
    -   *Tip:* Use `npx tsx scripts/auto-complete-draft.ts` to skip to the end.
2.  **Battle:** Go to your **Campaign Map** or **Week** page.
3.  **Simulate:** 
    -   Use `npx tsx scripts/force-sim-week1.ts` to resolve the current week.
    -   Or use the **Admin Dashboard** at `/league/[id]/admin`.
4.  **Loot:** Open your weekly Treasure Chest to upgrade your team.
5.  **Quests:** Track your progress in the **Quest Log** at `/league/[id]/quests`.
6.  **Shop:** Visit the merchant to spend your hard-earned gold.

### 📂 Directory Structure
-   `src/app/league/[id]`: Core league pages (Dashboard, Draft, Schedule, Shop, Quests).
-   `src/app/league/[id]/campaign`: Campaign Map view.
-   `src/app/league/[id]/quests`: Quest Log page.
-   `src/components`: UI components (Cards, Maps, Modals).
-   `src/lib/game-data`: Quest definitions, shop items, missions.
-   `src/lib/game-logic`: Simulation and scoring logic.
-   `scripts`: Utility scripts for simulation, seeding, and debugging.

---
*Built by The DevGods | Powered by Next.js & Prisma*
