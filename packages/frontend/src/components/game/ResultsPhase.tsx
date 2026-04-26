import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Coins, Timer } from 'lucide-react'
import { Avatar } from '../common/Avatar'

export const ResultsPhase = () => {
  const { session } = useGameStore()
  const { user, guestUser } = useAuthStore()
  if (!session) return null

  const userId = user?.id || guestUser?.id
  const winnerId = session.currentDuel?.winnerId
  const isTie = winnerId === 'draw'

  return (
    <>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
      <div className="w-full max-w-4xl space-y-10 animate-in zoom-in fade-in duration-700">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block px-5 py-2 rounded-full" style={{ background: isTie ? 'var(--color-bg-surface)' : 'rgba(124,58,237,0.08)', border: `1px solid ${isTie ? 'var(--color-border)' : 'rgba(124,58,237,0.2)'}` }}>
            <span className="font-bold tracking-widest uppercase text-[10px]" style={{ color: isTie ? 'var(--color-text-muted)' : 'var(--color-accent-primary)' }}>
              {isTie ? 'NO WINNER — BETS RETURNED' : 'Match Concluded'}
            </span>
          </div>
          <h2 className="heading-display text-responsive-5xl">
            {isTie ? 'TIE' : <span className="text-gradient">RESULTS</span>}
          </h2>
          <div className="flex items-center justify-center gap-2.5">
            <Timer size={16} className="animate-spin-slow" style={{ color: 'var(--color-accent-pop)' }} />
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Next match in {session.timeLeft}s</span>
          </div>
        </div>

        {/* Player Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {session.players.sort((a, b) => b.coins - a.coins).map((player, idx) => {
            const isMe = player.id === userId
            const bet = session.currentDuel?.bets.find(b => b.playerId === player.id)

            return (
              <div
                key={player.id}
                className="card-modern flex items-center justify-between transition-all duration-500 relative"
                style={{
                  borderColor: isMe ? 'rgba(124,58,237,0.3)' : 'var(--color-border)',
                  transform: isMe ? 'scale(1.02)' : 'none',
                  opacity: isMe ? 1 : 0.8,
                }}
              >
                {/* Win/Loss Badge for Duelists */}
                {(player.role === 'challenger' || player.role === 'challengee') && !isTie && winnerId && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg z-10" style={{ 
                    background: winnerId === player.id ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                    color: 'white',
                    border: '2px solid var(--color-bg-page)'
                  }}>
                    {winnerId === player.id ? 'Match Won' : 'Match Loss'}
                  </div>
                )}

                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar url={player.avatarUrl} name={player.displayName} size="lg" color={player.avatarColor} />
                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontFamily: '"JetBrains Mono", monospace' }}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate-safe text-base" style={{ fontFamily: '"Outfit", system-ui, sans-serif', color: 'var(--color-text-primary)' }}>{player.displayName}</p>
                      {isMe && <span className="pill pill-primary text-[8px]">You</span>}
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{player.role}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-0">
                  <div className="flex items-center justify-end gap-2">
                    <Coins size={16} style={{ color: 'var(--color-accent-pop)' }} />
                    <span className="text-currency text-xl" style={{ color: 'var(--color-text-primary)' }}>
                      {player.coins.toLocaleString()}
                    </span>
                  </div>
                  {bet && (
                    <div className="text-xs font-bold mt-0.5" style={{
                      color: isTie ? 'var(--color-text-muted)' : bet.payout! > 0 ? 'var(--color-accent-success)' : 'var(--color-accent-danger)',
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>
                      {isTie ? '±0' : <>{bet.payout! > 0 ? '+' : ''}{bet.payout!.toLocaleString()}</>} 🪙
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
