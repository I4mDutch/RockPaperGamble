import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Swords, Target, Timer, Coins, Gift, Ban } from 'lucide-react'
import { Avatar } from '../common/Avatar'

export const ChallengeSelector = () => {
  const { session, socket } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const [giftTarget, setGiftTarget] = useState<string | null>(null)
  const [giftAmount, setGiftAmount] = useState(100)

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const currentPlayer = session.players.find(p => p.id === userId)
  const isChallenger = currentPlayer?.role === 'challenger'
  const isBroke = (currentPlayer?.coins || 0) <= 0

  const handleSelect = (targetId: string) => {
    if (!isChallenger || isBroke) return
    socket?.send(JSON.stringify({
      type: 'SELECT_CHALLENGER',
      targetId,
      amount: 0
    }))
  }

  const handleGift = () => {
    if (!giftTarget || giftAmount <= 0) return
    socket?.send(JSON.stringify({
      type: 'GIFT_COINS',
      targetId: giftTarget,
      amount: giftAmount
    }))
    setGiftTarget(null)
    setGiftAmount(100)
  }

  const otherPlayers = session.players.filter(p => p.id !== userId)

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/20 text-brand-primary mb-2">
          <Swords size={32} />
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">
          {isBroke ? 'YOU\'RE BROKE' : isChallenger ? 'PICK YOUR OPPONENT' : 'WAITING FOR CHALLENGE'}
        </h2>
        <p className="text-slate-400">
          {isBroke
            ? 'You have no coins! Ask someone to gift you some.'
            : isChallenger ? 'Choose who you want to duel in Rock Paper Scissors.' : 'The active player is currently choosing their target.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-primary">
          <Timer size={20} className="animate-pulse" />
          <span className="text-lg font-black italic">{session.timeLeft}s</span>
        </div>
      </div>

      {/* Gift Coins Modal */}
      {giftTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setGiftTarget(null)} />
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-2xl font-black text-white italic tracking-tighter text-center">GIFT COINS</h3>
            <p className="text-slate-400 text-center text-sm">
              Sending to <span className="text-brand-accent font-bold">{session.players.find(p => p.id === giftTarget)?.displayName}</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setGiftAmount(Math.max(10, giftAmount - 50))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xl font-black transition-all"
              >-</button>
              <div className="flex items-center gap-2 bg-slate-800 rounded-2xl px-6 py-3 border border-white/10">
                <Coins size={20} className="text-yellow-500" />
                <input
                  type="number"
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 bg-transparent text-2xl font-black text-white text-center outline-none"
                />
              </div>
              <button 
                onClick={() => setGiftAmount(Math.min(currentPlayer?.coins || 0, giftAmount + 50))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xl font-black transition-all"
              >+</button>
            </div>
            <p className="text-xs text-slate-500 text-center">Your balance: {currentPlayer?.coins.toLocaleString()} 🪙</p>
            <div className="flex gap-3">
              <button
                onClick={() => setGiftTarget(null)}
                className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all"
              >Cancel</button>
              <button
                onClick={handleGift}
                disabled={giftAmount <= 0 || giftAmount > (currentPlayer?.coins || 0)}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Gift size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPlayers.map((player) => {
          const playerBroke = player.coins <= 0
          return (
            <div
              key={player.id}
              className="relative group"
            >
              <button
                onClick={() => handleSelect(player.id)}
                disabled={!isChallenger || isBroke || playerBroke}
                className={`
                  w-full p-6 rounded-3xl border transition-all duration-300
                  ${playerBroke
                    ? 'bg-slate-800/20 border-rose-500/20 opacity-60 cursor-not-allowed'
                    : isChallenger && !isBroke
                      ? 'bg-slate-800/40 border-white/5 hover:border-brand-primary/50 hover:scale-[1.02] cursor-pointer' 
                      : 'bg-slate-800/20 border-white/5 opacity-50 cursor-default'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar url={player.avatarUrl} name={player.displayName} size="xl" />
                    <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase ${
                      playerBroke ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-brand-accent text-slate-900'
                    }`}>
                      {playerBroke ? 'BROKE' : `${player.coins.toLocaleString()} 🪙`}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">{player.displayName}</p>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
                      {playerBroke ? 'Eliminated' : 'Spectator'}
                    </p>
                  </div>
                </div>
                
                {isChallenger && !isBroke && !playerBroke && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-primary/10 rounded-3xl">
                    <div className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                      <Target size={18} />
                      CHALLENGE
                    </div>
                  </div>
                )}

                {playerBroke && (
                  <div className="absolute top-3 right-3">
                    <Ban size={20} className="text-rose-500/50" />
                  </div>
                )}
              </button>

              {/* Gift button — visible for anyone with coins */}
              {!isBroke && (
                <button
                  onClick={(e) => { e.stopPropagation(); setGiftTarget(player.id); }}
                  className="absolute top-3 left-3 p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-emerald-500/20"
                  title="Gift coins"
                >
                  <Gift size={16} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
