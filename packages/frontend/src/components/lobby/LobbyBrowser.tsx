import { useState } from 'react'
import { Plus, LogIn, Swords } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'


interface LobbyBrowserProps {
  onJoin: (code: string) => void
}

export const LobbyBrowser = ({ onJoin }: LobbyBrowserProps) => {
  const [joinCode, setJoinCode] = useState('')
  const { createLobby } = useGameStore()

  const handleCreate = () => {
    const code = createLobby()
    onJoin(code)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length === 6) {
      onJoin(joinCode.toUpperCase())
    }
  }

  return (
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
            className="w-full py-4 bg-brand-primary hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 group-active:scale-95"
          >
            <Swords size={20} />
            Create Lobby
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
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-brand-secondary transition-colors placeholder:text-slate-700 placeholder:tracking-normal"
            />
            <button
              disabled={joinCode.length !== 6}
              className="w-full py-4 bg-brand-secondary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-secondary/20 flex items-center justify-center gap-2"
            >
              Join Lobby
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
