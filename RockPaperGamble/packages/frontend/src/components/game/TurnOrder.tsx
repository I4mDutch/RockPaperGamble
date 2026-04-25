import { useState } from 'react'
import { Avatar } from '../common/Avatar'
import { ChevronDown, UserCheck, ArrowRight } from 'lucide-react'

export interface TurnOrderPlayer {
  id: string
  name: string
  avatarUrl?: string
  isActive: boolean
}

export interface TurnOrderProps {
  players: TurnOrderPlayer[]
  activePlayerId: string
  nextPlayerId: string
  isHost: boolean
  onSelectStartingPlayer?: (playerId: string) => void
}

export const TurnOrder = ({
  players,
  activePlayerId,
  nextPlayerId,
  isHost,
  onSelectStartingPlayer,
}: TurnOrderProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFirstPlayer, setSelectedFirstPlayer] = useState<string | null>(null)

  // Reorder players: selected first player + remaining in original order
  const orderedPlayers = selectedFirstPlayer
    ? (() => {
        const selectedIdx = players.findIndex((p) => p.id === selectedFirstPlayer)
        if (selectedIdx === -1) return players
        return [
          players[selectedIdx],
          ...players.slice(0, selectedIdx),
          ...players.slice(selectedIdx + 1),
        ]
      })()
    : players

  const activeIndex = orderedPlayers.findIndex((p) => p.id === activePlayerId)
  const nextIndex = orderedPlayers.findIndex((p) => p.id === nextPlayerId)

  const handleSelectFirstPlayer = (playerId: string) => {
    setSelectedFirstPlayer(playerId)
    setShowDropdown(false)
    onSelectStartingPlayer?.(playerId)
  }

  const isInLobby = activeIndex === -1 && nextIndex === -1

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">
          Turn Order
        </h3>
        {isHost && isInLobby && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary rounded-xl text-sm font-bold transition-colors"
            >
              <UserCheck size={16} />
              <span>Select First Player</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-white/10 shadow-medium z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  {players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectFirstPlayer(player.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedFirstPlayer === player.id
                          ? 'bg-brand-primary/20 text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <Avatar url={player.avatarUrl} name={player.name} size="sm" />
                      <span className="flex-1 text-sm font-bold truncate">
                        {player.name}
                      </span>
                      {selectedFirstPlayer === player.id && (
                        <UserCheck size={16} className="text-brand-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connecting Line */}
      <div className="relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-primary/50 via-white/10 to-white/5" />

        {/* Player List */}
        <div className="space-y-3">
          {orderedPlayers.map((player, index) => {
            const isActive = player.id === activePlayerId
            const isNext = player.id === nextPlayerId
            const isCompleted = activeIndex !== -1 && index < activeIndex
            const position = index + 1

            return (
              <div
                key={player.id}
                className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-primary/10 border-2 border-brand-primary shadow-glow'
                    : isNext
                      ? 'bg-white/5 border border-brand-accent/50'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                } ${isCompleted ? 'opacity-40 grayscale' : ''}`}
              >
                {/* Position Badge */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                    isActive
                      ? 'bg-brand-primary text-white'
                      : isNext
                        ? 'bg-brand-accent text-slate-900'
                        : isCompleted
                          ? 'bg-slate-700 text-slate-500'
                          : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {position}
                </div>

                {/* Avatar */}
                <Avatar
                  url={player.avatarUrl}
                  name={player.name}
                  size={isActive ? 'md' : 'sm'}
                  className={isActive ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-slate-800' : ''}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-bold truncate ${
                      isActive
                        ? 'text-white text-lg'
                        : isNext
                          ? 'text-white'
                          : 'text-slate-400'
                    }`}
                  >
                    {player.name}
                  </p>
                  {isNext && (
                    <p className="text-xs font-black text-brand-accent uppercase tracking-widest">
                      Next
                    </p>
                  )}
                </div>

                {/* Status Indicator */}
                {isActive && (
                  <div className="flex items-center gap-2 text-brand-primary">
                    <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                )}

                {isNext && (
                  <ArrowRight size={20} className="text-brand-accent" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected First Player Info */}
      {selectedFirstPlayer && isInLobby && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-slate-400">
            <span className="text-slate-300 font-bold">
              {players.find((p) => p.id === selectedFirstPlayer)?.name}
            </span>{' '}
            will go first
          </p>
        </div>
      )}
    </div>
  )
}
