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

import { WaveBackground } from '../ui/WaveBackground'

interface LobbyRoomProps {
  onLeave: () => void
}

export const LobbyRoom = ({ onLeave }: LobbyRoomProps) => {
  const { session, isConnected, isConnecting, reorderPlayers, setReady, startGame } = useGameStore()
  const { user, guestUser, guestLogout } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  if (!isConnected || isConnecting) {
    return (
      <div className="text-center space-y-6 p-12 card-modern relative overflow-hidden">
        <WaveBackground />
        <div className="relative z-10">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent-primary)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-muted)' }}>Connecting to lobby...</p>
        </div>
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
    if (currentPlayer) setReady(currentPlayer.status !== 'ready')
  }

  return (
    <div className="max-w-5xl w-full space-y-6 relative">
      <WaveBackground />
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button onClick={onLeave} className="flex items-center gap-2 transition-colors group" style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold uppercase tracking-widest text-[10px]">Exit</span>
        </button>
        <div className="flex items-center gap-3">
          {guestUser && (
            <button onClick={() => { guestLogout(); onLeave(); }} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              <LogOut size={14} /> Switch
            </button>
          )}
          <div className="px-4 py-2.5 rounded-xl flex items-center gap-3" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Code</span>
            <span className="text-lg font-bold tracking-[0.25em] select-all" style={{ color: 'var(--color-accent-primary)', fontFamily: '"JetBrains Mono", monospace' }}>{session.id}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card-modern space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <Users size={18} style={{ color: 'var(--color-accent-primary)' }} />
                </div>
                <h2 className="heading-display text-lg">Players <span style={{ color: 'var(--color-text-muted)' }}>({session.players.length})</span></h2>
              </div>
              <div className="pill pill-success">
                <CheckCircle2 size={12} />
                {readyCount}/{session.players.length} Ready
              </div>
            </div>

            {/* Player Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.players.map((player) => {
                const isCurrentUser = player.id === currentUserId
                const isReady = player.status === 'ready'
                return (
                  <div
                    key={player.id}
                    onClick={isCurrentUser ? handleReadyToggle : undefined}
                    className="card-compact flex items-center gap-3 transition-all"
                    style={{
                      cursor: isCurrentUser ? 'pointer' : 'default',
                      borderColor: isReady ? 'rgba(16,185,129,0.3)' : 'var(--color-border)',
                      background: isReady ? 'rgba(16,185,129,0.04)' : 'var(--color-bg-page)',
                    }}
                  >
                    <div className="relative shrink-0">
                      <Avatar url={player.avatarUrl} name={player.displayName} size="md" color={player.avatarColor} initials={player.initials} />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ background: isReady ? 'var(--color-accent-success)' : 'var(--color-border)' }}>
                        {isReady ? <CheckCircle2 size={10} className="text-white" /> : <Circle size={10} style={{ color: 'var(--color-text-muted)' }} />}
                      </div>
                      {session.hostId === player.id && (
                        <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-md" style={{ background: 'var(--color-accent-pop)', color: 'white' }}>
                          <Crown size={8} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate-safe text-sm" style={{ color: isCurrentUser ? 'var(--color-accent-primary)' : 'var(--color-text-primary)' }}>{player.displayName}</p>
                        {isCurrentUser && <span className="pill pill-primary text-[8px]">You</span>}
                      </div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: isReady ? 'var(--color-accent-success)' : 'var(--color-text-muted)' }}>
                        {isReady ? 'Ready' : 'Waiting'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 min-w-0">
                      <span className="text-currency text-sm" style={{ color: 'var(--color-accent-pop)' }}>{formatMoney(player.coins)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ready Button */}
            {currentPlayer && (
              <button
                onClick={handleReadyToggle}
                className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] ${currentPlayer.status === 'ready' ? '' : 'btn-gradient'}`}
                style={currentPlayer.status === 'ready' ? { background: 'rgba(16,185,129,0.08)', color: 'var(--color-accent-success)', border: '1px solid rgba(16,185,129,0.2)', fontFamily: '"Outfit", system-ui, sans-serif' } : { fontFamily: '"Outfit", system-ui, sans-serif' }}
              >
                <span className="flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                  {currentPlayer.status === 'ready' ? <><CheckCircle2 size={20} /> Ready to Gamble</> : <><Circle size={20} className="animate-pulse" /> Ready Up</>}
                </span>
              </button>
            )}
          </div>
          <TurnOrderDisplay isHost={isHost} onReorder={(newOrder) => reorderPlayers(newOrder)} />
        </div>

        {/* Config + Events */}
        <div className="space-y-5">
          <EventFeed events={session.eventFeed} />
          
          <div className="card-modern space-y-5">
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Match Config</h3>
              {isHost && (
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg transition-all" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <Settings size={16} />
                </button>
              )}
            </div>
            <div className="space-y-0">
              {[
                ['Mode', <span style={{ color: 'var(--color-accent-primary)' }} className="font-bold text-xs uppercase tracking-wider">Series (3 Wins)</span>],
                ['Starting', <span className="text-currency text-xs">{formatMoney(session.settings?.startingMoney || 10000)}</span>],
                ['Wagering', <span className="pill pill-success text-[9px]">Enabled</span>],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between items-center text-sm py-3" style={{ borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                  {value}
                </div>
              ))}
            </div>
            {isHost ? (
              <button disabled={!allReady} onClick={startGame} className="btn-gradient w-full py-4">
                <Play size={18} fill="currentColor" /> {allReady ? 'START MATCH' : `WAITING (${readyCount}/${session.players.length})`}
              </button>
            ) : (
              <div className="text-center p-5 rounded-xl" style={{ background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{!allReady ? 'Waiting for players...' : 'Host is starting...'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <GameSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {session.countdown !== undefined && <GameCountdown seconds={session.countdown} onComplete={() => {}} />}
    </div>
  )
}
