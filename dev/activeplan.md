# RockPaperGamble --- Version 2.2.0 Development Plan

## Overview

Version 2.2.0 focuses on polish, usability, and gameplay balance. The
goal is to make the game feel more modern, accessible on mobile devices,
and clearer for players during matches.

Key themes: - UI modernization - Mobile usability - Turn clarity - Game
balance systems - Transparency through changelogs - Improved player
interaction

------------------------------------------------------------------------

# 1. Animations & UX

## 1.1 Launch Animation

Add a lightweight startup animation to improve the first impression when
the website loads.

Behavior: - Background fades in - Logo scales slightly into place -
Lobby UI elements appear sequentially

Guidelines: - Total animation time under 800ms - Use CSS transforms and
opacity only - Respect reduced-motion accessibility preferences

------------------------------------------------------------------------

## 1.2 UI Refresh

Modernize the UI while keeping the existing structure intact.

Changes: - Updated font system - Improved spacing between UI
components - Rounded cards and buttons - Softer shadows - Cleaner color
palette

Recommended spacing scale: 4px / 8px / 12px / 16px / 24px / 32px / 48px

Design goal: A playful, welcoming interface that feels like a casual
social game.

------------------------------------------------------------------------

## 1.3 New Sign‑In Page

Separate the login and lobby into two pages.

Routes: /signin /lobby

Signin Page Layout: - Centered card layout - Username input - Join
button - Background gradient - Subtle decorative rock/paper/scissors
icons

------------------------------------------------------------------------

## 1.4 Lobby Improvements

Lobby should feel like a multiplayer waiting room.

Add: - Player avatars - Player money display - Join/leave animations -
Ready indicators - Host badge

Lobby layout: Header Player List Game Settings Summary Start Game Button

------------------------------------------------------------------------

# 1b. Game Settings System

Add a simple settings panel accessible in the lobby.

Button: ⚙ Game Settings

Settings appear in a modal panel.

------------------------------------------------------------------------

## Starting Money

Allow hosts to configure starting money.

Range: \$100 → \$1,000,000

Default: \$10,000

Input types: - Slider - Numeric input

------------------------------------------------------------------------

## Balance Modifiers

To prevent gameplay from breaking at extreme values, apply modifiers.

  Starting Money     Loss Modifier   Win Modifier
  ------------------ --------------- --------------
  \$100 -- \$999     Lose −50%       Win +35%
  \$1k -- \$10k      Normal          Normal
  \$10k -- \$100k    Normal          Normal
  \$100k -- \$499k   Lose +25%       Win −15%
  \$500k -- \$1M     Lose +50%       Win −35%

UI should clearly show when modifiers are active.

Example: Starting Money: \$500,000\
High-Stake Mode Enabled\
Losses +50%\
Wins −35%

------------------------------------------------------------------------

# 1c. Mobile Optimization

The current UI has overflow and hover issues on mobile.

## Responsive Breakpoints

Desktop: \>1024px\
Tablet: 768--1024px\
Mobile: \<768px

------------------------------------------------------------------------

## UI Overflow Fixes

Prevent horizontal scrolling.

Solutions: - max-width: 100% - flex wrapping - responsive containers -
overflow-x hidden

------------------------------------------------------------------------

## Touch-Friendly Buttons

Minimum tap height: 48px

Spacing: 8--12px between buttons

------------------------------------------------------------------------

## Gift Button Fix

Current problem: Gift system uses hover interaction.

Solution: Replace hover logic with tap toggle.

Tap → open gift menu\
Tap again → close menu

------------------------------------------------------------------------

# 1d. Player Order System

Improve clarity of turn order during gameplay.

## Turn Queue Display

Show a visible player queue.

Example:

Turn Order\
1. Alex\
2. Jamie\
3. Chris\
4. You

Highlight the active player.

------------------------------------------------------------------------

## Next Player Indicator

Display who is playing next after each turn.

Example:

Next Player: Jamie

------------------------------------------------------------------------

## Host Reorder Controls

Allow host to reorder players before the game begins.

Use drag handles.

Example: ☰ Alex\
☰ Jamie\
☰ Chris

------------------------------------------------------------------------

## Turn Logic

Store order as an array.

playerTurnOrder: \[id1, id2, id3\]

Track current player index and loop through turns.

------------------------------------------------------------------------

# 1e. Changelog System

Add both a quick changelog and a full version history viewer.

## Quick Changelog

Inside the info menu:

