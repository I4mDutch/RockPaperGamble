import { useState } from 'react'
import { Plus, LogIn, Swords, Loader2, RefreshCcw, AlertTriangle, Zap } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

interface LobbyBrowserProps {
  onJoin: (code: string) => void
  isJoining?: boolean
  error?: string | null
  onRetry?: () => void
}

export const LobbyBrowser = ({ onJoin, isJoining = false, error = null, onRetry }: LobbyBrowserProps) => {
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [isShaking, setIsShaking] = useState(false)
  const { createLobby } = useGameStore()

  const handleCreate = () => {
    if (isJoining) return
    const code = createLobby()
    onJoin(code)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length !== 6) {
      triggerShake()
      return
    }
    if (!isJoining) onJoin(joinCode.toUpperCase())
  }

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  return (
    <div className="w-full flex justify-center">
      {/* Centered Interaction Panel */}
      <div className="w-full max-w-sm space-y-4">
        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl p-3 animate-in fade-in zoom-in-95 duration-300 bg-red-50 border border-red-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button onClick={onRetry} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
              Retry
            </button>
          </div>
        )}

        {/* Tab Switcher — SLIDING TOGGLE */}
        <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-2xl p-1.5 relative overflow-hidden">
          <div className="relative flex p-1 rounded-xl bg-slate-100/50">
            {/* Sliding Indicator */}
            <div 
              className="absolute top-1 bottom-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) rounded-lg shadow-sm"
              style={{
                left: mode === 'create' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
                background: mode === 'create' ? 'linear-gradient(to right, #F59E0B, #D97706)' : 'linear-gradient(to right, #0891B2, #0284C7)'
              }}
            />
            
            <button
              onClick={() => setMode('create')}
              className="relative z-10 flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300"
              style={{ color: mode === 'create' ? 'white' : '#64748b' }}
            >
              <Plus size={14} /> Create
            </button>
            <button
              onClick={() => setMode('join')}
              className="relative z-10 flex-1 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300"
              style={{ color: mode === 'join' ? 'white' : '#64748b' }}
            >
              <LogIn size={14} /> Join
            </button>
          </div>
        </div>

        {/* Interaction Panel */}
        <div className="relative min-h-[220px]">
          {mode === 'create' ? (
            <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-3xl p-6 transition-all duration-500 space-y-5 animate-in fade-in slide-in-from-left-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-amber-50 text-amber-500 border border-amber-100">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="heading-display text-lg leading-none text-slate-800">Start a New Game</h3>
                  <p className="text-[9px] uppercase font-bold tracking-widest mt-1 text-slate-400">Host a private session</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Generate a unique lobby code and invite your friends to bet their coins in the ultimate RPS duel.
              </p>
              <button onClick={handleCreate} disabled={isJoining} className="w-full py-3.5 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2">
                {isJoining ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {isJoining ? 'Creating...' : 'Create Lobby Now'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-3xl p-6 transition-all duration-500 space-y-5 animate-in fade-in slide-in-from-right-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <LogIn size={20} />
                </div>
                <div>
                  <h3 className="heading-display text-lg leading-none text-slate-800">Enter Lobby Code</h3>
                  <p className="text-[9px] uppercase font-bold tracking-widest mt-1 text-slate-400">Join your friends</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className={`transition-transform \${isShaking ? 'animate-rumble' : ''}`}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={isJoining}
                    className="w-full rounded-xl px-4 py-4 text-center text-3xl tracking-[0.4em] font-black transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-300 shadow-inner"
                  />
                </div>
                <button type="submit" disabled={isJoining || joinCode.length !== 6} className="w-full py-3.5 text-sm bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                  {isJoining ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isJoining ? 'Connecting...' : 'Join Game Session'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
