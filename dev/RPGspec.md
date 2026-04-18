# Rock, Paper, Gamble! — Full Development Specification

**Version:** 1.0  
**Document Type:** Game Design & Engineering Spec  
**Status:** Draft

---

## 1. Overview

**Rock, Paper, Gamble!** is a multiplayer social betting game built around Rock Paper Scissors (RPS). Players take turns challenging each other to best-of-three RPS duels. Before each duel begins, both participants and spectators can place wagers on the outcome. The player who grows their coin balance the most across the session wins.

The game is designed to be real-time, social, and fast-paced — somewhere between a party game and a poker night.

---

## 2. Core Game Loop

```
START OF ROUND
    └─> Active player selects a Challenger (another player)
    └─> Betting Phase opens (30 seconds)
           ├─> Challenger and Challengee can bet on themselves
           ├─> Spectators can bet on either player
           └─> All bets are locked after the timer or when all players confirm
    └─> RPS Duel begins (Best of 3)
           ├─> Round 1 — simultaneous choice reveal
           ├─> Round 2 — simultaneous choice reveal
           └─> Round 3 (if needed) — simultaneous choice reveal
    └─> Winner declared
    └─> Pot is distributed to winning bettors
    └─> Next player's turn (rotating order or lobby-vote)
REPEAT
```

---

## 3. Players & Roles

### 3.1 Active Player (The Challenger)
- It is their "turn" in the round order.
- Must select one other player in the lobby to challenge.
- May place a bet on themselves or pass on betting.
- Participates in the RPS duel.

### 3.2 Challengee (The Challenged Player)
- Selected by the Active Player.
- Cannot refuse the duel.
- May place a bet on themselves or pass on betting.
- Participates in the RPS duel.

### 3.3 Spectators (All Other Players)
- All players not in the current duel.
- May place bets on either duelist (the Challenger or the Challengee).
- Cannot place bets on "tie" outcomes (to keep it simple in v1).
- Earn or lose coins based on the outcome.

### 3.4 Player States
| State | Description |
|---|---|
| `IDLE` | Waiting for their turn; may spectate and bet |
| `SELECTING` | Active player choosing their challenger |
| `BETTING` | Currently in the betting window |
| `DUELING` | In the RPS match |
| `SPECTATING` | Watching and potentially betting on the current duel |
| `ELIMINATED` | Out of coins (optional elimination mode) |

---

## 4. Game Modes

### 4.1 Standard (Recommended for v1)
- All players start with the same coin amount (e.g., 1,000 coins).
- Game ends after a fixed number of rounds (e.g., N rounds = number of players × 2).
- Player with the most coins at the end wins.
- No eliminations.

### 4.2 Elimination Mode (v2)
- Players with 0 coins are eliminated.
- Last player standing wins.

### 4.3 Time Attack (v2)
- Fixed time limit (e.g., 10 minutes).
- Most coins when the clock hits zero wins.

---

## 5. Coin & Economy System

### 5.1 Starting Balance
- All players begin with **1,000 coins**.
- Coins cannot go below 0 (floor is 0 in Standard mode).

### 5.2 Minimum & Maximum Bets
| Param | Value |
|---|---|
| Minimum Bet | 10 coins |
| Maximum Bet | 100% of the bettor's current balance |
| Default Bet Suggestion | 10% of current balance (UI hint only) |

### 5.3 Betting Rules
- A player may only bet once per duel (no partial/split bets in v1).
- Bets are placed during the **Betting Phase** window only.
- A player who has 0 coins may still spectate but cannot bet.
- Players who do not place a bet during the Betting Phase simply skip — no penalty.

### 5.4 Payout Structure
The pot is a simple proportional split:

```
Total Pot = sum of all bets placed on both sides

Winning Side Pot = sum of all bets placed on the winner
Losing Side Pot  = sum of all bets placed on the loser

Each winning bettor receives:
  their_bet + (their_bet / winning_side_pot) × losing_side_pot
```

This is a parimutuel-style payout — the more people bet on the winner, the smaller each individual's gain. Betting on an underdog is more lucrative.

**Example:**
- Alice bets 200 on Player A (winner)
- Bob bets 100 on Player A (winner)
- Carol bets 300 on Player B (loser)

