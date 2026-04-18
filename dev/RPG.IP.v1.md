# Rock, Paper, Gamble! — Implementation Plan

**Version:** 1.0  
**Companion To:** `rock_paper_gamble_devspec.md`  
**Status:** Ready for Development

---

## 0. Decisions Locked In

| Decision | Choice | Notes |
|---|---|---|
| Coins | Session-only | No persistence between games; profiles track stats, not balances |
| Accounts | Yes, from day 1 | Discord OAuth as primary; see Section 3 |
| Platform | Web browser only | React SPA, no native app |
| Monetization | Free / Social | No payments, no ads |
| Hosting | 100% Free Cloud | No downloads, no self-hosting; see Section 2 |

---

## 1. The Hosting Problem — Solved

The constraint: **fully free, no player downloads, no Vercel bandwidth limits, real accounts.**

The solution is a three-service serverless stack. Each service is free forever at this scale, and none requires a credit card or self-hosting.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLAYER'S BROWSER                         │
│                    (visits rockpapergamble.com)                 │
└──────────────────┬────────────────────┬────────────────────────┘
                   │                    │
        ┌──────────▼──────────┐  ┌──────▼─────────────────────┐
        │  CLOUDFLARE PAGES   │  │        PARTYKIT             │
        │  (Frontend Host)    │  │  (Real-Time Game Server)    │
        │                     │  │                             │
        │  • React + Vite SPA │  │  • WebSocket rooms          │
        │  • Unlimited BW     │  │  • Game state per lobby     │
        │  • Deploy via Git   │  │  • Runs on Cloudflare edge  │
        │  • Free forever     │  │  • Free tier (generous)     │
        └─────────────────────┘  └──────┬──────────────────────┘
                                        │
                               ┌────────▼──────────────────────┐
                               │          SUPABASE             │
                               │   (Auth + Persistent Data)    │
                               │                               │
                               │  • Discord OAuth login        │
                               │  • Player profiles            │
                               │  • All-time stats             │
                               │  • Free: 50k users, 500MB DB  │
                               └───────────────────────────────┘
```

### Why not Vercel?
Vercel Serverless Functions don't support persistent WebSocket connections — they're stateless by design. Game rooms need a long-lived, stateful connection per lobby.

### Why not "everyone downloads the code"?
That model (peer-to-peer or local server) would require every host to install Node.js, run a terminal command, open firewall ports, and have a stable IP. Not social-game friendly.

### This Stack Is Truly Free Because:
- **Cloudflare Pages** — Unlimited requests and bandwidth on the free plan. No tricks.
- **PartyKit** — Built for exactly this. Free tier covers thousands of concurrent game rooms. Acquired by Cloudflare in 2024, running on their edge network globally.
- **Supabase** — 50,000 monthly active users and 500MB database free forever. More than enough for a social game.

---

## 2. Full Tech Stack

### 2.1 Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript | Industry standard, great ecosystem |
| Build Tool | Vite | Fast HMR, Cloudflare Pages compatible |
| State | Zustand | Lightweight; game state fits in one store |
| Real-time Client | `partysocket` | Official PartyKit WebSocket client |
| Auth Client | `@supabase/supabase-js` | Handles OAuth flow, session tokens |
| Styling | Tailwind CSS v4 | Utility-first, no build config |
| Animation | Framer Motion | RPS reveal, coin animations |
| Sound | Howler.js | Cross-browser audio |
| Routing | React Router v6 | SPA routing (lobby, game, profile) |

### 2.2 Game Server (PartyKit)
| Layer | Choice | Why |
|---|---|---|
| Runtime | PartyKit (TypeScript) | Stateful WebSocket rooms = lobbies |
| State | In-memory per room | Session-only coins; no DB writes mid-game |
| Auth Validation | Supabase JWT verify | Server validates tokens on connect |
| Persistence Hook | Supabase REST API | Write final game stats on session end only |

### 2.3 Auth + Database (Supabase)
| Layer | Choice | Why |
|---|---|---|
| Auth | Supabase Auth | Discord OAuth, email magic link fallback |
| Database | PostgreSQL (Supabase) | Profiles, lifetime stats, game history |
| Real-time | Not used (PartyKit handles this) | — |

---

## 3. Authentication — Discord OAuth

"Different login system" = **Discord OAuth**, not Google/email-first.

**Why Discord:**
- This is a social party game. Every gamer already has Discord.
- Discord profiles include a display name and avatar out-of-the-box — no setup screen needed after signup.
- Feels native to the target audience.
- Supabase supports it natively with 3 config fields (Client ID, Secret, Redirect URL).

**Fallback:** Email magic link (no password) for people without Discord.

### 3.1 Login Flow
```
User clicks "Sign in with Discord"
  └─> Supabase Auth opens Discord OAuth popup
  └─> Discord returns access token to Supabase
  └─> Supabase creates/updates user row in `profiles` table
  └─> Supabase returns JWT to the browser
  └─> JWT is stored in Supabase's sessionStorage (automatic)
  └─> JWT is sent to PartyKit on WebSocket connect for server-side validation
  └─> Player lands in the lobby browser