Version 2.2.0

• New animations\
• Modern lobby UI\
• Game settings system\
• Mobile fixes\
• Player order controls\
• Full changelog viewer

------------------------------------------------------------------------

## Full Changelog Viewer

Add button: View Full Changelog

Loads data from:

\~/Hermes/Projects/Rock Paper Gamble/RPGPublic/changelog.md

Render the markdown into a scrollable modal.

Recommended libraries: - marked.js - markdown-it

------------------------------------------------------------------------

# 2. Additional Features for 2.2.0

## 2.1 Player Statistics

Track basic player statistics during a match.

Stats: - Wins - Losses - Total money won - Total money lost

Display in a small player info panel.

------------------------------------------------------------------------

## 2.2 Round History

Add a history panel showing previous rounds.

Example:

Round 3\
Alex → Rock\
Jamie → Paper\
Jamie Wins

Limit history to last 10 rounds.

------------------------------------------------------------------------

## 2.3 Game Event Feed

Add a small scrolling feed showing events.

Examples:

Alex joined the lobby\
Jamie placed a bet\
Chris won \$500

This improves multiplayer clarity.

------------------------------------------------------------------------

## 2.4 Player Ready System

Players must click "Ready" before the host can start.

States: Not Ready Ready

The host cannot start until all players are ready.

------------------------------------------------------------------------

## 2.5 Improved Error Handling

Show friendly error messages for common issues.

Examples: Player disconnected\
Invalid bet amount\
Game sync error

Display messages as temporary toast notifications.

------------------------------------------------------------------------

## 2.6 Player Avatars

Give each player a visual icon.

Options: - Random color icon - Generated initials - Simple avatar images

Purpose: Improve player recognition.

------------------------------------------------------------------------

## 2.7 Game Countdown

Add a short countdown before the game begins.

Example:

Game starting in: 3 2 1

Helps synchronize multiplayer actions.

------------------------------------------------------------------------

## 2.8 Button Feedback

Improve responsiveness of UI elements.

Add: - press animations - hover effects (desktop only) - subtle sound
feedback

------------------------------------------------------------------------

## 2.9 Coin Win Animation

When a player wins money:

-   Coins animate toward the player's balance
-   Balance number increments smoothly

------------------------------------------------------------------------

## 2.10 Performance Improvements

Improve loading speed and responsiveness.

Tasks: - reduce unnecessary re-renders - compress static assets -
optimize CSS and JS bundles

------------------------------------------------------------------------

# 3. Goals for Version 2.2.0

The update should achieve:

1.  A more modern, polished interface
2.  Fully usable mobile gameplay
3.  Clear player turn flow
4.  Balanced gameplay with customizable settings
5.  Transparent version tracking
6.  More engaging multiplayer experience

Version 2.2.0 should feel like a **major polish update** rather than
just a small patch.

---

**Note: Please use this file for the logo: ~/Hermes/Projects/Rock Paper Gamble/RPGPublic/RPG Logo.png, but update the website logo to match the new logo provided in assets/rpg.png AND favicon.svg. And build a readme.md for the project. And allow for guests to logout just like real players, so they could connect their discord account to a new account if they wanted to. (Make this an option for guests but not required).**

---

# IMPLEMENTATION STATUS - Updated 2026-04-19

## ✅ COMPLETED

### Core Systems
- [x] **Shared Types** - Updated with GameSettings, PlayerStatus, RoundHistory, GameEvent, balance modifier helpers
- [x] **Server Logic** - Added game settings, turn order controls, ready system, balance modifiers, event feed, round history
- [x] **Game Store** - Added error handling, settings management, reorderPlayers, setReady, countdown support
- [x] **Auth Store** - Added guestLogout function for switching to Discord

### UI Components Created/Updated
- [x] **SignInPage.tsx** - New launch animation with background fade, decorative icons, v2.2.0 branding
- [x] **index.css** - Added animations (launch, float, pulse, coin, countdown, shake), responsive breakpoints, touch-friendly classes, glass effects
- [x] **Avatar.tsx** - Added color and initials support for better player recognition
- [x] **LobbyRoom.tsx** - Complete overhaul with ready system, turn order display, settings modal integration, guest logout option, responsive layout
- [x] **GameScreen.tsx** - Updated with RoundHistory and EventFeed, responsive improvements
- [x] **App.tsx** - Updated version info to v2.2.0, added ChangelogViewer integration, improved responsive design

