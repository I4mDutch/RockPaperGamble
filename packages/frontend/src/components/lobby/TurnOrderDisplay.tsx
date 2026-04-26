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
  const turnOrder = session.turnOrder && session.turnOrder.length > 0 ? session.turnOrder : players.map(p => p.id)
  const orderedPlayers = turnOrder.map(id => players.find(p => p.id === id)).filter(Boolean) as typeof players

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
    <div className="card-modern">
      <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>Turn Order</h4>
      <div className="space-y-2">
        {orderedPlayers.map((player, index) => {
          const isActive = index === session.activePlayerIndex && session.status === 'in_progress'
          const rankColors = ['var(--color-accent-pop)', '#9CA3AF', '#D97706']
          return (
            <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{
              background: isActive ? 'rgba(124,58,237,0.06)' : 'var(--color-bg-surface)',
              border: `1px solid ${isActive ? 'rgba(124,58,237,0.2)' : 'var(--color-border)'}`,
            }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{
                background: index < 3 ? `${rankColors[index]}15` : 'var(--color-bg-surface)',
                color: index < 3 ? rankColors[index] : 'var(--color-text-muted)',
              }}>{index + 1}</div>
              <Avatar url={player.avatarUrl} name={player.displayName} size="sm" color={player.avatarColor} initials={player.initials} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate-safe" style={{ color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-primary)' }}>{player.displayName}</p>
                {player.id === session.hostId && (
                  <p className="text-[10px] font-bold flex items-center gap-1 uppercase" style={{ color: 'var(--color-accent-pop)' }}>
                    <Crown size={10} fill="currentColor" /> Host
                  </p>
                )}
              </div>
              {isHost && session.status === 'lobby' && orderedPlayers.length > 1 && (
                <div className="flex items-center gap-1 pl-2 ml-2" style={{ borderLeft: '1px solid var(--color-border)' }}>
                  <button onClick={() => movePlayer(index, 'up')} disabled={index === 0} className="p-1.5 rounded-lg transition-all disabled:opacity-10" style={{ color: 'var(--color-text-muted)' }}><ChevronUp size={18} /></button>
                  <button onClick={() => movePlayer(index, 'down')} disabled={index === orderedPlayers.length - 1} className="p-1.5 rounded-lg transition-all disabled:opacity-10" style={{ color: 'var(--color-text-muted)' }}><ChevronDown size={18} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