```

### 3.2 Profile Auto-Creation
On first Discord login, a Supabase database trigger automatically creates a row in the `profiles` table using the Discord display name and avatar. Zero onboarding friction.

---

## 4. Database Schema

### 4.1 `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 `player_stats`
```sql
CREATE TABLE player_stats (
  player_id         UUID PRIMARY KEY REFERENCES profiles(id),
  games_played      INT DEFAULT 0,
  games_won         INT DEFAULT 0,
  duels_played      INT DEFAULT 0,
  duels_won         INT DEFAULT 0,
  total_wagered     BIGINT DEFAULT 0,   -- lifetime coins wagered
  total_earned      BIGINT DEFAULT 0,   -- lifetime coins earned from bets
  biggest_win       INT DEFAULT 0,      -- single-round coin gain record
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `game_sessions` (written at game end only)
```sql
CREATE TABLE game_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_code    TEXT NOT NULL,
  player_ids    UUID[] NOT NULL,
  winner_id     UUID REFERENCES profiles(id),
  final_coins   JSONB,   -- { "player_id": final_coin_balance, ... }
  round_count   INT,
  config        JSONB,   -- lobby settings snapshot
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Supabase Row-Level Security
```sql
-- Players can only read/update their own profile and stats
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats" ON player_stats
  FOR ALL USING (auth.uid() = player_id);
  
-- Anyone can read all profiles (for lobby display)
CREATE POLICY "public read profiles" ON profiles
  FOR SELECT USING (true);
```

---

## 5. Project Structure

```
rock-paper-gamble/
├── frontend/                     # Cloudflare Pages app
│   ├── src/
│   │   ├── components/
│   │   │   ├── lobby/
│   │   │   │   ├── LobbyBrowser.tsx      # Find/create games
│   │   │   │   ├── LobbyRoom.tsx         # Pre-game waiting room
│   │   │   │   └── PlayerCard.tsx
│   │   │   ├── game/
│   │   │   │   ├── GameScreen.tsx        # Main game wrapper
│   │   │   │   ├── BettingPhase.tsx      # Betting UI
│   │   │   │   ├── RPSDuel.tsx           # Duel UI
│   │   │   │   ├── ResultsScreen.tsx     # Payout reveal
│   │   │   │   ├── Leaderboard.tsx       # Sidebar standings
│   │   │   │   └── ChallengeSelector.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   └── profile/
│   │   │       └── ProfilePage.tsx
│   │   ├── store/
│   │   │   ├── gameStore.ts       # Zustand: live game state
│   │   │   └── authStore.ts       # Zustand: user session
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Supabase client init
│   │   │   ├── partykit.ts        # PartyKit socket manager
│   │   │   ├── payouts.ts         # Parimutuel calc (shared logic)
│   │   │   └── sounds.ts          # Howler sound registry
│   │   ├── types/
│   │   │   └── game.ts            # Shared types (mirrored in server)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── sounds/               # .mp3/.ogg sound files
│   ├── package.json
│   └── vite.config.ts
│
├── server/                       # PartyKit game server
│   ├── src/
│   │   ├── game.ts               # Main PartyKit server class
│   │   ├── gameLogic.ts          # RPS rules, payout math, state machine
│   │   ├── auth.ts               # JWT verification via Supabase
│   │   └── statsWriter.ts        # Write to Supabase at game end
│   ├── types/
│   │   └── game.ts               # Same types as frontend (symlinked or shared pkg)
│   └── partykit.json             # PartyKit config
│
├── supabase/
│   ├── migrations/               # SQL migration files
│   └── seed.sql                  # Dev seed data
│
└── README.md
```

