# Fantasy Roguelite 🏈⚔️

**Version 0.2.0 - "The Loot Update"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts.

## 🌟 Key Features

### ⚔️ The Campaign
-   **Roguelike Seasons:** Play through a 14-week season against AI opponents.
-   **Simulation Engine:** Battles are resolved using realistic NFL stats simulation (Dev Mode enabled).
-   **Gold Economy:** Earn gold from victories to spend in the Shop.

### 🃏 The Loot System (New!)
-   **Weekly Supply Drops:** After every battle, open a high-tech **Loot Cache**.
-   **Artifacts:** Equip cards to boost your team or curse your enemies.
    -   **Common (📜):** Simple stat boosts.
    -   **Rare (⚔️):** Position-specific multipliers.
    -   **Epic (💎):** Game-altering effects.
    -   **Legendary (👑):** Instant-win conditions? (Find out!)
-   **Animations:** Fully immersive 3D-style CSS animations for opening chests.

### 🧬 Dynamic Roster
-   **Mutations:** Players gain Traits (like "Hot Hand" or "Shook") based on performance.
-   **Expanded Draft:** Pool of 250+ NFL players with accurate positions (QB, RB, WR, TE, K, DST).
-   **Snake Draft:** Smart AI opponents that draft based on need and value.

## 🛠️ Developer Guide

### Prerequisites
-   Node.js 18+
-   SQLite (via Prisma)

### Quick Start
1.  **Install:** `npm install`
2.  **Database:** `npx prisma migrate dev`
3.  **Seed World:** `npm run seed`
4.  **Expand Players:** `npx tsx scripts/seed-expanded-players.ts`
5.  **Run:** `npm run dev`

### 🎮 How to Play (Dev Mode)
Since the season is simulated, you can fast-forward time:

1.  **Draft:** Complete the draft at `/league/[id]/draft`.
    -   *Tip:* Use `npx tsx scripts/finish-draft-db.ts` to auto-complete if stuck.
2.  **Battle:** Go to your Matchup page.
3.  **Simulate:** Click "Resolve Battle" (or run `npx tsx scripts/force-sim-week1.ts`).
4.  **Loot:** Navigate to the **Next Week** to find your Loot Cache.
5.  **Repeat:** Battle your way to the championship!

### 📂 Directory Structure
-   `src/app/league/[id]`: Core league pages (Dashboard, Draft, Schedule).
-   `src/components`: UI components (Cards, Modals).
-   `scripts`: Utility scripts for simulation and debugging.

---
*Built by The DevGods | Powered by Next.js & Prisma*
