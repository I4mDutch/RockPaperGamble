import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Crown, ChevronUp, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'

interface TurnOrderDisplayProps {
  isHost: boolean
  onReorder?: (newOrder: string[]) => void
}

export const TurnOrderDisplay = ({ isHost, onReorder }: TurnOrderDisplayProps) => {
  const { session } = useGameStore()
  const [isMoving, setIsMoving] = useState(false)
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  if (!session) return null

  const players = session.players
  const turnOrder = session.turnOrder && session.turnOrder.length > 0 
    ? session.turnOrder 
    : players.map(p => p.id)

  useEffect(() => {
    if (!session.turnOrder || session.turnOrder.length === 0) {
      console.warn('[TurnOrder] session.turnOrder is EMPTY. Falling back to player order.');
    }
    console.log('[TurnOrder] State:', { 
      session: session.turnOrder, 
      effective: turnOrder,
      playerCount: players.length
    });
  }, [session.turnOrder, players])
  
  const orderedPlayers = turnOrder
    .map(id => players.find(p => p.id === id))
    .filter(Boolean) as typeof players

  const activeIndex = session.activePlayerIndex

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    // Prevent rapid clicking
    if (isMoving) {
      return
    }

    // Must have session at this point (due to early return check above)
    if (!session) return

    if (!isHost || session.status !== 'lobby') {
      console.warn('Move player: Not host or not in lobby', { isHost, status: session.status });
      return
    }
    
    // Always use the actual session turnOrder, not the fallback
    const currentTurnOrder = session.turnOrder?.length > 0 
      ? session.turnOrder 
      : players.map(p => p.id)
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= currentTurnOrder.length) {
      console.warn('Move player: Index out of bounds', { newIndex, length: currentTurnOrder.length });
      return
    }
    
    const newOrder = [...currentTurnOrder]
    const [removed] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, removed)
    
    console.log('Moving player:', {
      name: orderedPlayers[index]?.displayName,
      direction,
      from: index,
      to: newIndex,
      newOrder
    });

    setIsMoving(true)
    onReorder?.(newOrder)
    
    // Clear moving state after a short delay
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
    }
    moveTimeoutRef.current = setTimeout(() => setIsMoving(false), 300)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Turn Order
      </h4>
      
      <div className="space-y-2">
        {orderedPlayers.map((player, index) => {
          const isActive = index === activeIndex && session.status === 'in_progress'
          const canMoveUp = isHost && session.status === 'lobby' && index > 0
          const canMoveDown = isHost && session.status === 'lobby' && index < orderedPlayers.length - 1
          
          return (
            <div
              key={player.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isActive ? 'bg-brand-primary/20 border border-brand-primary/50' : 'bg-slate-800/50 border border-white/5'}
              `}
            >
              {/* Position Number */}
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0
                ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                  index === 1 ? 'bg-slate-400/20 text-slate-400' : 
                  index === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-slate-700 text-slate-500'}
              `}>
                {index + 1}
              </div>
              
              {/* Avatar */}
              <Avatar 
                url={player.avatarUrl} 
                name={player.displayName} 
                size="sm"
                color={player.avatarColor}
                initials={player.initials}
              />
              
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {player.displayName}
                </p>
                {player.id === session.hostId && (
                  <p className="text-[10px] text-brand-accent font-bold flex items-center gap-1 uppercase tracking-tighter">
                    <Crown size={10} fill="currentColor" /> Host
                  </p>
                )}
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="flex items-center gap-1 text-brand-primary">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Turn</span>
                </div>
              )}
              
              {/* Move Controls (Host only in lobby) */}
              {isHost && session.status === 'lobby' && orderedPlayers.length > 1 && (
                <div className="flex items-center gap-1 pl-2 border-l border-white/10 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      movePlayer(index, 'up')
                    }}
                    disabled={!canMoveUp}
                    className={`
                      p-1.5 rounded-lg hover:bg-slate-700/80 disabled:opacity-10 disabled:hover:bg-transparent
                      transition-all text-slate-400 hover:text-white hover:scale-110 active:scale-95
                    `}
                    title="Move Up"
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      movePlayer(index, 'down')
                    }}
                    disabled={!canMoveDown}
                    className={`
                      p-1.5 rounded-lg hover:bg-slate-700/80 disabled:opacity-10 disabled:hover:bg-transparent
                      transition-all text-slate-400 hover:text-white hover:scale-110 active:scale-95
                    `}
                    title="Move Down"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {isHost && session.status === 'lobby' && orderedPlayers.length > 1 && (
        <p className="text-xs text-slate-500 mt-3 text-center italic">
          Use arrows to reorder players
        </p>
      )}
    </div>
  )
}
