# 🎲 Rock Paper Gamble

A multiplayer Rock-Paper-Scissors betting game built with React, TypeScript, and PartyKit.

![Version](https://img.shields.io/badge/version-2.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Features

### Core Gameplay
- **Rock-Paper-Scissors Duels**: Classic RPS with a betting twist
- **Best-of-5 Series**: First to 3 wins takes the pot
- **Prize Pool Betting**: Bet on match winners as a spectator
- **Gift System**: Share coins with other players

### v2.2.0 Updates
- ✨ **Launch Animations**: Beautiful startup animations
- 🎨 **Modern UI**: Refined design with better spacing and rounded cards
- 📱 **Mobile Optimized**: Fully responsive with touch-friendly controls
- ⚙️ **Game Settings**: Configurable starting money ($100 - $1,000,000)
- 💰 **Balance Modifiers**: High-stakes mode with win/loss modifiers
- ✅ **Ready System**: Players must ready up before game starts
- 🔄 **Turn Order**: Visual queue with drag-to-reorder (host only)
- 📜 **Changelog System**: In-game version history
- 📊 **Round History**: Last 10 rounds displayed
- 📢 **Event Feed**: Real-time game events
- 🔔 **Toast Notifications**: Better error handling
- 👤 **Guest Logout**: Switch from guest to Discord account

### Authentication
- Discord OAuth integration
- Guest play support
- Persistent profiles with avatar customization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/I4mDutch/RockPaperGamble.git
cd RockPaperGamble
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_PARTYKIT_HOST` - Your PartyKit host (default: localhost:1999)

4. Start the development server:
```bash
# Start the frontend
npm run dev

# In another terminal, start the PartyKit server
npm run party
```

5. Open http://localhost:5173 in your browser

## 🏗️ Project Structure

```
RockPaperGamble/
├── packages/
│   ├── frontend/          # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── store/        # Zustand state management
│   │   │   ├── lib/          # Utility functions
│   │   │   └── ...
│   │   └── public/           # Static assets
│   ├── server/            # PartyKit game server
│   │   └── src/
│   │       ├── index.ts      # Main server logic
│   │       └── db.ts         # Database helpers
│   └── shared/            # Shared types
│       └── index.ts
├── RPGPublic/            # Public assets
└── dev/                  # Development files
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **State Management**: Zustand
- **Real-time**: PartyKit (WebSockets)
- **Auth**: Supabase Auth (Discord OAuth)
- **Database**: Supabase PostgreSQL
- **Build**: npm workspaces

## 📝 Game Rules

1. **Lobby**: Players join a lobby with a 6-character code
2. **Ready Up**: All players must mark ready before the host can start
3. **Challenger Selection**: Active player chooses an opponent and wager
4. **Betting Phase**: Spectators bet on who they think will win
5. **RPS Duel**: Challenger and challengee play best-of-5
6. **Payout**: Winner takes the pot plus any spectator winnings

### Balance Modifiers

When playing with extreme starting amounts:

| Starting Money | Loss Modifier | Win Modifier |
|---------------|---------------|--------------|
| $100 - $999   | -50%          | +35%         |
| $1k - $99k    | Normal        | Normal       |
| $100k - $499k | +25%          | -15%         |
| $500k - $1M   | +50%          | -35%         |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [PartyKit](https://partykit.io) for real-time multiplayer
- Authentication powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)

---

Made with ❤️ by the Rock Paper Gamble team

**[Play Now](https://your-game-url.com)** • **[Report Bug](https://github.com/I4mDutch/RockPaperGamble/issues)** • **[Request Feature](https://github.com/I4mDutch/RockPaperGamble/issues)**