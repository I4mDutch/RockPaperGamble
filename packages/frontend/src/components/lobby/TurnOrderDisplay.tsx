import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Crown, ChevronUp, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'

interface TurnOrderDisplayProps {
  isHost: boolean
  onReorder?: (newOrder: string[]) => void
}

export const TurnOrderDisplay = ({ isHost, onReorder }: TurnOrderDisplayProps) => {
  const { session } = useGameStore()
  if (!session) return null

  const players = session.players
  const turnOrder = session.turnOrder && session.turnOrder.length > 0 
    ? session.turnOrder 
    : players.map(p => p.id)

  const orderedPlayers = turnOrder
    .map(id => players.find(p => p.id === id))
    .filter(Boolean) as typeof players

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (!isHost || session.status !== 'lobby') return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= turnOrder.length) return
    const newOrder = [...turnOrder]
    const [removed] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, removed)
    onReorder?.(newOrder)
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Turn Order</h4>
      <div className="space-y-2">
        {orderedPlayers.map((player, index) => {
          const isActive = index === session.activePlayerIndex && session.status === 'in_progress'
          return (
            <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-brand-primary/20 border border-brand-primary/50' : 'bg-slate-800/50 border border-white/5'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-slate-400/20 text-slate-400' : index === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-slate-700 text-slate-500'}`}>
                {index + 1}
              </div>
              <Avatar url={player.avatarUrl} name={player.displayName} size="sm" color={player.avatarColor} initials={player.initials} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{player.displayName}</p>
                {player.id === session.hostId && <p className="text-[10px] text-brand-accent font-bold flex items-center gap-1 uppercase"> <Crown size={10} fill="currentColor" /> Host </p>}
              </div>
              {isHost && session.status === 'lobby' && orderedPlayers.length > 1 && (
                <div className="flex items-center gap-1 pl-2 border-l border-white/10 ml-2">
                  <button onClick={() => movePlayer(index, 'up')} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-slate-700/80 disabled:opacity-10 transition-all text-slate-400 hover:text-white"><ChevronUp size={18} /></button>
                  <button onClick={() => movePlayer(index, 'down')} disabled={index === orderedPlayers.length - 1} className="p-1.5 rounded-lg hover:bg-slate-700/80 disabled:opacity-10 transition-all text-slate-400 hover:text-white"><ChevronDown size={18} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
