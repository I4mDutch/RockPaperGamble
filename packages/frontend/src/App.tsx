import { useState } from 'react'
import { AuthGuard } from './components/auth/AuthGuard'
import { LobbyBrowser } from './components/lobby/LobbyBrowser'
import { LobbyRoom } from './components/lobby/LobbyRoom'
import { GameScreen } from './components/game/GameScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'

function GameContent() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null)
  const { connect, disconnect, session } = useGameStore()
  const { user, guestUser } = useAuthStore()

  const handleJoin = (code: string) => {
    setLobbyCode(code)
    const activeUser = user ? { 
      id: user.id, 
      name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Player' 
    } : guestUser ? {
      id: guestUser.id,
      name: guestUser.displayName
    } : null

    if (activeUser) {
      connect(code, activeUser.id, activeUser.name)
    }
  }

  const handleLeave = () => {
    disconnect()
    setLobbyCode(null)
  }

  if (session?.status === 'in_progress') {
    return <GameScreen />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 sm:p-12 overflow-x-hidden">
      {!lobbyCode ? (
        <div className="space-y-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black tracking-tighter text-white italic">
              SELECT YOUR <span className="text-brand-primary">LOBBY</span>
            </h2>
            <p className="text-slate-400 font-medium">Create a private game or join your friends.</p>
          </div>
          <LobbyBrowser onJoin={handleJoin} />
        </div>
      ) : (
        <LobbyRoom onLeave={handleLeave} />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthGuard>
      <GameContent />
    </AuthGuard>
  )
}

export default App
