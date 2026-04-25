import { useState } from 'react'
import { Plus, LogIn, Swords, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

interface LobbyBrowserProps {
  onJoin: (code: string) => void
  isJoining?: boolean
  error?: string | null
  onRetry?: () => void
}

export const LobbyBrowser = ({ onJoin, isJoining = false, error = null, onRetry }: LobbyBrowserProps) => {
  const [joinCode, setJoinCode] = useState('')
  const { createLobby } = useGameStore()

  const handleCreate = () => {
    if (isJoining) return
    const code = createLobby()
    onJoin(code)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length === 6 && !isJoining) {
      onJoin(joinCode.toUpperCase())
    }
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all hover:bg-rose-500/30"
          >
            <RefreshCcw size={14} />
            Retry
          </button>
        </div>
      )}

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Section */}
        <div className="group relative bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 hover:border-brand-primary/50 transition-all duration-300">
          <div className="absolute inset-0 bg-brand-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
              <Plus className="text-brand-primary" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Start New Game</h3>
              <p className="text-slate-400 mt-1">Host a private lobby and invite your friends to gamble.</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={isJoining}
              className="w-full py-4 bg-brand-primary hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 group-active:scale-95"
            >
              {isJoining ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Swords size={20} />
              )}
              {isJoining ? 'Creating...' : 'Create Lobby'}
            </button>
          </div>
        </div>

        {/* Join Section */}
        <div className="group relative bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 hover:border-brand-secondary/50 transition-all duration-300">
          <div className="absolute inset-0 bg-brand-secondary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-secondary/20 flex items-center justify-center">
              <LogIn className="text-brand-secondary" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Join with Code</h3>
              <p className="text-slate-400 mt-1">Enter a 6-digit alphanumeric code to join an existing game.</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="ENTER CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isJoining}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-brand-secondary transition-colors placeholder:text-slate-700 placeholder:tracking-normal disabled:opacity-50"
              />
              <button
                disabled={joinCode.length !== 6 || isJoining}
                className="w-full py-4 bg-brand-secondary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-secondary/20 flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <LogIn size={20} />
                )}
                {isJoining ? 'Joining...' : 'Join Lobby'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
