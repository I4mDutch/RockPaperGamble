import { useMemo } from 'react'
import { ArrowDown, ArrowUp, DoorOpen, Play, Sparkles } from 'lucide-react'
import type { Player } from '@rpg/shared'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'

interface LobbyRoomProps {
  onLeave: () => void
}

export const LobbyRoom = ({ onLeave }: LobbyRoomProps) => {
  const { session, reorderPlayers, setReady, startGame } = useGameStore()
  const { user, guestUser } = useAuthStore()

  const currentUserId = user?.id ?? guestUser?.id ?? null

  const players = session?.players ?? []
  const turnOrder = session?.turnOrder ?? players.map((player) => player.id)
  const hostId = session?.hostId

  const orderedPlayers = useMemo(() => {
    const byId = new Map(players.map((player) => [player.id, player]))

    return turnOrder
      .map((playerId) => byId.get(playerId))
      .filter((player): player is Player => Boolean(player))
  }, [players, turnOrder])

  const isHost = Boolean(currentUserId && hostId === currentUserId)
  const currentPlayer = players.find((player) => player.id === currentUserId)
  const isReady = currentPlayer?.status === 'ready'
  const everyoneReady = players.length > 1 && players.every((player) => player.status === 'ready')

  const movePlayer = (fromIndex: number, direction: -1 | 1) => {
    if (!isHost) return

    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= turnOrder.length) return

    const newOrder = [...turnOrder]
    const [moved] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, moved)

    reorderPlayers(newOrder)
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid gap-4 sm:gap-6 lg:gap-8">
      <section className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white italic text-balance">
            LOBBY <span className="text-brand-primary">ROOM</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-400 font-semibold uppercase tracking-widest">
            {players.length} Player{players.length === 1 ? '' : 's'}
          </div>
        </div>

        <ul className="space-y-2 sm:space-y-3">
          {orderedPlayers.map((player, index) => {
            const isMe = player.id === currentUserId
            const canMoveUp = isHost && index > 0
            const canMoveDown = isHost && index < orderedPlayers.length - 1

            return (
              <li
                key={player.id}
                className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-slate-900/45 p-3 sm:p-4"
              >
                <div
                  className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-inner"
                  style={{ backgroundColor: player.avatarColor || '#334155' }}
                >
                  {player.avatarUrl && !player.avatarUrl.startsWith('http') ? (
                    <span>{player.avatarUrl}</span>
                  ) : player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.displayName} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{player.initials || player.displayName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">
                    {player.displayName}
                    {isMe && <span className="text-brand-secondary ml-2">(You)</span>}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">
                    {player.id === hostId ? 'Host' : 'Guest'} · ${player.coins.toLocaleString()}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    player.status === 'ready'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-200 border-amber-500/30'
                  }`}
                >
                  {player.status === 'ready' ? 'Ready' : 'Waiting'}
                </span>

                {isHost && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => movePlayer(index, -1)}
                      disabled={!canMoveUp}
                      aria-label={`Move ${player.displayName} up`}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-slate-700/60 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-secondary/50 transition-all duration-200 ease-in-out active:scale-95"
                    >
                      <ArrowUp size={14} className="mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePlayer(index, 1)}
                      disabled={!canMoveDown}
                      aria-label={`Move ${player.displayName} down`}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-slate-700/60 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-secondary/50 transition-all duration-200 ease-in-out active:scale-95"
                    >
                      <ArrowDown size={14} className="mx-auto" />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div>
            <div className="text-white font-black text-xl italic">READY CHECK</div>
            <p className="text-slate-400 text-sm mt-1">
              {everyoneReady
                ? 'Everyone is ready — host can start the game.'
                : 'Players need to ready up before the game can start.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setReady(!isReady)}
              aria-pressed={isReady}
              className={`px-4 py-3 rounded-2xl border text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-in-out active:scale-95 ${
                isReady
                  ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/40'
                  : 'bg-brand-primary/25 border-brand-primary/40 text-white hover:bg-brand-primary/40'
              }`}
            >
              {isReady ? 'Unready' : 'Ready Up'}
            </button>

            {isHost && (
              <button
                type="button"
                onClick={startGame}
                disabled={!everyoneReady}
                className="px-4 py-3 rounded-2xl bg-brand-secondary text-white border border-brand-secondary/40 text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-all duration-200 ease-in-out active:scale-95 flex items-center gap-2"
              >
                <Play size={15} />
                Start Game
              </button>
            )}

            <button
              type="button"
              onClick={onLeave}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 text-slate-200 border border-white/10 text-sm font-bold uppercase tracking-wide hover:bg-slate-700 transition-all duration-200 ease-in-out active:scale-95 flex items-center gap-2"
            >
              <DoorOpen size={15} />
              Leave
            </button>
          </div>
        </div>

        {isHost && !everyoneReady && (
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-accent font-semibold uppercase tracking-wider">
            <Sparkles size={14} />
            Waiting on all players to hit ready.
          </div>
        )}
      </section>
    </div>
  )
}

export default LobbyRoom
