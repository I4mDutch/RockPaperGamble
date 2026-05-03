# RockPaperGamble — Development Plan (v2.3.0)

## Goal
Modernize the game with a premium "Modernized" UI, perfect mobile scaling, and a deep, highly-configurable Items System.

---

## 🟢 Phase 1: UI Reskin & Design System (Priority 1)
**Goal:** Implement the new visual identity and fix critical UI overflows.

### [COMPLETE] Task 1.1: Design Tokens & Theme
- **Files:** `packages/frontend/src/index.css`
- **Action:** Update Tailwind v4 theme for Deep Emerald background (`#0F3F34`) and gradients.

### [COMPLETE] Task 1.2: Global Components Update
- **Action:** Implement `.card-modern`, `.btn-gradient`, and `WaveBackground.tsx`.

### [COMPLETE] Task 1.3: View-Specific Reskin
- **Action:** Reskin Lobby Browser, Room, and Game Screen.

### Task 1.4: Overflow & Text Truncation (UI Fix)
- **Problem:** Long text like "won 100,000 dollars" overflows containers.
- **Action:** Implement fluid truncation and responsive font-size clamping for large currency values.
--> Biggest Impact on Page: Lobby
---

## 🟡 Phase 2: Mobile & Layout Optimization (Priority 2)
**Goal:** Perfect responsiveness and touch UX.

### Task 2.1: Fluid Scaling Refinement
- **Action:** Ensure typography and spacing are safe for 320px devices.

### Task 2.2: Mobile UI Enhancements
- **Action:** 48px tap targets, safe-area-inset padding, and portrait orientation focus.

---

## 🔵 Phase 3: Code Cleanup & Bug Fixes (Priority 3)
**Goal:** Technical debt reduction and fixing broken gameplay systems.

### Task 3.1: CSS Audit & Cleanup
- **Action:** Remove redundant legacy styles from `App.css`.

### Task 3.2: Betting Logic Fix (Critical Bug)
- **Problem:** Betting on other players doesn't provide income for correct guesses.
- **Action:** Debug `gameStore.ts` and server-side win/loss calculation.

---

## 🟣 Phase 4: Items System & Granular Config (Priority 4)
**Goal:** Expand core gameplay with a deeply customizable, high-stakes Items System and dynamic themes.

### Task 4.1: Items Framework & State
- **Files:** `packages/backend/src/game/items.ts`, `packages/frontend/src/store/gameStore.ts`
- **Action:** Implement a central `ItemRegistry` and socket events for item purchases and activation.
- **Config:** Create a settings schema to allow per-room overrides for all costs, percentages, and penalties (marked `**` in mechanics).

### Task 4.2: Dynamic Themes & Visual Effects
- **Action:** Implement `ThemeManager` to trigger global UI overrides:
    - **Atomic Bomb:** Pulse red background, electrical overlays, and high-tension audio.
    - **Nuke:** Toned down but high-stakes visual "warning" mode.
- **Files:** `packages/frontend/src/components/game/ThemeOverlay.tsx`

### Task 4.3: Item Mechanical Logic (Dynamic Configuration in Lobby Settings)
- **Action:** Code specific behaviors for the core item set, ensuring all values are driven by the dynamic room configuration (Task 4.1):
    - **Atomic Bomb:** Logic for "Diffused" vs "Detonated" (Cost, Target Steal %, Next-Player Steal %, and Global Steal % defaults: $3k, 90%, 30%, 10%).
    - **Nuke:** Voting logic + Duel. Logic for "Backfire" (Purchaser distribution) vs "Impact" (Global pool take % defaults: 25%, 75%).
    - **Landmine:** Spectator-placed trap. Logic to detect R/P/S match and award configured payout ($250 default) to miner on hit.
    - **Interceptor:** Hidden-phase modifier. Logic for data obfuscation and wager stealing/forcing (Steal double wager, $200 min default).

### Task 4.4: Granular Settings UI
- **Action:** Build a "Room Settings" panel for hosts to adjust item costs and math variables.
- **Files:** `packages/frontend/src/components/game/SettingsPanel.tsx`

---

## 🟤 Phase 5: Jayking014 Refinements & Logic (Priority 5)
**Goal:** Finalize betting integrity, mobile perfection, and connection resilience.

### Task 5.1: Betting Flow Refactor
- **Problem:** Balance is currently deducted *before* the game ends, leading to confusing balance states.
- **Action:** Refactor `gameStore.ts` to hold "Wager Lock." Do NOT deduct money from account until the game ends and a LOSS is confirmed.
- **Logic:**
    - Game Start: Lock wager amount (don't subtract).
    - Loss: Subtract locked wager.
    - Win: Keep balance + add opponent's wagers.

### Task 5.2: Connection Resilience (Offline Logic)
- **Problem:** Game stalls if a duelist goes offline.
- **Action:** Implement "Presence-Aware Scoring." If a player is offline during a turn resolution, the online player automatically wins the point.
- **Files:** `packages/backend/src/game/engine.ts`