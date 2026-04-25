# PLAN: V2.0.0 - Series Mode (First to 3)

Target: Implement "Best of" series logic where players/spectators bet on the final outcome of a match series rather than individual rounds.

## 🎯 Objectives
- Transition from "Single Round" matches to "Series" matches (First to 3 wins).
- Keep betting tied to the overall match outcome (Bet once at start).
- Add a "Win Streak" system (Super easy addition for Phase 4).

---

## 🏗️ Phase 1: Shared Schema Update
Update `packages/shared/index.ts` to support series tracking.
- [ ] Add `seriesScore: { [playerId: string]: number }` to `GameSession`.
- [ ] Add `targetWins: number` (default 3) to `GameSession`.
- [ ] Add `winStreak: number` to `Profile` type.

## 🧠 Phase 2: Server-side (PartyKit) Engine
Modify `packages/server/src/index.ts`.
- [ ] Update `resolveRPS` to increment `seriesScore` instead of ending the match immediately.
- [ ] Implement `checkSeriesWinner` logic after each round.
- [ ] Ensure `distributeRewards` only fires when a player hits the `targetWins`.
- [ ] Handle "Push" (Draw) cases: Round is discarded, score remains same, repeat round.

## 🎨 Phase 3: Frontend UI Enhancements
- [ ] **Lobby Scoreboard:** Add "Score Bubbles" (e.g., 🔴 🔴 ⚪ vs 🔵 ⚪ ⚪) above the players.
- [ ] **Results Screen:** Only trigger the big "Victory/Defeat" payout screen at the end of the series.
- [ ] **Round Transitions:** Add a small "Round X" toast or animation between matches.
- [ ] **Version Info:** Add a small Info (ⓘ) button in the corner that displays "v2.0.0" on the home screen.

## ⚡ Phase 4: The "Super Easy" Add-on
- [ ] **Win Streaks:** Track and display current win streaks next to player names in the lobby.
- [ ] **Persistence:** Update Supabase `profiles` to increment/reset streaks on match conclusion.

---

## 🛠️ Verification Checklist
- [ ] Start match, place bet.
- [ ] Win 1st round -> Score updates to 1-0, match continues.
- [ ] Win 3rd round -> Payout triggers, match ends.
- [ ] Verify Supabase persists the new win streak value.

---

## Agent Assignments
- **Logic:** `backend-specialist` (Server-side series state)
- **UI:** `frontend-specialist` (Scoreboard & Transitions)
- **Persistence:** `orchestrator` (Supabase streak updates)
