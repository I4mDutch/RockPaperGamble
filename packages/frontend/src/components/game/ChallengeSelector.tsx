import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Swords, Target, Timer, Coins, Gift } from 'lucide-react'
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
    socket?.send(JSON.stringify({ type: 'SELECT_CHALLENGER', targetId, amount: 0 }))
  }

  const handleGift = () => {
    if (!giftTarget || giftAmount <= 0) return
    socket?.send(JSON.stringify({ type: 'GIFT_COINS', targetId: giftTarget, amount: giftAmount }))
    setGiftTarget(null)
    setGiftAmount(100)
  }

  const otherPlayers = session.players.filter(p => p.id !== userId)

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--color-accent-primary)' }}>
          <Swords size={32} />
        </div>
        <h2 className="heading-display text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          {isBroke ? "YOU'RE BROKE" : isChallenger ? 'PICK YOUR OPPONENT' : 'WAITING FOR CHALLENGE'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {isBroke ? 'You have no coins! Ask someone to gift you some.' : isChallenger ? 'Choose who you want to duel in Rock Paper Scissors.' : 'The active player is currently choosing their target.'}
        </p>
        <div className="flex items-center justify-center gap-2" style={{ color: 'var(--color-accent-primary)' }}>
          <Timer size={20} className="animate-pulse" /><span className="text-lg font-black">{session.timeLeft}s</span>
        </div>
      </div>

      {/* Gift Modal */}
      {giftTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setGiftTarget(null)} />
          <div className="relative w-full max-w-sm rounded-3xl p-8 space-y-6" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
            <h3 className="heading-display text-2xl text-center">Gift Coins</h3>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              Sending to <span className="font-bold" style={{ color: 'var(--color-accent-pop)' }}>{session.players.find(p => p.id === giftTarget)?.displayName}</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setGiftAmount(Math.max(10, giftAmount - 50))} className="w-12 h-12 rounded-xl text-xl font-black transition-all" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>-</button>
              <div className="flex items-center gap-2 rounded-2xl px-6 py-3" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                <Coins size={20} style={{ color: 'var(--color-accent-pop)' }} />
                <input type="number" value={giftAmount} onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))} className="w-24 bg-transparent text-2xl font-black text-center outline-none" style={{ color: 'var(--color-text-primary)' }} />
              </div>
              <button onClick={() => setGiftAmount(Math.min(currentPlayer?.coins || 0, giftAmount + 50))} className="w-12 h-12 rounded-xl text-xl font-black transition-all" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>+</button>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Your balance: {currentPlayer?.coins.toLocaleString()} 🪙</p>
            <div className="flex gap-3">
              <button onClick={() => setGiftTarget(null)} className="flex-1 py-3 font-bold rounded-2xl transition-all" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>Cancel</button>
              <button onClick={handleGift} disabled={giftAmount <= 0 || giftAmount > (currentPlayer?.coins || 0)} className="btn-gradient flex-1 py-3 font-black flex items-center justify-center gap-2">
                <Gift size={18} /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {otherPlayers.map((player) => {
          const playerBroke = player.coins <= 0
          return (
            <div key={player.id} className="relative group">
              <div
                className={`w-full h-full relative p-6 rounded-2xl border bg-white/60 backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  playerBroke ? 'opacity-60 border-transparent' : 'border-white/40 hover:shadow-xl hover:shadow-violet-500/10'
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 rounded-full" />
                  <Avatar url={player.avatarUrl} name={player.displayName} size="xl" color={player.avatarColor} />
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm" style={{
                    background: 'var(--color-bg-page)',
                    color: 'var(--color-text-primary)',
                    border: `2px solid ${playerBroke ? 'var(--color-accent-danger)' : 'var(--color-accent-pop)'}`,
                  }}>
                    {playerBroke ? 'BROKE' : `${player.coins.toLocaleString()} 🪙`}
                  </div>
                </div>

                <div className="text-center w-full">
                  <h3 className="heading-display text-xl truncate px-2" style={{ color: 'var(--color-text-primary)' }}>
                    {player.displayName}
                  </h3>
                  <p className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: playerBroke ? 'var(--color-accent-danger)' : 'var(--color-text-muted)' }}>
                    {playerBroke ? 'Eliminated' : player.role}
                  </p>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-center gap-3 w-full mt-2">
                  {isChallenger && !isBroke && !playerBroke && (
                    <button
                      onClick={() => handleSelect(player.id)}
                      className="btn-gradient flex-1 py-3 text-sm flex items-center justify-center"
                    >
                      <Target size={16} className="mr-2" /> CHALLENGE
                    </button>
                  )}
                  
                  {!isBroke && (
                    <button
                      onClick={() => setGiftTarget(player.id)}
                      className="p-3 rounded-2xl transition-all active:scale-90 bg-white/90 shadow-sm hover:scale-105"
                      style={{ border: '1px solid rgba(16,185,129,0.15)', color: 'var(--color-accent-success)' }}
                      title="Gift coins"
                    >
                      <Gift size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