---

## 6. PartyKit Server — State Machine

The server is the single source of truth. Clients receive state updates; they never calculate outcomes.

```typescript
// server/src/game.ts — simplified

type GamePhase =
  | 'WAITING'          // Lobby, waiting for players
  | 'CHALLENGE_SELECT' // Active player picking opponent
  | 'BETTING'          // 30s betting window
  | 'RPS_ROUND'        // Active RPS round
  | 'ROUND_RESULT'     // Showing round outcome
  | 'DUEL_RESULT'      // Showing duel outcome + payouts
  | 'GAME_OVER';       // Final leaderboard

export default class GameRoom implements Party.Server {
  state: GameSession;        // Full game state in memory
  timers: Map<string, ReturnType<typeof setTimeout>>;

  // Called when a player connects
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const player = this.validateJWT(ctx.request.headers.get('Authorization'));
    this.addPlayer(player);
    conn.send(JSON.stringify({ type: 'FULL_STATE', state: this.state }));
    this.broadcast({ type: 'PLAYER_JOINED', player });
  }

  // Central message handler — all game actions come through here
  onMessage(raw: string, sender: Party.Connection) {
    const msg = JSON.parse(raw);
    switch (msg.type) {
      case 'SELECT_CHALLENGER':   this.handleChallengeSelect(msg, sender); break;
      case 'PLACE_BET':           this.handlePlaceBet(msg, sender); break;
      case 'PASS_BET':            this.handlePassBet(msg, sender); break;
      case 'LOCK_CHOICE':         this.handleLockChoice(msg, sender); break;
      case 'START_GAME':          this.handleStartGame(sender); break;
    }
  }

  // Called when a player disconnects
  onClose(conn: Party.Connection) {
    this.markDisconnected(conn.id);
    this.scheduleReconnectWindow(conn.id, 15_000);
  }
}
```

### 6.1 Commit-Reveal for RPS (Anti-Cheat)
```typescript
// When player locks a choice:
// 1. Server receives the choice and hashes it immediately
// 2. Broadcasts the hash to all players (proves it was locked)
// 3. Only reveals actual choice after BOTH players have locked in
// 4. Then verifies hash matches the original choice

function hashChoice(playerId: string, choice: string, salt: string): string {
  return crypto.subtle.digest("SHA-256", `${playerId}:${choice}:${salt}`);
}
```

---

## 7. Frontend State (Zustand)

```typescript
// store/gameStore.ts

interface GameStore {
  // Connection
  socket: PartySocket | null;
  connected: boolean;

  // Game state (mirrors server)
  session: GameSession | null;
  phase: GamePhase;
  currentDuel: Duel | null;
  myCoins: number;

  // Local UI state
  myBet: { target: string; amount: number } | null;
  myChoice: 'rock' | 'paper' | 'scissors' | null;
  betLocked: boolean;
  choiceLocked: boolean;

  // Actions
  connect: (lobbyId: string, jwt: string) => void;
  selectChallenger: (targetId: string) => void;
  placeBet: (targetId: string, amount: number) => void;
  passBet: () => void;
  lockChoice: (choice: RPSChoice) => void;
}
```

---

## 8. Implementation Milestones

Each milestone is independently deployable and testable.

---

### Milestone 1 — Project Scaffolding & Auth
**Time estimate: 2–3 days**

