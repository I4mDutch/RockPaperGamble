# Rock Paper Gamble

[![Version](https://img.shields.io/badge/version-2.2.0--N2FTU7-brand--primary?style=for-the-badge&logo=github)](https://github.com/I4mDutch/RockPaperGamble/blob/main/dev/changelog.md)
[![License](https://img.shields.io/badge/license-RAPIL%20(Custom)-red?style=for-the-badge)](./LICENSE.md)

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PartyKit](https://img.shields.io/badge/PartyKit-FF4D4D?style=for-the-badge&logo=partykit&logoColor=white)](https://www.partykit.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

Welcome to the official frontend for **Rock Paper Gamble**, a high-stakes, multiplayer rock-paper-scissors game built for the modern web. Version **2.2.0** introduces a major focus on polish, mobile responsiveness, and transparent gameplay.

## 🕹️ Game Overview
Players take turns picking opponents and wagering their coins in Best-of-5 series matches. Spectators can join the action by betting on their favorite champions, potentially doubling their money. But beware—if your balance hits $0, you're out of the game!

## ✨ New in Version 2.2.0

### 📱 Modern & Mobile-First UI
- **Complete Visual Overhaul:** Rounded cards, smoother shadows, and a cleaner color palette.
- **Fluid Animations:** New launch sequences, button press feedback, and animated coin wins.
- **Mobile Optimized:** Full safe-area support and touch-friendly targets (48px+) for a seamless mobile experience.

### ⚔️ Enhanced Gameplay
- **Best-of-5 Matches:** Duels now continue until a player reaches 3 wins, adding strategic depth to every encounter.
- **Live Event Feed:** A real-time sidebar logs every challenge, wager, and coin gift as they happen.
- **Dynamic Turn Order:** High-visibility turn queue with active player highlighting and next-up indicators.
- **Round History:** Track the last 10 rounds of action to spot your opponents' patterns.

### ⚙️ Balance & Transparency
- **Custom Game Settings:** Hosts can set starting money from $100 to $1,000,000.
- **Stakes Modifiers:** Adaptive game balance that adjusts win/loss percentages based on the starting economy.
- **Full Changelog:** Accessible directly from the lobby info menu to track every project update.

### 🔐 Account Management
- **Discord Integration:** Sign in with Discord to save your profile and stats.
- **Flexible Guest Sessions:** Start as a guest and easily switch to a Discord account later without losing your place in the lobby.

## 🚀 Technical Stack
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS (Vite plugin)
- **State Management:** Zustand
- **Real-time:** PartySocket (PartyKit)
- **Database/Auth:** Supabase

---
*For the full history of changes, see the [Project Changelog](https://github.com/I4mDutch/RockPaperGamble/blob/main/dev/changelog.md).*