Winning pot = 300. Losing pot = 300.
- Alice receives: 200 + (200/300 × 300) = 200 + 200 = **400**
- Bob receives: 100 + (100/300 × 300) = 100 + 100 = **200**
- Carol loses her 300.

### 5.5 Tie Handling in RPS
If a Best-of-3 ends in an overall tie (1-1-1 is impossible; ties in individual rounds just get replayed — see Section 7). The overall match result is always Win or Loss — no draws at the match level.

---

## 6. Betting Phase

### 6.1 Timer
- The Betting Phase lasts **30 seconds** by default.
- A visible countdown is shown to all players.
- Phase ends early if all active players confirm their bet (or pass).

### 6.2 Bet Confirmation UI
- Players see both duelists, their current coin balances, and live bet totals on each side.
- A slider or input field lets the player set their bet amount.
- A "Pass" button allows opting out of the round's betting without penalty.
- Once submitted, a bet is **locked** — no take-backs.

### 6.3 Odds Display
- Real-time implied odds are shown as bets come in (e.g., "2.1x payout if Player A wins").
- This is recalculated live as bets are placed.

---

## 7. RPS Duel Rules

### 7.1 Format
- Best of 3 rounds.
- Simultaneous reveal — both players lock in their choice before either is shown.

### 7.2 Choices
- Rock 🪨
- Paper 📄
- Scissors ✂️

### 7.3 Win Conditions
| Player 1 | Player 2 | Result |
|---|---|---|
| Rock | Scissors | P1 Wins |
| Scissors | Paper | P1 Wins |
| Paper | Rock | P1 Wins |
| Same | Same | Tie (replay this round) |

### 7.4 Round Tie (Replay) Rule
- If both players pick the same symbol, that individual round does not count and is replayed immediately.
- Replays are unlimited within a single round slot.

### 7.5 Choice Timer
- Each player has **10 seconds** to lock in their choice per round.
- If a player times out, their choice is randomly selected (to prevent stalling).
- The UI shows a countdown and flashes a warning at 3 seconds.

### 7.6 Reveal Animation
- Both choices are revealed simultaneously after both players lock in (or time expires).
- A short 1–2 second dramatic reveal animation plays before the outcome is shown.

---

## 8. Round Structure & Turn Order

### 8.1 Turn Rotation
- Players rotate clockwise (by join order) through the "Active Player" role.
- Every player gets one turn as the Active Player per full rotation.

### 8.2 Challenging Rules
- The Active Player may challenge any non-eliminated player except themselves.
- In v1, they cannot challenge the same player twice in a row (optional rule; configurable by lobby host).

### 8.3 Round Flow Timeline
```
Phase 1 — Challenge Selection   (Active Player picks, ~10s)
Phase 2 — Betting Phase         (All players, 30s)
Phase 3 — RPS Duel              (3 rounds × ~10s = ~30s)
Phase 4 — Result & Payout       (~5s animation)
Phase 5 — Transition            (~3s before next round)
```

**Estimated time per round:** ~80 seconds

---

## 9. Lobby & Session Management

### 9.1 Lobby Settings (Host Configurable)
| Setting | Default | Options |
|---|---|---|
| Starting Coins | 1,000 | 500 / 1,000 / 2,500 / 5,000 |
| Game Mode | Standard | Standard / Elimination / Time Attack |
| Max Players | 8 | 2–12 |
| Number of Rounds | Players × 2 | Custom |
| Same-player repeat challenge | Allowed | Allowed / Blocked |
| Betting Phase Timer | 30s | 15s / 30s / 60s |
| Choice Timer | 10s | 5s / 10s / 15s |

### 9.2 Player Count
- Minimum: 2 players (1 duelist per side; no spectators in 2-player game — both must bet or pass on themselves)
- Maximum: 12 players (recommended sweet spot: 4–8)
- With only 2 players: spectator betting is disabled.

### 9.3 Reconnect Handling
- A player who disconnects mid-round has **15 seconds** to reconnect.
- If they are a duelist and don't reconnect, their RPS choices are auto-selected randomly.
- If they are a spectator, their locked bets still stand.
- After 2 consecutive disconnects, the player is flagged as AFK and may be voted out by the lobby.

---

## 10. UI/UX Specification

