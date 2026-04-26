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
import { WaveBackground } from './components/ui/WaveBackground'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 overflow-x-hidden relative">
      <WaveBackground />
      
      {/* Fixed Logo — Top Left */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-white/5 backdrop-blur-md px-2 py-2 pr-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400/30 cursor-pointer group hover:scale-105 transition-all duration-500">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
          <span className="text-xl group-hover:rotate-12 transition-transform drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">🎲</span>
        </div>
        <div className="hidden sm:block">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 leading-tight">Rock Paper</h2>
          <h1 className="text-xl font-black uppercase tracking-tighter text-white drop-shadow-sm leading-none">Gamble</h1>
        </div>
      </div>
      
      {showLobbyBrowser ? (
        <div className="relative z-10 space-y-8 sm:space-y-10 lg:space-y-12 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 pt-16 flex flex-col items-center">
          <div className="text-center space-y-6 flex flex-col items-center">
            <h2 className="heading-display text-responsive-5xl text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex justify-center gap-3">
              <div className="flex gap-1">
                {['R','O','C','K'].map((letter, i) => (
                  <span key={i} className="inline-block animate-slot-roll" style={{ animationDelay: `${i * 100}ms` }}>{letter}</span>
                ))}
              </div>
              <div className="flex gap-1">
                {['P','A','P','E','R'].map((letter, i) => (
                  <span key={i + 4} className="inline-block animate-slot-roll" style={{ animationDelay: `${(i + 4) * 100}ms` }}>{letter}</span>
                ))}
              </div>
              <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#BAE6FD,#0891B2,#3B82F6,#BAE6FD)] bg-[length:200%_100%] animate-liquid-blue drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] ml-2 inline-block animate-slot-roll" style={{ animationDelay: '900ms' }}>
                GAMBLE
              </span>
            </h2>
            <div className="inline-block bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:border-amber-400/30 transition-all duration-500">
              <p className="font-bold text-responsive-base tracking-wide text-cyan-100">
                Create a lobby or enter a code to jump in.
              </p>
            </div>
          </div>
          <LobbyBrowser onJoin={handleJoin} isJoining={isConnecting} error={error} onRetry={handleRetry} />
        </div>
      ) : (
        <div className="relative z-10 w-full flex justify-center">
          <LobbyRoom onLeave={handleLeave} />
        </div>
      )}

      {/* Profile Button */}
      {showLobbyBrowser && (
        <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 sm:gap-3 p-2 pr-3 sm:pr-5 rounded-2xl transition-all group"
            style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
            aria-label="Open profile"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              {(() => {
                const avatar = user?.user_metadata.avatar_url || (guestUser as any)?.avatarUrl;
                if (!avatar) return <span>🎲</span>;
                if (!avatar.startsWith('http')) return <span>{avatar}</span>;
                return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
              })()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] font-semibold uppercase tracking-widest leading-none" style={{ color: 'var(--color-text-muted)' }}>Profile</div>
              <div className="font-bold leading-none mt-1 text-responsive-sm truncate max-w-[120px]" style={{ color: 'var(--color-text-primary)' }}>
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

      {/* Version Info */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        {showInfo && (
          <div className="absolute bottom-full right-0 mb-4 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
            <div className="p-5 rounded-2xl w-64 sm:w-72 relative" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card-hover)' }}>
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Close version info"
              >✕</button>
              <h4 className="heading-display text-sm mb-3" style={{ color: 'var(--color-accent-primary)' }}>RPG v3.0.0</h4>
              <ul className="text-xs leading-relaxed space-y-1.5 list-disc list-inside" style={{ color: 'var(--color-text-muted)' }}>
                <li>Neon Vegas Aesthetic</li>
                <li>Parallax SVG Background</li>
                <li>Glassmorphism UI elements</li>
                <li>Jackpot Typography</li>
                <li>Micro-interactions added</li>
              </ul>
              <button 
                className="w-full mt-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--color-accent-primary)', border: '1px solid rgba(124,58,237,0.15)' }}
                onClick={() => window.open("https://github.com/I4mDutch/RockPaperGamble/blob/main/dev/changelog.md", "_blank")}
              >View Full Changelog</button>
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
          style={{ 
            background: showInfo ? 'var(--color-accent-primary)' : 'var(--color-bg-page)', 
            border: `1px solid ${showInfo ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
            color: showInfo ? 'white' : 'var(--color-text-muted)',
            boxShadow: 'var(--shadow-card)'
          }}
          aria-expanded={showInfo}
          aria-label={showInfo ? 'Close version info' : 'Open version info'}
        >
          <span className="font-bold text-sm">{showInfo ? '✕' : 'ⓘ'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slot-roll {
          0% { transform: translateY(-50px) rotateX(-90deg); opacity: 0; filter: blur(5px); }
          50% { transform: translateY(10px) rotateX(10deg); opacity: 1; filter: blur(0); }
          75% { transform: translateY(-5px) rotateX(-5deg); }
          100% { transform: translateY(0) rotateX(0deg); opacity: 1; }
        }
        .animate-slot-roll {
          animation: slot-roll 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes liquid-blue {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-liquid-blue {
          animation: liquid-blue 3s linear infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }

        @keyframes rumble {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(1deg); }
        }
        .animate-rumble {
          animation: rumble 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}} />
    </div>
  )
}

function App() {
  const { setGuestUser } = useAuthStore()

  const handleGuestLogin = (name: string) => {
    setGuestUser(name)
  }

  const handleDiscordLogin = async () => {
    const { supabase } = await import('./lib/supabase')
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
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
