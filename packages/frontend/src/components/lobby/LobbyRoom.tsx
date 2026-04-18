import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Users, Shield, ArrowLeft, Play } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'

interface LobbyRoomProps {
  onLeave: () => void
}

export const LobbyRoom = ({ onLeave }: LobbyRoomProps) => {
  const { session, isConnected } = useGameStore()
  const { user, guestUser } = useAuthStore()

  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Connecting to lobby...</p>
      </div>
    )
  }

  if (!session) return null

  const isHost = session.hostId === (user?.id || guestUser?.id)

  return (
    <div className="max-w-4xl w-full space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onLeave}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Exit Lobby</span>
        </button>
        <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lobby Code</span>
          <span className="text-xl font-black text-brand-accent tracking-widest">{session.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Users className="text-brand-primary" />
            <h2 className="text-2xl font-bold text-white">Players ({session.players.length})</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {session.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5"
              >
                <div className="relative">
                  <Avatar url={player.avatarUrl} name={player.displayName} size="md" />
                  {session.hostId === player.id && (
                    <div className="absolute -top-2 -right-2 bg-brand-accent text-slate-900 p-1 rounded-lg">
                      <Shield size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold truncate">{player.displayName}</p>
                    {player.stats.winStreak > 0 && (
                      <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                        <span className="text-[10px] font-black text-orange-500 uppercase">🔥 {player.stats.winStreak}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Ready to Gamble</p>
                </div>
                <div className="text-brand-accent font-black">
                  {player.coins.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Info / Actions */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 space-y-6">
            <h3 className="text-xl font-bold text-white">Game Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Mode</span>
                <span className="text-brand-primary font-bold">Series (First to 3)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Starting Coins</span>
                <span className="text-white font-bold">1,000</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Betting</span>
                <span className="text-white font-bold">Match Winner</span>
              </div>
            </div>

            {isHost ? (
              <button
                disabled={session.players.length < 2}
                onClick={() => {
                  const socket = useGameStore.getState().socket
                  socket?.send(JSON.stringify({ type: 'START_GAME' }))
                }}
                className="w-full py-4 bg-brand-primary hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                Start Match
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                <p className="text-sm text-slate-500 italic">Waiting for host to start...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
