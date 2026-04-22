import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Users, ArrowLeft, Play, Settings, CheckCircle2, Circle, Crown, LogOut } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { GameSettingsModal } from './GameSettingsModal'
import { TurnOrderDisplay } from './TurnOrderDisplay'
import { GameCountdown } from '@/components/game/GameCountdown'
import { EventFeed } from '@/components/game/EventFeed'
import { formatMoney } from '@/lib/utils'

interface LobbyRoomProps {
  onLeave: () => void
}

export const LobbyRoom = ({ onLeave }: LobbyRoomProps) => {
  const { session, isConnected, isConnecting, reorderPlayers, setReady, startGame } = useGameStore()
  const { user, guestUser, guestLogout } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  if (!isConnected || isConnecting) {
    return (
      <div className="text-center space-y-6 p-12 bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 font-medium">Connecting to lobby...</p>
      </div>
    )
  }

  if (!session) return null

  const currentUserId = user?.id || guestUser?.id
  const isHost = session.hostId === currentUserId
  const currentPlayer = session.players.find(p => p.id === currentUserId)
  const readyCount = session.players.filter(p => p.status === 'ready').length
  const allReady = readyCount === session.players.length && session.players.length >= 2

  const handleReadyToggle = () => {
    if (currentPlayer) {
      setReady(currentPlayer.status !== 'ready')
    }
  }

  return (
    <div className="max-w-5xl w-full space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onLeave} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Exit Lobby</span>
        </button>
        <div className="flex items-center gap-3">
          {guestUser && (
            <button onClick={() => { guestLogout(); onLeave(); }} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 rounded-xl border border-white/5 transition-all">
              <LogOut size={16} /> <span>Switch to Discord</span>
            </button>
          )}
          <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lobby Code</span>
            <span className="text-xl font-black text-brand-accent tracking-widest select-all">{session.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-brand-primary" />
                <h2 className="text-2xl font-bold text-white">Players ({session.players.length})</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/5">
                <CheckCircle2 size={14} className={allReady ? 'text-emerald-400' : 'text-slate-500'} />
                <span className={`text-sm font-bold ${allReady ? 'text-emerald-400' : 'text-slate-500'}`}>{readyCount}/{session.players.length} Ready</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {session.players.map((player) => {
                const isCurrentUser = player.id === currentUserId
                return (
                  <div key={player.id} onClick={isCurrentUser ? handleReadyToggle : undefined} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrentUser ? 'cursor-pointer hover:border-brand-primary/50' : ''} ${player.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                    <div className="relative">
                      <Avatar url={player.avatarUrl} name={player.displayName} size="md" color={player.avatarColor} initials={player.initials} />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${player.status === 'ready' ? 'bg-emerald-500 border-slate-900' : 'bg-slate-600 border-slate-900'}`}>
                        {player.status === 'ready' ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={12} className="text-slate-400" />}
                      </div>
                      {session.hostId === player.id && <div className="absolute -top-2 -right-2 bg-brand-accent text-slate-900 p-1 rounded-lg"><Crown size={10} fill="currentColor" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold truncate ${isCurrentUser ? 'text-brand-primary' : 'text-white'}`}>{player.displayName}</p>
                        {isCurrentUser && <span className="text-[10px] px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full font-bold">You</span>}
                      </div>
                      <p className={`text-xs ${player.status === 'ready' ? 'text-emerald-400' : 'text-slate-500'}`}>{player.status === 'ready' ? 'Ready' : 'Not Ready'}</p>
                    </div>
                    <div className="text-right text-brand-accent font-black">{formatMoney(player.coins)}</div>
                  </div>
                )
              })}
            </div>

            {currentPlayer && (
              <button onClick={handleReadyToggle} className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${currentPlayer.status === 'ready' ? 'bg-emerald-500/30 text-emerald-400 border-2 border-emerald-500/60 hover:bg-emerald-500/40' : 'bg-gradient-to-r from-brand-primary to-red-600 text-white shadow-xl shadow-brand-primary/30 hover:brightness-110'}`}>
                {currentPlayer.status === 'ready' ? <span className="flex items-center justify-center gap-2"><CheckCircle2 size={24} /> <span>READY!</span></span> : <span className="flex items-center justify-center gap-2 animate-pulse"><Circle size={24} /> <span>CLICK TO READY UP</span></span>}
              </button>
            )}
          </div>
          <TurnOrderDisplay isHost={isHost} onReorder={(newOrder) => reorderPlayers(newOrder)} />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Game Settings</h3>
              {isHost && <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><Settings size={18} /></button>}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5"><span className="text-slate-400">Mode</span><span className="text-brand-primary font-bold">Series (First to 3)</span></div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5"><span className="text-slate-400">Starting Money</span><span className="text-white font-bold">{formatMoney(session.settings?.startingMoney || 10000)}</span></div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5"><span className="text-slate-400">Betting</span><span className="text-white font-bold">Match Winner</span></div>
            </div>
            {isHost ? (
              <button disabled={!allReady} onClick={startGame} className="w-full py-4 bg-brand-primary hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2">
                <Play size={20} fill="currentColor" /> {allReady ? 'Start Match' : `Waiting (${readyCount}/${session.players.length})`}
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                <p className="text-sm text-slate-500 italic">{!allReady ? `Waiting for all players (${readyCount}/${session.players.length})...` : 'All ready! Waiting for host...'}</p>
              </div>
            )}
          </div>
          
          <EventFeed events={session.eventFeed} />
        </div>
      </div>

      <GameSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <GameCountdown />
    </div>
  )
}
