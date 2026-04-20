# Rock Paper Gamble Changelog

## 2.2.0 - April 2026

### Animations & UX
- New launch animation with background fade and logo scaling
- Modern UI refresh with improved spacing and rounded cards
- Softer shadows and cleaner color palette
- Separate sign-in and lobby pages
- Enhanced lobby with player avatars and ready indicators
- Game countdown animation before matches start
- Button press animations and hover effects
- Coin win animation when players win

### Game Settings System
- Configurable starting money ($100 - $1,000,000)
- Balance modifiers for extreme values:
  - $100-$999: Lose -50%, Win +35%
  - $100k-$499k: Lose +25%, Win -15%
  - $500k-$1M: Lose +50%, Win -35%
- High-stakes mode visual indicators

### Mobile Optimization
- Responsive breakpoints for all devices (Mobile <768px, Tablet 768-1024px, Desktop >1024px)
- Fixed UI overflow issues
- Touch-friendly buttons (48px minimum tap height)
- Gift button tap toggle (replaces hover interaction)
- Safe area support for mobile devices

### Player Order System
- Visual turn queue display showing current player order
- Next player indicator during gameplay
- Host drag-to-reorder controls in lobby

### Changelog System
- Quick changelog in info menu
- Full changelog viewer modal with version history

### Additional Features
- Player statistics tracking (wins, losses, total won/lost)
- Round history panel showing last 10 rounds
- Game event feed for multiplayer clarity
- Player ready system - all players must be ready before game starts
- Improved error handling with toast notifications
- Performance improvements with reduced re-renders

### Bug Fixes
- Guest users can now logout to connect Discord account
- Fixed avatar display issues
- Improved connection error handling

## 2.1.1 - April 2026

- Changed "BET ON MYSELF" to "WAGER"
- Best-of-5 series matches
- Prize pool betting for all players
- Gift coins to other players
- $0 players are eliminated
- Discord sign-in & profile customization

## 2.1.0 - April 2026

- Initial release with basic RPS gameplay
- Lobby system with host controls
- Discord authentication
- Guest play support