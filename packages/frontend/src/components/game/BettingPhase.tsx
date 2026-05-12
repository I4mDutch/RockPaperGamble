import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Coins, Flame, Timer, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Avatar } from '../common/Avatar'

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
  const myBet = session.currentDuel?.bets.find(b => b.playerId === userId)
  const hasBet = !!myBet
  const challengerWager = session.currentDuel?.bets.find(b => b.playerId === challenger.id && b.targetId === challenger.id)
  const challengeeWager = session.currentDuel?.bets.find(b => b.playerId === challengee.id && b.targetId === challengee.id)

  const handleBet = (targetId: string) => {
    if (hasBet) return
    socket?.send(JSON.stringify({ type: 'PLACE_BET', targetId, amount: betAmount }))
  }

  return (
    <div className="w-full max-w-4xl space-y-10 animate-in fade-in zoom-in duration-500">
      {/* VS Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-8">
          <div className="text-right flex-1 min-w-0">
            <div className="relative mb-4 inline-block">
              <Avatar url={challenger.avatarUrl} name={challenger.displayName} size="2xl" className={isChallenger ? 'ring-4 ring-offset-4' : ''} />
              {isChallenger && <div className="absolute -top-3 -right-3 pill pill-primary text-[10px]">YOU</div>}
            </div>
            <p className="text-responsive-xl font-black tracking-tighter uppercase truncate-safe ml-auto" style={{ color: 'var(--color-text-primary)', fontFamily: '"Outfit",system-ui,sans-serif' }}>{challenger.displayName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'var(--color-accent-primary)' }}>Challenger</p>
            {challengerWager && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl animate-pulse" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', color: 'var(--color-accent-primary)' }}>
                <ShieldAlert size={14} /><span className="text-xs font-black tracking-widest uppercase">Wager: {challengerWager.amount} 🪙</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-5 shrink-0 bg-white/60 backdrop-blur-md border border-white/50 shadow-xl rounded-[2rem] p-6 relative z-10 mx-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100">
              <span className="text-lg font-black italic text-slate-400">VS</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 font-black text-3xl tracking-tighter text-amber-500">
                <Coins size={24} /><span>{session.currentDuel?.bets.reduce((s, b) => s + b.amount, 0).toLocaleString()}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Prize Pool</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 bg-white px-4 py-1.5 rounded-full border border-amber-100 shadow-sm mt-2">
              <Timer size={16} className="animate-pulse" /><span className="text-lg font-black">{session.timeLeft}s</span>
            </div>
          </div>

          <div className="text-left flex-1 min-w-0">
            <div className="relative mb-4 inline-block">
              <Avatar url={challengee.avatarUrl} name={challengee.displayName} size="2xl" className={isChallengee ? 'ring-4 ring-offset-4' : ''} />
              {isChallengee && <div className="absolute -top-3 -left-3 pill pill-pop text-[10px]">YOU</div>}
            </div>
            <p className="text-responsive-xl font-black tracking-tighter uppercase truncate-safe" style={{ color: 'var(--color-text-primary)', fontFamily: '"Outfit",system-ui,sans-serif' }}>{challengee.displayName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'var(--color-accent-secondary)' }}>Challengee</p>
            {challengeeWager && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl animate-pulse" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', color: 'var(--color-accent-secondary)' }}>
                <ShieldAlert size={14} /><span className="text-xs font-black tracking-widest uppercase">Wager: {challengeeWager.amount} 🪙</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Betting Control */}
      <div className="card-modern space-y-8">
        {!hasBet ? (
          <>
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: 'var(--color-text-muted)' }}>Select Your Wager</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => setBetAmount(Math.max(50, betAmount - 50))} className="w-14 h-14 rounded-2xl text-2xl font-black transition-all active:scale-90" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>-</button>
                <div className="w-48 h-16 flex items-center justify-center gap-3 rounded-2xl px-4" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                  <Coins size={24} style={{ color: 'var(--color-accent-pop)' }} />
                  <input type="number" value={betAmount} onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-transparent text-3xl font-black tracking-tighter outline-none text-center" style={{ color: 'var(--color-text-primary)', fontFamily: '"JetBrains Mono",monospace' }} />
                </div>
                <button onClick={() => setBetAmount(betAmount + 50)} className="w-14 h-14 rounded-2xl text-2xl font-black transition-all active:scale-90" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>+</button>
                <button onClick={() => setBetAmount(me?.coins || 0)} className="px-4 h-14 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-90" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--color-accent-pop)' }}>MAX</button>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Balance: <span style={{ color: 'var(--color-text-primary)' }}>{me?.coins.toLocaleString()} 🪙</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isSpectator || isChallenger) && (
                <button onClick={() => handleBet(challenger.id)} className="group relative overflow-hidden py-5 font-black rounded-2xl transition-all active:scale-[0.98]" style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: 'var(--shadow-btn)' }}>
                  <div className="relative z-10 flex items-center justify-center gap-3 text-lg tracking-tighter truncate-safe px-4" style={{ fontFamily: '"Outfit",system-ui,sans-serif' }}>
                    <Flame size={22} className="shrink-0" />{isChallenger ? 'WAGER' : `BET ON ${challenger.displayName.toUpperCase()}`}
                  </div>
                </button>
              )}
              {(isSpectator || isChallengee) && (
                <button onClick={() => handleBet(challengee.id)} className="group relative overflow-hidden py-5 font-black rounded-2xl transition-all active:scale-[0.98]" style={{ background: 'var(--color-accent-pop)', color: 'white', boxShadow: '0 4px 16px rgba(245,158,11,0.25)' }}>
                  <div className="relative z-10 flex items-center justify-center gap-3 text-lg tracking-tighter truncate-safe px-4" style={{ fontFamily: '"Outfit",system-ui,sans-serif' }}>
                    <Flame size={22} className="shrink-0" />{isChallengee ? 'WAGER' : `BET ON ${challengee.displayName.toUpperCase()}`}
                  </div>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--color-accent-success)' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 className="heading-display text-2xl uppercase">Wager Locked In</h3>
            <p className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              You bet <span style={{ color: 'var(--color-accent-pop)' }}>{myBet.amount} 🪙</span> on {session.players.find(p => p.id === myBet.targetId)?.displayName}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
