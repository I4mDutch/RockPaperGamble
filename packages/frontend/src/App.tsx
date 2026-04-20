import { useState } from 'react'
import { AuthGuard } from './components/auth/AuthGuard'
import { LobbyBrowser } from './components/lobby/LobbyBrowser'
import { LobbyRoom } from './components/lobby/LobbyRoom'
import { GameScreen } from './components/game/GameScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { EditProfileModal } from './components/profile/EditProfileModal'
import { ChangelogViewer } from './components/common/ChangelogViewer'
import { Toast } from './components/common/Toast'
import { Sparkles, FileText } from 'lucide-react'

function GameContent() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const { connect, disconnect, session, error, setError } = useGameStore()
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
      avatarUrl: guestUser.avatarUrl,
      avatarColor: guestUser.avatarColor,
      initials: guestUser.initials
    } : null

    if (activeUser) {
      connect(code, activeUser.id, activeUser.name, activeUser.avatarUrl, activeUser.avatarColor, activeUser.initials)
    }
  }

  const handleLeave = () => {
    disconnect()
    setLobbyCode(null)
  }

  // Handle error toast
  if (error) {
    return (
      <Toast 
        message={error} 
        type="error" 
        onClose={() => setError(null)} 
      />
    )
  }

  if (session?.status === 'in_progress') {
    return <GameScreen />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden">
      {!lobbyCode ? (
        <div className="space-y-8 sm:space-y-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white italic">
              SELECT YOUR <span className="text-brand-primary">LOBBY</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base">
              Create a private game or join your friends.
            </p>
          </div>
          <LobbyBrowser onJoin={handleJoin} />
        </div>
      ) : (
        <LobbyRoom onLeave={handleLeave} />
      )}

      {/* Profile Button */}
      {!lobbyCode && (
        <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 sm:gap-3 bg-slate-800/40 backdrop-blur-xl border border-white/10 p-2 pr-4 sm:pr-5 rounded-full hover:bg-slate-700/50 transition-all group btn-touch"
          >
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 overflow-hidden flex items-center justify-center text-sm sm:text-xl shadow-inner"
              style={{ 
                backgroundColor: user?.user_metadata?.avatar_color || guestUser?.avatarColor || '#334155' 
              }}
            >
              {(() => {
                const avatar = user?.user_metadata.avatar_url || guestUser?.avatarUrl
                const initials = user?.user_metadata.full_name?.slice(0, 2).toUpperCase() || guestUser?.initials
                if (!avatar) return <span className="text-white font-bold text-xs sm:text-sm">{initials || '??'}</span>
                if (!avatar.startsWith('http')) return <span>{avatar}</span>
                return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              })()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                Profile
              </div>
              <div className="text-white font-bold leading-none mt-1 group-hover:text-brand-primary transition-colors text-sm">
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
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
            <div className="bg-slate-800 text-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/10 w-72 sm:w-80 backdrop-blur-xl relative">
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white btn-touch"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-brand-accent" size={16} />
                <h4 className="font-black italic text-brand-primary">ROCK PAPER GAMBLE V2.2.0</h4>
              </div>
              
              <ul className="text-xs text-slate-400 leading-relaxed space-y-1.5 list-disc list-inside">
                <li>New launch animations</li>
                <li>Modern lobby UI with ready system</li>
                <li>Game settings with balance modifiers</li>
                <li>Mobile optimizations</li>
                <li>Player order controls</li>
                <li>Round history & event feed</li>
              </ul>
              
              <button
                onClick={() => {
                  setShowInfo(false)
                  setShowChangelog(true)
                }}
                className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-primary hover:text-white transition-colors"
              >
                <FileText size={14} />
                View Full Changelog
              </button>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center text-white transition-all shadow-xl btn-touch
            ${showInfo ? 'bg-brand-primary' : 'bg-slate-800 hover:bg-brand-primary'}
          `}
        >
          <span className="font-black italic text-base sm:text-lg">{showInfo ? '✕' : 'ⓘ'}</span>
        </button>
      </div>

      {/* Changelog Modal */}
      <ChangelogViewer 
        isOpen={showChangelog} 
        onClose={() => setShowChangelog(false)} 
      />
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