### 10.1 Main Game Screen Layout
```
┌──────────────────────────────────────────────────────┐
│  ROCK, PAPER, GAMBLE!              Round 3 of 12     │
├──────────────────────────────────────────────────────┤
│                                                      │
│   [CHALLENGER]             VS          [CHALLENGEE]  │
│   Player A — 1,420 🪙                  Player B — 880 🪙 │
│                                                      │
│   Bets on A: 640 🪙        Bets on B: 300 🪙          │
│   Payout: 1.47x            Payout: 3.13x             │
│                                                      │
├──────────────────────────────────────────────────────┤
│                 BETTING PHASE: 18s                   │
│  [ 🪨 Rock ] [ 📄 Paper ] [ ✂️ Scissors ]  ← BET ON  │
│  Your Bet: [_______] 🪙     [CONFIRM]  [PASS]        │
├──────────────────────────────────────────────────────┤
│  SPECTATORS:                                         │
│  Carol ─ bet 200 on A  |  Dave ─ bet 150 on B        │
│  Eve ─ no bet yet      |  Frank ─ no bet yet         │
└──────────────────────────────────────────────────────┘
```

### 10.2 Duel Screen
- Full-screen focus on both duelists.
- Large animated RPS choice reveal.
- Running score shown (e.g., "Round 2 | A: 1 — B: 0").
- Spectator chat/reaction bar on the side.

### 10.3 Results Screen
- Winner highlighted with celebration animation.
- Coin delta shown for every player (e.g., "+340 🪙", "−200 🪙").
- Leaderboard snapshot.
- "Next Round in 3..." countdown.

### 10.4 Leaderboard Panel
- Always visible (collapsible on mobile).
- Shows all players, their current coin balance, and win/loss record.
- Highlights the current Active Player and the two duelists.

---

## 11. Tech Stack Recommendation

### 11.1 Frontend
| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| State Management | Zustand or Redux Toolkit |
| Real-time | Socket.io client |
| Animation | Framer Motion |
| Styling | Tailwind CSS |
| Sound FX | Howler.js |

### 11.2 Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Real-time | Socket.io server |
| Game State | In-memory (Redis for multi-server scaling) |
| Database | PostgreSQL (persistent stats, leaderboards) |
| Auth | JWT / Guest tokens (no forced account creation in v1) |

### 11.3 Hosting
| Service | Purpose |
|---|---|
| Vercel / Cloudflare Pages | Frontend |
| Railway / Render / Fly.io | Backend + WebSocket server |
| Redis Cloud | Session/game state |
| Supabase / Neon | PostgreSQL |

---

## 12. Data Models

### 12.1 Player
```typescript
interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string;
  coins: number;
  isConnected: boolean;
  role: 'challenger' | 'challengee' | 'spectator';
  currentBet?: Bet;
  stats: {
    wins: number;
    losses: number;
    totalWagered: number;
    totalEarned: number;
  };
}
```

### 12.2 Bet
```typescript
interface Bet {
  playerId: string;
  targetPlayerId: string; // who they're betting will win
  amount: number;
  placedAt: number; // timestamp
  locked: boolean;
}
```

### 12.3 Duel
```typescript
interface Duel {
  id: string;
  challengerId: string;
  challengeeId: string;
  rounds: RPSRound[];
  winner?: string; // playerId
  bets: Bet[];
  status: 'pending' | 'betting' | 'active' | 'complete';
  startedAt: number;
  completedAt?: number;
}
```

### 12.4 RPSRound
```typescript
interface RPSRound {
  roundNumber: number;
  challengerChoice?: 'rock' | 'paper' | 'scissors';
  challengeeChoice?: 'rock' | 'paper' | 'scissors';
  winner?: string | 'tie';
  resolvedAt?: number;
}
```

### 12.5 GameSession
```typescript
interface GameSession {
  id: string;
  hostId: string;
  players: Player[];
  config: LobbyConfig;
  currentDuelId?: string;
  roundNumber: number;
  turnOrder: string[]; // playerIds in rotation
  activePlayerIndex: number;
  status: 'lobby' | 'in_progress' | 'complete';
  createdAt: number;
}
```

---

## 13. WebSocket Events

