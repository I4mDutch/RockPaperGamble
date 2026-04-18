import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Coins, Flame, Timer, CheckCircle2 } from 'lucide-react'

export const BettingPhase = () => {
  const { session, socket } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const [betAmount, setBetAmount] = useState(100)

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const me = session.players.find(p => p.id === userId)
  const challenger = session.players.find(p => p.id === session.currentDuel?.challengerId)
  const challengee = session.players.find(p => p.id === session.currentDuel?.challengeeId)

  if (!challenger || !challengee) return null

  const isChallenger = me?.id === challenger.id
  const isChallengee = me?.id === challengee.id
  const isSpectator = !isChallenger && !isChallengee

  // Check if I've already placed a bet
  const myBet = session.currentDuel?.bets.find(b => b.playerId === userId)
  const hasBet = !!myBet

  const handleBet = (targetId: string) => {
    if (hasBet) return
    socket?.send(JSON.stringify({
      type: 'PLACE_BET',
      targetId,
      amount: betAmount
    }))
  }

  return (
    <div className="w-full max-w-4xl space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-8 text-white">
          <div className="text-right group">
            <div className="relative mb-4">
              <img
                src={challenger.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${challenger.displayName}`}
                alt=""
                className={`w-32 h-32 rounded-3xl bg-slate-700 shadow-2xl transition-all ${isChallenger ? 'ring-4 ring-brand-primary ring-offset-8 ring-offset-slate-900' : ''}`}
              />
              {isChallenger && (
                <div className="absolute -top-3 -right-3 bg-brand-primary text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">YOU</div>
              )}
            </div>
            <p className="text-3xl font-black italic tracking-tighter uppercase">{challenger.displayName}</p>
            <p className="text-brand-primary text-sm font-black uppercase tracking-widest mt-1">Challenger</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-2xl font-black italic text-slate-500">VS</span>
            </div>
            <div className="flex items-center gap-2 text-brand-accent">
              <Timer size={20} className="animate-pulse" />
              <span className="text-xl font-black italic">{session.timeLeft}s</span>
            </div>
          </div>

          <div className="text-left group">
            <div className="relative mb-4">
              <img
                src={challengee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${challengee.displayName}`}
                alt=""
                className={`w-32 h-32 rounded-3xl bg-slate-700 shadow-2xl transition-all ${isChallengee ? 'ring-4 ring-brand-accent ring-offset-8 ring-offset-slate-900' : ''}`}
              />
              {isChallengee && (
                <div className="absolute -top-3 -left-3 bg-brand-accent text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">YOU</div>
              )}
            </div>
            <p className="text-3xl font-black italic tracking-tighter uppercase">{challengee.displayName}</p>
            <p className="text-brand-accent text-sm font-black uppercase tracking-widest mt-1">Challengee</p>
          </div>
        </div>
      </div>

      {/* Central Betting Control */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-10 space-y-8 shadow-2xl">
        {!hasBet ? (
          <>
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Select Your Wager</h3>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setBetAmount(Math.max(50, betAmount - 50))}
                  className="w-16 h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black transition-all active:scale-90 shadow-xl"
                >
                  -
                </button>
                <div className="w-56 bg-slate-900/80 border border-white/10 rounded-3xl h-20 flex items-center justify-center gap-3 shadow-inner px-4 focus-within:border-brand-accent/50 transition-colors">
                  <Coins size={28} className="text-brand-accent shrink-0" />
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-transparent text-4xl font-black text-white italic tracking-tighter outline-hidden"
                  />
                </div>
                <button 
                  onClick={() => setBetAmount(betAmount + 50)}
                  className="w-16 h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black transition-all active:scale-90 shadow-xl"
                >
                  +
                </button>
                <button 
                  onClick={() => setBetAmount(me?.coins || 0)}
                  className="px-4 h-16 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-sm font-black uppercase tracking-widest transition-all hover:bg-brand-accent hover:text-slate-900 active:scale-90 shadow-xl"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Balance: <span className="text-white">{me?.coins.toLocaleString()} 🪙</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(isSpectator || isChallenger) && (
                <button
                  onClick={() => handleBet(challenger.id)}
                  className="group relative overflow-hidden py-6 bg-brand-primary hover:bg-red-500 text-white font-black rounded-3xl transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.98]"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3 text-xl italic tracking-tighter">
                    <Flame size={24} />
                    <span>BET ON {isChallenger ? 'MYSELF' : challenger.displayName.toUpperCase()}</span>
                  </div>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              )}

              {(isSpectator || isChallengee) && (
                <button
                  onClick={() => handleBet(challengee.id)}
                  className="group relative overflow-hidden py-6 bg-brand-accent hover:bg-yellow-400 text-slate-900 font-black rounded-3xl transition-all shadow-xl shadow-brand-accent/20 active:scale-[0.98] col-start-auto"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3 text-xl italic tracking-tighter">
                    <Flame size={24} />
                    <span>BET ON {isChallengee ? 'MYSELF' : challengee.displayName.toUpperCase()}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Wager Locked In</h3>
            <p className="text-slate-400 font-bold">
              You bet <span className="text-brand-accent">{myBet.amount} 🪙</span> on {session.players.find(p => p.id === myBet.targetId)?.displayName}
            </p>
          </div>
        )}
        
        <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-widest">
          {hasBet ? 'Awaiting the duel results' : (isSpectator ? 'Choose your champion' : 'Prove your confidence')} • Potential Payout: {betAmount * 2} 🪙
        </p>
      </div>
    </div>
  )
}
