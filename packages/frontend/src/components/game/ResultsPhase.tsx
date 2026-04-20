import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Coins, Timer } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { useCoinAnimation } from './CoinAnimation'
import { useEffect, useRef } from 'react'

export const ResultsPhase = () => {
  const { session } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const { CoinAnimationComponent, triggerAnimation } = useCoinAnimation()
  const hasTriggeredRef = useRef(false)

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const winnerId = session.currentDuel?.winnerId
  const isTie = winnerId === 'draw'
  
  // Calculate user's payout for coin animation
  const myBet = session.currentDuel?.bets.find(b => b.playerId === userId)
  const myPayout = myBet?.payout || 0

  // Trigger coin animation when player wins (only once)
  useEffect(() => {
    if (myPayout > 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      triggerAnimation(myPayout)
    }
  }, [myPayout, triggerAnimation])
  
  return (
    <>
      <style>{styles}</style>
      {CoinAnimationComponent}
      <div className="w-full max-w-4xl space-y-12 animate-in zoom-in fade-in duration-700">
        <div className="text-center space-y-6">
          <div className={`inline-block px-6 py-2 rounded-full border animate-bounce ${isTie ? 'bg-slate-500/20 border-slate-500/30' : 'bg-brand-accent/20 border-brand-accent/30'}`}>
            <span className={`font-black tracking-widest uppercase italic ${isTie ? 'text-slate-400' : 'text-brand-accent'}`}>
              {isTie ? 'NO WINNER - BETS RETURNED' : 'Match Concluded'}
            </span>
          </div>
          <h2 className="text-8xl font-black italic text-white tracking-tighter uppercase leading-none">
            {isTie ? 'TIE GAME' : 'RESULTS'}
          </h2>
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <Timer size={20} className="animate-spin-slow" />
            <span className="text-xl font-black italic uppercase tracking-widest">Next match in {session.timeLeft}s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {session.players.sort((a, b) => b.coins - a.coins).map((player, idx) => {
            const isMe = player.id === userId
            
            return (
              <div 
                key={player.id}
                className={`
                  group relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border p-8 flex items-center justify-between transition-all duration-500
                  ${isMe ? 'border-brand-accent shadow-[0_0_50px_rgba(255,214,0,0.15)] scale-105 z-10' : 'border-white/5 opacity-80'}
                `}
              >
                {/* Animated Background Glow */}
                {isMe && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/10 to-transparent animate-pulse" />
                )}

                <div className="relative z-10 flex items-center gap-6">
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-2xl blur-sm opacity-50 ${isMe ? 'bg-brand-accent' : 'bg-transparent'}`} />
                    <Avatar url={player.avatarUrl} name={player.displayName} size="xl" className="relative border border-white/10" />
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-black text-slate-500">
                      #{idx + 1}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{player.displayName}</p>
                      {isMe && (
                        <span className="bg-brand-accent text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">YOU</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] mt-1">{player.role}</p>
                  </div>
                </div>

                <div className="relative z-10 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Coins size={24} className="text-brand-accent" />
                    <span className="text-4xl font-black text-white italic tracking-tighter">{player.coins.toLocaleString()}</span>
                  </div>
                  {/* Win/Loss Feedback */}
                  {session.currentDuel?.bets.find(b => b.playerId === player.id) && (
                    <div className={`text-sm font-black italic mt-1 ${
                      isTie ? 'text-slate-400' : 
                      session.currentDuel.bets.find(b => b.playerId === player.id)!.payout! > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isTie ? 'PUSH (±0)' : (
                        <>
                          {session.currentDuel.bets.find(b => b.playerId === player.id)!.payout! > 0 ? '+' : ''}
                          {session.currentDuel.bets.find(b => b.playerId === player.id)!.payout}
                        </>
                      )} 🪙
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const styles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
`