**Goal:** A player can log in with Discord and see a (empty) lobby browser.

**Tasks:**
- [ ] Init monorepo: `frontend/` and `server/` directories
- [ ] Set up Vite + React + TypeScript + Tailwind in `frontend/`
- [ ] Set up PartyKit project in `server/` (`npx partykit init`)
- [ ] Create Supabase project, enable Discord OAuth
- [ ] Run Supabase migrations: `profiles`, `player_stats`, `game_sessions`
- [ ] Write the Supabase auto-create profile trigger (SQL)
- [ ] Build `LoginPage.tsx` — Discord OAuth button + magic link fallback
- [ ] Build `AuthGuard.tsx` — redirects unauthenticated users to login
- [ ] Build basic `LobbyBrowser.tsx` shell (no functionality yet)
- [ ] Configure Cloudflare Pages project (point to GitHub repo `frontend/` dir)
- [ ] Deploy PartyKit server (`npx partykit deploy`)
- [ ] Set environment variables (see Section 10)
- [ ] Smoke test: login → land on lobby screen

**Acceptance Criteria:**
- Discord login works end-to-end in production (not just dev)
- Profile row auto-created in Supabase on first login
- Cloudflare Pages build succeeds from `main` branch push

---

### Milestone 2 — Lobby System
**Time estimate: 3–4 days**

**Goal:** Players can create lobbies, share a code, join, and see each other in the waiting room.

**Tasks:**
- [ ] PartyKit server: `WAITING` phase, `onConnect`, `onClose` handlers
- [ ] PartyKit server: emit `PLAYER_JOINED`, `PLAYER_LEFT`, `FULL_STATE` events
- [ ] `LobbyBrowser.tsx` — "Create Game" button generates a 6-char lobby code
- [ ] `LobbyBrowser.tsx` — "Join Game" input field
- [ ] `LobbyRoom.tsx` — Waiting room showing all connected players
- [ ] `LobbyRoom.tsx` — Host-only "Start Game" button (min 2 players)
- [ ] `LobbyRoom.tsx` — Lobby config panel (starting coins, rounds, etc.)
- [ ] `partykit.ts` lib — Zustand-connected socket manager, reconnect logic
- [ ] Handle player disconnect/reconnect in `WAITING` phase
- [ ] Share lobby link (copy URL with lobby code pre-filled)

**Acceptance Criteria:**
- Two browser tabs (different Discord accounts) can join the same lobby
- Player list updates in real-time when players join/leave
- Host can configure and start the game

---

### Milestone 3 — Core Game Engine (Server-Side)
**Time estimate: 4–5 days**

**Goal:** The full game loop runs correctly on the server. No UI yet — testable via WebSocket client (e.g., Postman or a test harness).

**Tasks:**
- [ ] `gameLogic.ts` — turn order rotation
- [ ] `gameLogic.ts` — `CHALLENGE_SELECT` phase + timeout (auto-random if host idles)
- [ ] `gameLogic.ts` — `BETTING` phase timer (30s), bet validation, `PLACE_BET`, `PASS_BET`
- [ ] `gameLogic.ts` — Parimutuel payout calculator (from spec Section 5.4)
- [ ] `gameLogic.ts` — `RPS_ROUND` phase: commit-reveal, 10s choice timer, auto-random on timeout
- [ ] `gameLogic.ts` — Round tie detection → immediate replay
- [ ] `gameLogic.ts` — Best-of-3 match winner determination
- [ ] `gameLogic.ts` — Payout distribution + coin balance update
- [ ] `gameLogic.ts` — Advance turn order, loop to next round
- [ ] `gameLogic.ts` — `GAME_OVER` trigger (rounds complete or all-but-one eliminated)
- [ ] `statsWriter.ts` — POST to Supabase REST API on game end to update `player_stats` and insert `game_sessions` row
- [ ] Unit tests for payout math and RPS outcome logic