### 13.1 Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_lobby` | `{ lobbyId, playerName }` | Join a game lobby |
| `select_challenger` | `{ targetPlayerId }` | Active player picks opponent |
| `place_bet` | `{ targetPlayerId, amount }` | Place a wager |
| `pass_bet` | `{}` | Opt out of betting this round |
| `lock_choice` | `{ choice: 'rock' \| 'paper' \| 'scissors' }` | Lock in RPS choice |
| `confirm_ready` | `{}` | Ready up for next round |

### 13.2 Server → Client
| Event | Payload | Description |
|---|---|---|
| `lobby_update` | `GameSession` | Full lobby state refresh |
| `round_start` | `{ activePlayerId, roundNumber }` | New round begins |
| `challenge_set` | `{ challengerId, challengeeId }` | Duel participants announced |
| `betting_open` | `{ duelId, timeLimit }` | Betting phase starts |
| `bet_update` | `{ bets, odds }` | Live bet totals update |
| `betting_closed` | `{ finalBets }` | Betting phase over |
| `rps_round_start` | `{ roundNumber }` | RPS round begins |
| `choice_locked` | `{ playerId }` | Confirms a player locked their choice (no choice revealed yet) |
| `rps_round_result` | `{ round: RPSRound, score }` | Round outcome revealed |
| `duel_result` | `{ duel: Duel, payouts }` | Final duel + payout summary |
| `player_update` | `{ playerId, coins }` | Individual balance change |
| `game_over` | `{ leaderboard }` | Session ends, final standings |
| `player_disconnected` | `{ playerId, reconnectWindowMs }` | Player connection lost |

---

## 14. Game Logic Rules Summary

1. Bets are parimutuel — the pot is the sum of all bets, split proportionally among winners.
2. Individual RPS round ties cause a replay of that round (not the whole match).
3. A duel always produces exactly one winner at the match level.
4. A player can bet on their opponent (sandbagging is allowed and encouraged).
5. Spectators cannot bet on a "draw" — only on one of the two duelists.
6. The Active Player must challenge someone — skipping is not allowed.
7. Timed-out RPS choices are randomly assigned to prevent abuse.
8. Coins cannot go negative — a player may only wager up to their full balance.
9. A player with 0 coins may still spectate but cannot bet.
10. The game host may end the session early at any time.

---

## 15. Anti-Cheat & Fairness

- All RPS choices are submitted to the server **before** either is revealed to prevent front-running.
- Choices are hashed server-side upon receipt and the hash is broadcast immediately — revealing the choice only after both players have locked in (commit-reveal scheme).
- Betting is locked before the RPS phase starts — no bet can be placed once choices are being made.
- Server is the single source of truth for all coin balances and bet outcomes.

---

## 16. Sound & Feedback Design

| Trigger | Sound |
|---|---|
| Betting Phase Opens | Upbeat chime, coin jingle |
| Bet Placed | Satisfying "clink" |
| Betting Locked | Drum roll begins |
| RPS Choices Revealed | Dramatic stab + symbol SFX |
| Win | Fanfare + coin shower |
| Loss | Sad trombone or deflate |
| Underdog Win | Big surprise sting |
| Last 5 seconds of timer | Ticking clock |

---

## 17. Stretch Features (v2+)

- **Power-ups:** Rare cards that let you peek at an opponent's choice or double your payout.
- **Tournaments:** Bracket-style with an entry fee pot.
- **Cosmetics:** Custom RPS gesture animations, avatars, coin themes.
- **Mobile App:** Native iOS/Android via React Native.
- **Replay System:** Watch past duels back with bet overlay.
- **Side Bets:** Bet on specific outcomes like "Player A wins 2-0" for higher multipliers.
- **Daily Challenges:** Play X rounds, earn bonus coins.
- **Spectator Reactions:** Emoji reactions that appear on screen during duels.

---

## 18. Milestones

| Milestone | Deliverables | Est. Time |
|---|---|---|
| M1 — Core Engine | RPS duel logic, WebSocket server, basic game state | 1 week |
| M2 — Betting System | Bet placement, parimutuel payout engine, coin balances | 1 week |
| M3 — Frontend v1 | Lobby, betting UI, duel screen, results screen | 1.5 weeks |
| M4 — Polish | Animations, sound, reconnect handling, anti-cheat | 1 week |
| M5 — QA & Launch | Playtesting, bug fixes, deployment | 0.5 week |
| **Total** | | **~5 weeks** |

---

*End of Specification — Rock, Paper, Gamble! v1.0*
