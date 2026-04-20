import { useState, useEffect, useRef } from 'react'
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
  const { session, isConnected, reorderPlayers, setReady, startGame, forceSync } = useGameStore()
  const { user, guestUser, guestLogout } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const [isReadySending, setIsReadySending] = useState(false)
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentUserId = user?.id || guestUser?.id

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current)
      }
    }
  }, [])

  // Debug session players
  useEffect(() => {
    if (session?.players) {
      console.log('Session Players updated:', session.players.map(p => ({ 
        id: p.id, 
        name: p.displayName, 
        status: p.status 
      })));
    }
  }, [session?.players])

  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Connecting to lobby...</p>
      </div>
    )
  }

  if (!session) return null

  const isHost = session.hostId === currentUserId
  const currentPlayer = session.players.find(p => p.id === currentUserId)

  const handleLeaveClick = () => {
    setShowConfirmLeave(true)
  }

  const confirmLeave = () => {
    setShowConfirmLeave(false)
    onLeave()
  }

  const handleReadyToggle = () => {
    // Prevent duplicate clicks while sending
    if (isReadySending) {
      return
    }

    // Must have session at this point (due to early return check above)
    if (!session) return
    
    // Re-find player to ensure we have the latest state
    const p = session.players.find(player => player.id === currentUserId)
    
    if (!p) {
      console.warn('Ready toggle: Player not found!', { currentUserId, players: session.players })
      forceSync()
      return
    }

    // Handle undefined status - default to not ready
    const playerStatus = p.status || 'not_ready'
    const isReady = playerStatus === 'ready'
    const nextStatus = !isReady
    
    console.log('Ready toggle action:', { 
      name: p.displayName, 
      currentStatus: playerStatus, 
      sending: nextStatus 
    })
    
    setIsReadySending(true)
    setReady(nextStatus)
    
    // Clear the sending state after a short delay to allow UI to update
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current)
    }
    readyTimeoutRef.current = setTimeout(() => setIsReadySending(false), 300)
    
    // If status was undefined, also force a sync
    if (!p.status) {
      setTimeout(() => forceSync(), 100)
    }
  }

  // Calculate ready status
  const readyCount = session.players.filter(p => p.status === 'ready').length
  const allReady = readyCount === session.players.length && session.players.length >= 2

  return (
    <>
      <div className="max-w-5xl w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={handleLeaveClick}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group btn-touch"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Exit Lobby</span>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Guest Logout Option */}
            {guestUser && (
              <button
                onClick={() => {
                  guestLogout()
                  onLeave()
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/20 transition-all btn-touch"
              >
                <LogOut size={16} />
                <span>Switch to Discord</span>
              </button>
            )}
            
            <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lobby Code</span>
              <span className="text-xl font-black text-brand-accent tracking-widest select-all">{session.id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="text-brand-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Players ({session.players.length})
                  </h2>
                </div>
                
                {/* Ready Count */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/5">
                  <CheckCircle2 size={14} className={allReady ? 'text-emerald-400' : 'text-slate-500'} />
                  <span className={`text-sm font-bold ${allReady ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {readyCount}/{session.players.length} Ready
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {session.players.map((player) => {
                  const isCurrentUser = player.id === currentUserId
                  return (
                    <div
                      key={player.id}
                      onClick={isCurrentUser ? handleReadyToggle : undefined}
                      className={`
                        flex items-center gap-4 p-4 rounded-2xl border transition-all
                        ${isCurrentUser ? 'cursor-pointer hover:border-brand-primary/50' : ''}
                        ${player.status === 'ready' 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-slate-900/50 border-white/5'}
                      `}
                    >
                      <div className="relative">
                        <Avatar 
                          url={player.avatarUrl} 
                          name={player.displayName} 
                          size="md" 
                          color={player.avatarColor}
                          initials={player.initials}
                        />
                        
                        {/* Ready Indicator */}
                        <div className={`
                          absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2
                          ${player.status === 'ready' 
                            ? 'bg-emerald-500 border-slate-900' 
                            : 'bg-slate-600 border-slate-900'}
                        `}>
                          {player.status === 'ready' ? (
                            <CheckCircle2 size={12} className="text-white" />
                          ) : (
                            <Circle size={12} className="text-slate-400" />
                          )}
                        </div>
                        
                        {/* Host Badge */}
                        {session.hostId === player.id && (
                          <div className="absolute -top-2 -right-2 bg-brand-accent text-slate-900 p-1 rounded-lg">
                            <Crown size={10} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold truncate ${isCurrentUser ? 'text-brand-primary' : 'text-white'}`}>
                            {player.displayName}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded-full font-bold">
                              You
                            </span>
                          )}
                        </div>                        
                        <div className="flex items-center gap-2">
                          {player.stats.winStreak > 0 && (
                            <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                              <span className="text-[10px] font-black text-orange-500">🔥 {player.stats.winStreak}</span>
                            </div>
                          )}
                          <span className={`text-xs ${player.status === 'ready' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {player.status === 'ready' ? 'Ready' : 'Not Ready'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-brand-accent font-black">
                          {formatMoney(player.coins)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Ready Button for Current Player */}
              {currentPlayer && (
                <button
                  onClick={handleReadyToggle}
                  className={`
                    w-full py-5 rounded-2xl font-black text-lg tracking-wide transition-all btn-press transform active:scale-95
                    ${currentPlayer.status === 'ready'
                      ? 'bg-emerald-500/30 text-emerald-400 border-2 border-emerald-500/60 hover:bg-emerald-500/40'
                      : 'bg-gradient-to-r from-brand-primary to-red-600 text-white shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/40 hover:brightness-110'}
                  `}
                >
                  {currentPlayer.status === 'ready' ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={24} />
                      <span>READY!</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 animate-pulse">
                      <Circle size={24} />
                      <span>CLICK TO READY UP</span>
                    </span>
                  )}
                </button>
              )}
            </div>
            
            {/* Turn Order Display */}
            <TurnOrderDisplay 
              isHost={isHost} 
              onReorder={(newOrder) => reorderPlayers(newOrder)}
            />
          </div>

          {/* Game Info / Actions Sidebar */}
          <div className="space-y-6">
            {/* Game Settings Panel */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Game Settings</h3>
                {isHost && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors btn-touch"
                  >
                    <Settings size={18} />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                  <span className="text-slate-400">Mode</span>
                  <span className="text-brand-primary font-bold">Series (First to 3)</span>
                </div>
                
                <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                  <span className="text-slate-400">Starting Money</span>
                  <span className="text-white font-bold">
                    {formatMoney(session.settings?.startingMoney || 10000)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                  <span className="text-slate-400">Betting</span>
                  <span className="text-white font-bold">Match Winner</span>
                </div>
                
                {/* Balance Modifiers Display */}
                {session.settings && (session.settings.lossModifier !== 0 || session.settings.winModifier !== 0) && (
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <p className="text-xs font-bold text-orange-400 mb-2">High-Stakes Mode</p>
                    <div className="space-y-1 text-xs">
                      {session.settings && session.settings.winModifier !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Win Modifier:</span>
                          <span className={session.settings.winModifier > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {session.settings.winModifier > 0 ? '+' : ''}{(session.settings.winModifier * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {session.settings && session.settings.lossModifier !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Loss Modifier:</span>
                          <span className={session.settings.lossModifier > 0 ? 'text-red-400' : 'text-emerald-400'}>
                            {session.settings.lossModifier > 0 ? '+' : ''}{(session.settings.lossModifier * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isHost ? (
                <button
                  disabled={!allReady}
                  onClick={startGame}
                  className="w-full py-4 bg-brand-primary hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 btn-press"
                >
                  <Play size={20} fill="currentColor" />
                  {allReady ? 'Start Match' : `Waiting (${readyCount}/${session.players.length})`}
                </button>
              ) : (
                <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                  <p className="text-sm text-slate-500 italic">
                    {!allReady 
                      ? `Waiting for all players (${readyCount}/${session.players.length})...` 
                      : 'All ready! Waiting for host...'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Event Feed */}
            <EventFeed />
          </div>
        </div>
      </div>

      {/* Modals */}
      <GameSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Countdown Overlay */}
      <GameCountdown />

      {/* Confirm Leave Modal */}
      {showConfirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-3xl border border-white/10 p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Leave Lobby?</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to leave? You will lose your spot in this game.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLeave(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