**Acceptance Criteria:**
- Full game completes without a full round of 4-player test
- Parimutuel payouts verified correct with test cases
- Coin floors (can't go below 0) enforced server-side
- Stats written to Supabase at game end

---

### Milestone 4 — Game UI
**Time estimate: 5–6 days**

**Goal:** The full game is playable in the browser with a real UI.

**Tasks:**
- [ ] `GameScreen.tsx` — Main wrapper, phase-driven rendering
- [ ] `Leaderboard.tsx` — Always-visible coin standings sidebar
- [ ] `ChallengeSelector.tsx` — Active player picks opponent (player cards, clickable)
- [ ] `BettingPhase.tsx` — Countdown timer, bet slider, confirm/pass buttons, live odds display
- [ ] `BettingPhase.tsx` — Show other players' bet statuses (e.g., "Carol — betted ✓")
- [ ] `RPSDuel.tsx` — Rock/Paper/Scissors choice buttons with locked state
- [ ] `RPSDuel.tsx` — Countdown per round, "Waiting for opponent..." state
- [ ] `RPSDuel.tsx` — Simultaneous reveal animation (Framer Motion)
- [ ] `RPSDuel.tsx` — Running match score display (e.g., "2 — 1")
- [ ] `ResultsScreen.tsx` — Winner banner, coin delta per player, payout breakdown
- [ ] `ResultsScreen.tsx` — "Next round in 3..." countdown
- [ ] `GameScreen.tsx` — `GAME_OVER` final leaderboard with winner celebration
- [ ] Connect all components to Zustand store (server state drives UI)
- [ ] Disconnect/reconnect UI banner ("Player X disconnected — 12s to reconnect")

**Acceptance Criteria:**
- 4-player game completable start to finish in one browser session
- All phases render correctly, transitions are smooth
- Spectators see the same state as duelists
- Mobile viewport is usable (responsive layout)

---

### Milestone 5 — Sound, Polish & Profile Page
**Time estimate: 2–3 days**

**Goal:** The game feels alive and complete. Player profiles are real.

**Tasks:**
- [ ] `sounds.ts` — Register all sounds with Howler (see spec Section 16)
- [ ] Trigger sounds on phase transitions and game events
- [ ] Add coin particle/confetti animation on payouts (canvas or CSS)
- [ ] Implement emoji reaction bar for spectators
- [ ] `ProfilePage.tsx` — Avatar, username, lifetime stats from `player_stats`
- [ ] `ProfilePage.tsx` — Game history list from `game_sessions`
- [ ] Add loading skeletons for all async states
- [ ] Polish empty states (0 active lobbies, no game history)
- [ ] Favicon, page title, Open Graph meta tags for link sharing
- [ ] Source all sound assets (see Section 11)

**Acceptance Criteria:**
- All sound cues fire at the right moments
- Profile page shows real lifetime stats
- Game link previews look good when shared in Discord

---

### Milestone 6 — QA, Hardening & Launch
**Time estimate: 2–3 days**

**Goal:** Stable, shareable, and fun.

**Tasks:**
- [ ] Full 6-player playtest session — note all bugs
- [ ] Fix disconnect edge cases (duelist disconnects mid-RPS)
- [ ] Add server-side rate limiting (prevent bet-spam, choice-spam)
- [ ] Add Sentry (free tier) for frontend error tracking
- [ ] Add basic PartyKit error logging
- [ ] Stress test: open 12 connections in one lobby
- [ ] Cross-browser test: Chrome, Firefox, Safari, mobile Chrome
- [ ] Set up custom domain on Cloudflare Pages (optional, free with Cloudflare)
- [ ] Write `README.md` with setup instructions
- [ ] Final deploy and share

---

## 9. Development Environment Setup

### Prerequisites
- Node.js 20+
- A Supabase account (free at supabase.com)
- A Cloudflare account (free at cloudflare.com)
- A Discord Developer application (free at discord.com/developers)

### Step-by-Step First-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/yourname/rock-paper-gamble
cd rock-paper-gamble/frontend && npm install
cd ../server && npm install

# 2. Configure environment variables (see Section 10)
cp frontend/.env.example frontend/.env.local
cp server/.env.example server/.env

# 3. Start the PartyKit dev server
cd server && npx partykit dev

# 4. Start the frontend dev server
cd frontend && npm run dev

# 5. Open http://localhost:5173
```

---

## 10. Environment Variables

### `frontend/.env.local`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PARTYKIT_HOST=localhost:1999            # Dev
# VITE_PARTYKIT_HOST=yourname.partykit.dev  # Production
```

### `server/.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server-side only, never exposed to client
```

### Cloudflare Pages Build Settings
| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `frontend` |
| Node.js version | `20` |

---

## 11. Assets Needed (Non-Code)

### Sound Effects
All can be sourced free from **freesound.org** or **mixkit.co**:

| File | Description |
|---|---|
| `bet-open.mp3` | Upbeat chime |
| `coin-clink.mp3` | Single coin drop |
| `betting-locked.mp3` | Drum roll (3s loop) |
| `rps-reveal.mp3` | Dramatic orchestral stab |
| `win-fanfare.mp3` | Short victory jingle |
| `lose.mp3` | Sad trombone / deflate |
| `underdog-win.mp3` | Surprise sting |
| `tick.mp3` | Single clock tick (for last 5s) |
| `countdown.mp3` | 3-2-1 countdown |

### Visuals
- Rock 🪨 / Paper 📄 / Scissors ✂️ can be emoji or custom SVG illustrations
- Consider **game-icons.net** for free SVG game icons (CC license)
- Coin icon: any free SVG coin asset

---

## 12. Staying Free — Limits Reference

| Service | Free Limit | Expected Usage |
|---|---|---|
| Cloudflare Pages | Unlimited BW, 500 builds/month | Fine for any traffic |
| PartyKit | ~1M requests/month, 10GB transfer | ~50 concurrent games costs ~0 |
| Supabase Auth | 50,000 MAU | Fine until you go viral |
| Supabase DB | 500MB, 2GB transfer | Profile/stats data is tiny |
| Supabase Storage | 1GB | Not used |

**If you somehow hit Supabase's 50k MAU limit — that's a great problem to have.** At that point the game is successful enough to justify a $25/month Pro plan.

---

## 13. Deployment Checklist

### Supabase
- [ ] Create project
- [ ] Run all migrations in order
- [ ] Enable Discord provider (Client ID + Secret from discord.com/developers)
- [ ] Add production redirect URL: `https://your-domain.com/auth/callback`
- [ ] Add dev redirect URL: `http://localhost:5173/auth/callback`
- [ ] Verify RLS policies are active on all tables

### PartyKit
- [ ] `npx partykit login` (authenticates with Cloudflare account)
- [ ] `npx partykit deploy` from `server/` directory
- [ ] Note the deployed URL: `https://rock-paper-gamble.yourname.partykit.dev`
- [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as PartyKit secrets

### Cloudflare Pages
- [ ] Connect GitHub repository
- [ ] Set build settings (Section 10)
- [ ] Add all `VITE_*` env vars in Pages settings (use production PartyKit URL)
- [ ] Trigger first deploy
- [ ] (Optional) Add custom domain

---

## 14. Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| PartyKit free tier limits hit | Low | Monitor dashboard; ~50 concurrent 8-player games = ~400 connections. Free tier handles thousands |
| Supabase cold start (DB pause after 1 week inactive on free) | Medium | Free tier DBs pause after 7 days of inactivity. Ping a Supabase edge function on login to wake it. Or upgrade to Pro ($25/mo) once active |
| JWT expiry mid-game | Low | Supabase auto-refreshes tokens. PartyKit should re-validate on reconnect, not on every message |
| Disconnect during RPS choice | Medium | Server auto-assigns random choice after timeout window. Announced to lobby |
| Cheating via client state manipulation | Low | Server is authoritative. Client never computes payouts or reveals choices |
| Discord OAuth outage | Very Low | Magic link email is the fallback |

---

*End of Implementation Plan — Rock, Paper, Gamble! v1.0*  
*Read alongside: `rock_paper_gamble_devspec.md`*
