# RockPaperGamble — Development Plan (v2.3.0)

## Goal
Modernize the game with a premium "Modernized" UI, perfect mobile scaling, and a deep, highly-configurable Items System.

---

## 🟢 Phase 1: UI Reskin & Design System (Priority 1)
**Goal:** Implement the new visual identity and fix critical UI overflows.

### Task 1.1: Design Tokens & Theme
- **Files:** `packages/frontend/src/index.css`
- **Action:** Update Tailwind v4 theme for Deep Emerald background (`#0F3F34`) and gradients.

### Task 1.2: Global Components Update
- **Action:** Implement `.card-modern`, `.btn-gradient`, and `WaveBackground.tsx`.

### Task 1.3: View-Specific Reskin
- **Action:** Reskin Lobby Browser, Room, and Game Screen.

### Task 1.4: Overflow & Text Truncation (UI Fix)
- **Problem:** Long text like "won 100,000 dollars" overflows containers.
- **Action:** Implement fluid truncation and responsive font-size clamping for large currency values.

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
**Goal:** Core gameplay expansion with a deeply customizable settings engine.

### Task 4.1: Lobby Configuration (Deep Settings)
- **Feature:** Advanced "Items Settings" panel in Lobby setup.
- **Functionality:**
  - Global "Items Enabled" toggle.
  - **Item-by-Item Configuration**:
    - Toggle: Enable/Disable individual items.
    - Price: Custom cost per item.
    - **Mechanical Tweakables**: Sliders/inputs for item percentages, base penalties, and round counts (e.g., Nuke split %, Bomb loss penalty, Landmine damage).

### Task 4.2: Item Inventory & Shop UI
- **Action:** Create a modernized shop/inventory panel for the game screen.

### Task 4.3: Item Implementation — Atomic Bomb ($3,000*)
- **Logic:** Target a player for a Best of 3 RPS match.
- **Configurable Aspects:** Base price, failure penalty amount, and protected minimum balance ($100 default).

### Task 4.4: Item Implementation — Nuke ($1,000*)
- **Logic:** Lobby-voted Representative match.
- **Configurable Aspects:** Base price, Reward split % (75% default), Rep penalty % (50% default), Voter penalty % (30% default).

### Task 4.5: Item Implementation — Landmine ($500*)
- **Logic:** Hidden placement on a player during target selection.
- **Configurable Aspects:** Base price, base penalty amount ($500 default), and percentage penalty for low-balance players.

---

## Final Checklist
- [ ] UI is premium and handles large currency values gracefully.
- [ ] Spectator betting rewards are correctly calculated.
- [ ] **Lobby settings allow full control over item pricing and internal mechanics.**
- [ ] All items (Bomb, Nuke, Landmine) respect the custom lobby configurations.

---
*Plan updated: 2026-04-26 (v2.3.2)*