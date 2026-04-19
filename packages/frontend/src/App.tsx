import { useState } from 'react'
import { AuthGuard } from './components/auth/AuthGuard'
import { LobbyBrowser } from './components/lobby/LobbyBrowser'
import { LobbyRoom } from './components/lobby/LobbyRoom'
import { GameScreen } from './components/game/GameScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { EditProfileModal } from './components/profile/EditProfileModal'

function GameContent() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { connect, disconnect, session } = useGameStore()
  const { user, guestUser } = useAuthStore()

  const handleJoin = (code: string) => {
    setLobbyCode(code)
    const activeUser = user ? { 
      id: user.id, 
      name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Player',
      avatarUrl: user.user_metadata.avatar_url
    } : guestUser ? {
      id: guestUser.id,
      name: guestUser.displayName,
      avatarUrl: (guestUser as any).avatarUrl
    } : null

    if (activeUser) {
      connect(code, activeUser.id, activeUser.name, activeUser.avatarUrl)
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

      {/* Profile Button */}
      {!lobbyCode && (
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-xl border border-white/10 p-2 pr-5 rounded-full hover:bg-slate-700/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center text-xl shadow-inner">
              {(() => {
                const avatar = user?.user_metadata.avatar_url || (guestUser as any)?.avatarUrl;
                if (!avatar) return <span>🎲</span>;
                if (!avatar.startsWith('http')) return <span>{avatar}</span>;
                return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
              })()}
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Profile</div>
              <div className="text-white font-bold leading-none mt-1 group-hover:text-brand-primary transition-colors">
                {user?.user_metadata.full_name || guestUser?.displayName || 'Set Name'}
              </div>
            </div>
          </button>
        </div>
      )}

      <EditProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

      {/* Version Info Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-white/10 w-64 backdrop-blur-xl relative">
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <h4 className="font-black italic text-brand-primary mb-2">ROCK PAPER GAMBLE V2.1.1</h4>
              <ul className="text-xs text-slate-400 leading-relaxed space-y-1 list-disc list-inside">
                <li>Changed "BET ON MYSELF" to "WAGER"</li>
                <li>Best-of-5 series matches</li>
                <li>Prize pool betting for all players</li>
                <li>Gift coins to other players</li>
                <li>$0 players are eliminated</li>
                <li>Discord sign-in & profile customization</li>
              </ul>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white transition-all shadow-xl ${showInfo ? 'bg-brand-primary' : 'bg-slate-800 hover:bg-brand-primary'}`}
        >
          <span className="font-black italic text-lg">{showInfo ? '✕' : 'ⓘ'}</span>
        </button>
      </div>
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
