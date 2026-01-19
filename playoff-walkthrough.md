# Playoff System Walkthrough

The fantasy roguelite playoff system is now fully operational, covering everything from automatic seeding to high-stakes rewards.

## 🏁 Season Progression Flow

1.  **Week 14 (The regular season finale):**
    *   When the final matchup is resolved, the system automatically calculates seedings.
    *   The **Top 6 teams** enter the **Winners Bracket** (Seeds 1 & 2 get a bye).
    *   The **Bottom 4 teams** enter the **Redemption Arc**.
    *   **Week 15 (Wild Card)** matchups are instantly generated.

2.  **Week 15 (Wild Card):**
    *   Winners advance.
    *   Playoff-exclusive artifacts (like *Titan Slayer*) start appearing in packs.
    *   Simulation at the end of this week generates **Week 16 (Semifinals)** with re-seeding logic.

3.  **Week 16 (Semifinals):**
    *   Determines who plays for the Championship.
    *   Identifies the **Loser's Bracket winner** (The "Phoenix").
    *   Generates the **Week 17** finale.

4.  **Week 17 (Championship):**
    *   The ultimate battle.
    *   Resolving this week triggers `awardPlayoffRewards`.
    *   Champion gets 500 gold and the **"CHAMPION"** title.
    *   Consolation winner gets next-season bonuses (+50 gold, +1 reroll) and the **"PHOENIX"** title.

## 🎨 UI & UX Improvements

### The Playoff Gauntlet (Schedule Page)
The schedule page now splits into two distinct eras:
*   **Regular Season Campaign:** The initial 14-week grind.
*   **Playoff Gauntlet:** A visual bracket breakdown.
    *   **Winners Bracket:** Highlighted with gold/purple accents and trophy icons.
    *   **Redemption Arc:** Highlighted with red/ember accents for teams fighting for the Phoenix title.

### Dynamic Headers (Week Page)
When viewing a playoff week, the header transforms:
*   Instead of just "Chapter 15", it now shows **"CHAPTER 15 • WILDCARD"**.
*   The status badge clearly indicates if it's a playoff round.

## ⚔️ Playoff Roguelite Elements

*   **Elite Pool:** During the post-season, the artifact pool expands. Powerups with `isPlayoffOnly: true` (e.g., *Titan Slayer*, *Aegis of Champions*) become available in pack openings and rerolls, raising the ceiling of potential power.
*   **Re-seeding:** The Winners Bracket Semifinals automatically pair the #1 seed against the lowest remaining seed, maintaining regular season importance.

## 🛠️ Data Infrastructure

*   **Prisma Schema:** Enhanced with `bracket` and `round` fields on matchups, and `isPlayoffOnly` on artifacts.
*   **Resilient Seeding:** The `npm run seed` command has been optimized with a correct cleanup order to prevent foreign key errors, ensuring a smooth development reset.
