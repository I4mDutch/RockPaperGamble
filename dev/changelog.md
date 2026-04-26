# Changelog

## [2.2.0.10(c) (N2FTU7)] - 2026-04-26
*The "Testing & Polish" Update*

Version 2.2.0.10(c) (N2FTU7) focuses on improving mobile accessibility, and ensuring a balanced, transparent gameplay experience for all players.

### 🌟 New Features

#### UI & Visual Modernization
- **Modern UI Refresh:** A complete visual overhaul featuring improved spacing, rounded cards, softer shadows, and a cleaner color palette.
- **Fluid Animations:** Added a new lightweight launch sequence with background fades and logo scaling, along with button press and hover animations.
- **Mobile-First Design:** Full safe-area support for modern mobile devices and touch-friendly buttons with a minimum 48px tap height.
- **Animated Wins:** Added a coin win animation that visually updates player balances when they take home the prize pool.

#### Enhanced Gameplay
- **Best-of-5 Series:** Matches now follow a strategic series format—the first player to reach 3 wins takes the match.
- **Live Event Feed:** A real-time scrolling feed that logs every match event (joins, challenges, wagers, spectator bets, and gifts) as they happen.
- **Improved Ready System:** A new lobby flow where all players must "Ready Up" by clicking their player card before a match can begin.
- **Dynamic Turn Order:** High-visibility turn queue display with active player highlighting and "Next Up" indicators for better match clarity.

#### Custom Lobby Settings
- **Starting Money Control:** Hosts can now configure starting balances from $100 all the way to $1,000,000.
- **Adaptive Balance Modifiers:** Automatic game balance logic that adjusts win/loss percentages based on the economy to keep matches fair.
- **Mobile Gift Menu:** Converted the gifting interaction from a hover state to a tap-toggle for easier use on phones.

### 🛠️ Bug Fixes & Stability
- **WebSocket Handshake:** Implemented an "Immediate Handshake" on the server to stop WebSocket connections from closing before they were established.
- **Handshake Resilience:** Made the display name and initials logic bulletproof, allowing for emojis (like 🥷) and special characters without crashing the server.
- **Timer & Sync Fixes:** Resolved an issue where the betting timer would stall and fixed the "weapons desync" that was causing frequent forced ties.
- **Settings Sync:** Added an editing lock to the settings modal to prevent server updates from overwriting your typing.
- **Turn Order Validation:** Fixed a server-side bug that prevented hosts from correctly reordering players in the lobby.
- **Account Switching:** Guest users can now seamlessly logout and switch to a Discord account directly from the lobby or profile menu.
