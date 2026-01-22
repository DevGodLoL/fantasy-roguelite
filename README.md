# Fantasy Roguelite 🏈⚔️

**Version 0.8.0 - "Personalities & Polish"**

A next-gen Fantasy Football RPG where you draft a legion, battle AI opponents, and evolve your team with powerful artifacts. Now featuring a deep AI personality system and mobile-first responsiveness!

## 🌟 Key Features

### 🤖 AI Personality System (New!)
-   **Strategic Archetypes:** Each CPU team now has a distinct personality (Warlord, Sentinel, Mastermind, Greedy, Hoarder, Chaotic).
-   **Gameplay Impact:** Archetypes influence point ceilings, fumble recovery, gold acquisition, and artifact usage during simulation.
-   **Flavor Quotes:** Opponents now taunt or boast in the Arena based on their unique personality profile.

### 🧬 Dynamic Field Mutations
-   **Position-Specific Traits:** Players can gain powerful blessings (e.g., "The Zone") or debilitating curses (e.g., "Shook") based on performance.
-   **Trait Icons & Visuals:** Rarity-based styling for traits (Common to Legendary) and special "Curse" animations.

### 📱 Premium Mobile Experience
-   **Adaptive Dashboard:** Stacking headers, vertical Arena cards, and optimized touch targets for on-the-go management.
-   **Responsive Standings:** Intelligent column truncation and mobile-first padding to prevent horizontal scroll.
-   **Polished Shop:** A reworked "Relic Emporium" header that preserves wealth visibility (Gold & Rerolls) on small screens.

### 🎯 Weekly Mission System
-   **Cycle-Based Quests:** 3 new missions generated every week (e.g., "The Sharpshooter", "Gilded Victory").
-   **Interactive Progress:** Real-time progress bars and "completed" status indicators.
-   **Balanced Rewards:** Earn Gold directly by accomplishing tactical objectives on the field.

### 🎖️ Commander System (Meta-Progression)
-   **Persistent Leveling:** Earn **Prestige XP** across seasons to level up your Commander profile.
-   **Treasury Vault:** Your gold balance is now persistent and used across the Relic Emporium.
-   **Commander Profile:** Persistent stats tracking Rank, Record, and Level across the entire realm.

## 🛠️ Developer Guide

### Prerequisites
-   Node.js 18+
-   SQLite (via Prisma)

### ⚙️ Quick Onboarding
The fastest way to get the game running is to use our automated setup script:
1.  **Run Setup:** `npm install` then `npm run setup`
    - *This will automatically create your `.env`, initialize the SQLite database, and seed the world.*

### 🏗️ Manual Setup (If preferred)
1.  **Environment:** `cp .env.example .env`
2.  **Initialize DB:** `npx prisma migrate dev --name init`
3.  **Seed World:** `npm run seed`
4.  **Run:** `npm run dev`

### 🏗️ Prisma on Windows
To avoid the "Prisma Client not found" or "Generating..." hang on Windows:
1.  **Generate:** `npx prisma generate`
2.  **Cleanup:** Ensure no `prisma-query-engine` processes are stuck in Task Manager.
3.  **Pathing:** Use absolute paths for `DATABASE_URL` in `.env`.

### 🎮 Simulation Tools
-   **Mid-Season Jump:** `npx tsx scripts/set-mid-season.ts` (Fast-forwards to Week 8)
-   **Full Season Sim:** `npx tsx scripts/e2e-season-test.ts` (Runs Week 1-17)
-   **Archetype Seeder:** `npx tsx scripts/seed-archetypes.ts` (Assigns random personalities to CPU teams)

---
*Built by The DevGods | Powered by Next.js & Prisma*
