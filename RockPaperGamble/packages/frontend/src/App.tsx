import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { SignInPage } from './components/auth/SignInPage'
import { LobbyBrowser } from './components/lobby/LobbyBrowser'
import { LobbyRoom } from './components/lobby/LobbyRoom'
import { GameScreen } from './components/game/GameScreen'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { EditProfileModal } from './components/profile/EditProfileModal'
import { supabase } from './lib/supabase'

function GameContent() {
  const [lobbyCode, setLobbyCode] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { connect, disconnect, session, isConnected, isConnecting, error, setError } = useGameStore()
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


  const handleRetry = () => {
    setError(null)
    setLobbyCode(null)
  }

  const showLobbyBrowser = !lobbyCode || (!!error && !isConnecting && !isConnected)

  if (session?.status === 'in_progress') {
    return <GameScreen />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-x-hidden safe-area-top safe-area-bottom safe-area-left safe-area-right">
      {showLobbyBrowser ? (
        <div className="space-y-6 sm:space-y-8 lg:space-y-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-safe">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="text-responsive-4xl font-black tracking-tighter text-white italic">
              SELECT YOUR <span className="text-brand-primary">LOBBY</span>
            </h2>
            <p className="text-slate-400 font-medium text-responsive-base">Create a private game or join your friends.</p>
          </div>
          <LobbyBrowser onJoin={handleJoin} isJoining={isConnecting} error={error} onRetry={handleRetry} />
        </div>
      ) : (
        <LobbyRoom onLeave={handleLeave} />
      )}

      {/* Profile Button */}
      {showLobbyBrowser && (
        <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50 safe-area-top safe-area-right">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 sm:gap-3 bg-slate-800/40 backdrop-blur-xl border border-white/10 p-2 pr-3 sm:pr-5 rounded-full hover:bg-slate-700/50 transition-all group touch-target"
            aria-label="Open profile"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center text-xl shadow-inner flex-shrink-0">
              {(() => {
                const avatar = user?.user_metadata.avatar_url || (guestUser as any)?.avatarUrl;
                if (!avatar) return <span>🎲</span>;
                if (!avatar.startsWith('http')) return <span>{avatar}</span>;
                return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
              })()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Profile</div>
              <div className="text-white font-bold leading-none mt-1 group-hover:text-brand-primary transition-colors text-responsive-sm truncate max-w-[120px]">
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
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 safe-area-bottom safe-area-right">
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-white/10 w-56 sm:w-64 backdrop-blur-xl relative safe-area-right">
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white touch-target"
                aria-label="Close version info"
              >
                ✕
              </button>
              <h4 className="font-black italic text-brand-primary mb-2 text-responsive-sm">ROCK PAPER GAMBLE V2.2.0</h4>
              <ul className="text-xs text-slate-400 leading-relaxed space-y-1 list-disc list-inside">
                <li>Changed "BET ON MYSELF" to "WAGER"</li>
                <li>Best-of-5 series matches</li>
                <li>Prize pool betting for all players</li>
                <li>Gift coins to other players</li>
                <li>$0 players are eliminated</li>
                <li>Discord sign-in & profile menu account switching</li>
                <li>Mobile-responsive design</li>
              </ul>
              
              <button 
                className="w-full mt-4 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-brand-primary/20 transition-all transition-colors"
                onClick={() => {
                  // Link will be added later
                  console.log("View Changelog clicked");
                }}
              >
                View Changelog
              </button>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white transition-all shadow-xl touch-target ${showInfo ? 'bg-brand-primary' : 'bg-slate-800 hover:bg-brand-primary'}`}
          aria-expanded={showInfo}
          aria-label={showInfo ? 'Close version info' : 'Open version info'}
        >
          <span className="font-black italic text-lg">{showInfo ? '✕' : 'ⓘ'}</span>
        </button>
      </div>
    </div>
  )
}

function App() {
  const { setGuestUser } = useAuthStore()

  const handleGuestLogin = (name: string) => {
    setGuestUser(name)
  }

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/signin" 
          element={
            <SignInPage 
              onGuestLogin={handleGuestLogin}
              onDiscordLogin={handleDiscordLogin}
            />
          } 
        />
        <Route 
          path="/*" 
          element={
            <AuthGuard>
              <GameContent />
            </AuthGuard>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
