import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Swords, Target, Timer, Coins } from 'lucide-react'
import { Avatar } from '../common/Avatar'

const WAGER_OPTIONS = [0, 100, 500, 1000]

export const ChallengeSelector = () => {
  const { session, socket } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const [wager, setWager] = useState(0)

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const currentPlayer = session.players.find(p => p.id === userId)
  const isChallenger = currentPlayer?.role === 'challenger'

  const handleSelect = (targetId: string) => {
    if (!isChallenger) return
    socket?.send(JSON.stringify({
      type: 'SELECT_CHALLENGER',
      targetId,
      amount: wager
    }))
  }

  const otherPlayers = session.players.filter(p => p.id !== userId)

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/20 text-brand-primary mb-2">
          <Swords size={32} />
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">
          {isChallenger ? 'PICK YOUR OPPONENT' : 'WAITING FOR CHALLENGE'}
        </h2>
        <p className="text-slate-400">
          {isChallenger ? 'Choose who you want to duel in Rock Paper Scissors.' : 'The active player is currently choosing their target.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-primary">
          <Timer size={20} className="animate-pulse" />
          <span className="text-lg font-black italic">{session.timeLeft}s</span>
        </div>
      </div>

      {isChallenger && (
        <div className="flex flex-col items-center gap-4 bg-slate-800/40 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-300">
            <Coins size={20} className="text-yellow-500" />
            <span className="font-bold">Set Match Wager</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {WAGER_OPTIONS.map((amount) => {
              const disabled = amount > (currentPlayer?.coins || 0)
              return (
                <button
                  key={amount}
                  disabled={disabled}
                  onClick={() => setWager(amount)}
                  className={`
                    px-6 py-3 rounded-2xl font-black text-lg transition-all
                    ${wager === amount 
                      ? 'bg-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20' 
                      : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {amount === 0 ? 'FREE' : amount.toLocaleString()}
                </button>
              )
            })}
          </div>
          <p className="text-sm text-slate-500 italic">
            Both players must have enough coins. Wagers go to the prize pool!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleSelect(player.id)}
            disabled={!isChallenger}
            className={`
              relative group p-6 rounded-3xl border transition-all duration-300
              ${isChallenger 
                ? 'bg-slate-800/40 border-white/5 hover:border-brand-primary/50 hover:scale-[1.02] cursor-pointer' 
                : 'bg-slate-800/20 border-white/5 opacity-50 cursor-default'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar url={player.avatarUrl} name={player.displayName} size="xl" />
                <div className="absolute -bottom-2 -right-2 bg-brand-accent text-slate-900 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase">
                  {player.coins.toLocaleString()} 🪙
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{player.displayName}</p>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Spectator</p>
              </div>
            </div>
            
            {isChallenger && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-primary/10 rounded-3xl">
                <div className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                  <Target size={18} />
                  CHALLENGE
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
