# RockPaperGamble — Version 2.2.0

## Overview
Version **2.2.0** focuses on polish, usability, and gameplay balance. The goal is to make the game feel more modern, accessible on mobile devices, and clearer for players during matches.

Key themes:

- UI modernization
- Mobile usability
- Turn clarity
- Game balance systems
- Transparency through changelogs
- Improved player interaction

---

# Features & Improvements

## UI & Visual Updates
- New launch animation with background fade and logo scaling
- Modern UI refresh with improved spacing and rounded cards
- Softer shadows and cleaner color palette
- Button press animations and hover effects
- Coin win animation when players win
- High-stakes mode visual indicators
- Fixed UI overflow issues
- Touch-friendly buttons (48px minimum tap height)
- Safe area support for mobile devices

### Launch Animation
Lightweight startup animation to improve the first impression when the site loads.

Behavior:
- Background fades in
- Logo scales slightly into place
- Lobby UI elements appear sequentially

Guidelines:
- Animation duration under **800ms**
- Uses CSS transforms and opacity only
- Respects reduced-motion accessibility preferences

---

## Navigation & Pages
- Separate **Sign-In** and **Lobby** pages
- Guest users can logout to connect a Discord account
- Improved connection error handling

Routes:

/signin  
/lobby

Signin Page Layout:
- Centered card layout
- Username input
- Join button
- Background gradient
- Decorative rock/paper/scissors icons

---

## Lobby Improvements
- Enhanced lobby with player avatars and ready indicators
- Player money display
- Host badge indicator
- Join/leave animations
- Player ready system (all players must be ready before the game starts)

Lobby layout:

Header  
Player List  
Game Settings Summary  
Start Game Button

---

## Game Settings System

Accessible through:

⚙ Game Settings

### Starting Money
Hosts can configure starting money.

Range:

$100 → $1,000,000

Default:

$10,000

Input types:
- Slider
- Numeric input

---

### Balance Modifiers

To prevent gameplay from breaking at extreme money values, modifiers are applied.

| Starting Money | Loss Modifier | Win Modifier |
|----------------|---------------|--------------|
| $100–$999 | Lose −50% | Win +35% |
| $1k–$10k | Normal | Normal |
| $10k–$100k | Normal | Normal |
| $100k–$499k | Lose +25% | Win −15% |
| $500k–$1M | Lose +50% | Win −35% |

UI clearly shows when modifiers are active.

Example:

Starting Money: $500,000  
High-Stakes Mode Enabled  
Losses +50%  
Wins −35%

---

# Gameplay Improvements

## Turn Order System
Improves clarity during gameplay.

### Turn Queue Display

Shows player order visually.

Example:

Turn Order  
1. Alex  
2. Jamie  
3. Chris  
4. You  

The active player is highlighted.

---

### Next Player Indicator

Displays who will play next after the current turn.

Example:

Next Player: Jamie

---

### Host First-Player Selection

Due to bugs encountered when implementing full drag-to-reorder functionality, the host can now **select which player goes first** rather than reordering the entire list.

Behavior:
- Host chooses a player to start the match
- That player becomes **Player 1**
- Remaining players follow in their current lobby order

Example:

Starting Player: Alex  

Turn Order:  
1. Alex  
2. Jamie  
3. Chris  
4. You  

---

### Turn Logic

Turn order is stored as an array.

playerTurnOrder: [id1, id2, id3]

The game cycles through this array during gameplay.

---

## Game Countdown
A short countdown appears before the match begins.

Example:

Game starting in:  
3  
2  
1  

This helps synchronize multiplayer gameplay.

---

## Player Statistics

Tracks player performance during matches.

Stats include:
- Wins
- Losses
- Total money won
- Total money lost

Displayed in a small player info panel.

---

## Round History

Displays the last **10 rounds** played.

Example:

Round 3  
Alex → Rock  
Jamie → Paper  
Jamie Wins

---

## Game Event Feed

A scrolling feed that shows multiplayer events in real time.

Examples:

Alex joined the lobby  
Jamie placed a bet  
Chris won $500  

This helps players understand what is happening during the match.

---

## Button Feedback

Improves UI responsiveness.

Includes:
- Button press animations
- Hover effects (desktop only)
- Optional sound feedback (future enhancement)

---

# Mobile Optimization

## Responsive Breakpoints

Mobile:  <768px  
Tablet:  768–1024px  
Desktop: >1024px  

---

## Mobile Improvements
- Responsive layout across devices
- Overflow prevention (`max-width:100%`, `overflow-x:hidden`)
- Flex wrapping for flexible layouts
- Touch-friendly buttons
- Gift button interaction converted from hover to tap toggle
- Safe area support for mobile devices

Gift button behavior:

Tap → open gift menu  
Tap again → close menu  

---

# Error Handling & Stability

Improved error handling with toast notifications.

Examples:

Player disconnected  
Invalid bet amount  
Game sync error  

Additional improvements:
- Better connection failure handling
- Reduced unnecessary re-renders
- More stable multiplayer synchronization

---

# Changelog System

## Quick Changelog

Shown in the info menu.

Example:

Version 2.2.0

• New animations  
• Modern lobby UI  
• Game settings system  
• Mobile fixes  
• Turn order improvements  
• Full changelog viewer  

---

## Full Changelog Viewer

Button:

View Full Changelog

Loads data from:

~/Hermes/Projects/Rock Paper Gamble/RPGPublic/changelog.md

The markdown is rendered inside a scrollable modal.

Recommended libraries:
- marked.js
- markdown-it

---

# Additional Gameplay Features

- Player avatars using colors or initials
- Countdown animation before games start
- Coin win animation with animated balance updates
- Round history panel
- Multiplayer event feed
- Ready system for starting matches
- Guest logout option to connect Discord

---

# Performance Improvements

Performance optimizations include:

- Reduced unnecessary React re-renders
- Optimized CSS and JS bundles
- Compressed static assets
- Faster loading times
- Improved UI responsiveness

---

# Version 2.2.0 Goals

This update aims to deliver:

1. A more modern, polished interface
2. Fully usable mobile gameplay
3. Clear player turn flow
4. Balanced gameplay with customizable settings
5. Transparent version tracking
6. A more engaging multiplayer experience

Version **2.2.0** should feel like a **major polish update** rather than a small patch.

---

# Assets & Notes

Use the following logo file:

~/Hermes/Projects/Rock Paper Gamble/RPGPublic/RPG Logo.png

Website assets should use, **BUT NEVER CHANGE/EDIT**:

assets/logo.png  
favicon.svg  

Additional implementation notes:

- Build a complete `README.md` for the project
- Allow guest users to logout and connect a Discord account
- Guest logout should be optional but available