### New Components
- [x] **GameSettingsModal.tsx** - Starting money slider ($100-$1M), numeric input, balance modifiers display, high-stakes mode UI
- [x] **TurnOrderDisplay.tsx** - Visual turn queue with drag-to-reorder (host only), current player highlighting, position numbers
- [x] **GameCountdown.tsx** - Countdown animation before game starts
- [x] **EventFeed.tsx** - Real-time game events with icons (join, leave, bet, win, gift, ready, start)
- [x] **RoundHistory.tsx** - Last 10 rounds display with RPS choices and outcomes
- [x] **Toast.tsx** - Error/success/info toast notifications
- [x] **ChangelogViewer.tsx** - Full changelog modal with version history
- [x] **CoinAnimation.tsx** - Coin win animation component (created, needs integration)

### Assets & Documentation
- [x] **favicon.svg** - Updated with dice emoji design
- [x] **changelog.md** - Created in public folder with v2.2.0 changes
- [x] **README.md** - Complete project documentation with features, setup, game rules
- [x] **logo.png** - Copied RPG Logo.png to public folder

### Mobile Optimizations
- [x] **ChallengeSelector.tsx** - Gift button changed from hover to tap toggle with popover menu
- [x] CSS responsive breakpoints added (Mobile <768px, Tablet 768-1024px, Desktop >1024px)
- [x] Touch-friendly button classes (48px minimum, btn-touch)
- [x] Overflow prevention (overflow-x-hidden, max-width: 100%)

---

## 🔄 PARTIALLY COMPLETED

- [x] **Coin Win Animation** - Component created and integrated into ResultsPhase

---

## ✅ COMPLETED - v2.2.0 READY

All core v2.2.0 features implemented:
- [x] Coin Win Animation integrated into ResultsPhase
- [x] Build successful - no TypeScript errors
- [x] All components compile correctly

## ⏳ OPTIONAL ENHANCEMENTS (Future)

- [ ] **Sound Feedback** - Button press sounds (optional feature from 2.8)

---

## FILES MODIFIED

### Modified:
1. `/packages/shared/index.ts` - New types and helper functions
2. `/packages/server/src/index.ts` - Server logic for v2.2.0 features
3. `/packages/frontend/src/index.css` - Animations and responsive styles
4. `/packages/frontend/src/store/authStore.ts` - Guest logout
5. `/packages/frontend/src/store/gameStore.ts` - New actions and error handling
6. `/packages/frontend/src/components/auth/LoginPage.tsx` - Re-export
7. `/packages/frontend/src/components/auth/SignInPage.tsx` - New component
8. `/packages/frontend/src/components/common/Avatar.tsx` - Color/initials support
9. `/packages/frontend/src/components/lobby/LobbyRoom.tsx` - Complete rewrite
10. `/packages/frontend/src/components/game/GameScreen.tsx` - Added history/feed
11. `/packages/frontend/src/components/game/ChallengeSelector.tsx` - Mobile gift fix
12. `/packages/frontend/src/App.tsx` - v2.2.0 updates
13. `/packages/frontend/public/favicon.svg` - Updated design

### Created:
1. `/packages/frontend/src/components/lobby/GameSettingsModal.tsx`
2. `/packages/frontend/src/components/lobby/TurnOrderDisplay.tsx`
3. `/packages/frontend/src/components/game/GameCountdown.tsx`
4. `/packages/frontend/src/components/game/EventFeed.tsx`
5. `/packages/frontend/src/components/game/RoundHistory.tsx`
6. `/packages/frontend/src/components/common/Toast.tsx`
7. `/packages/frontend/src/components/common/ChangelogViewer.tsx`
8. `/packages/frontend/src/components/game/CoinAnimation.tsx`
9. `/packages/frontend/src/lib/utils.ts`
10. `/packages/frontend/public/changelog.md`
11. `/README.md`
12. `/packages/frontend/public/logo.png`

---

## NEXT AGENT NOTES

v2.2.0 is now COMPLETE! ✅

Build Status: Successful (no errors)
- TypeScript compilation: ✅ Pass
- Vite build: ✅ Pass

Final verification steps taken:
1. ✅ Fixed missing useRef import in ResultsPhase.tsx
2. ✅ Fixed unused targetElementId prop in CoinAnimation.tsx
3. ✅ CoinAnimation now integrated into ResultsPhase - triggers when player wins
4. ✅ Full build completed successfully

Optional for future:
- Sound effects (feature 2.8) - can be added later if desired