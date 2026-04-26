import { useGameStore } from '@/store/gameStore'
import { ChallengeSelector } from './ChallengeSelector'
import { BettingPhase } from './BettingPhase'
import { RPSDuel } from './RPSDuel'
import { ResultsPhase } from './ResultsPhase'
import { EventFeed } from './EventFeed'
import { Trophy } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { WaveBackground } from '../ui/WaveBackground'

export const GameScreen = () => {
  const { session } = useGameStore()
  if (!session) return null

  const renderPhase = () => {
    switch (session.phase) {
      case 'CHALLENGE_SELECT': return <ChallengeSelector />
      case 'BETTING': return <BettingPhase />
      case 'RPS_ROUND': return <RPSDuel />
      case 'RESULTS': return <ResultsPhase />
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--color-accent-primary)' }} />
            <p className="font-semibold uppercase tracking-[0.3em] text-xs" style={{ color: 'var(--color-text-muted)' }}>Waiting for {session.phase}...</p>
          </div>
        )
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row gap-6 p-4 lg:p-8 overflow-x-hidden relative">
      <WaveBackground />
      {/* Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-5 order-2 lg:order-1">
        <EventFeed events={session.eventFeed} />
        
        <div className="card-modern space-y-5">
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Trophy size={16} style={{ color: 'var(--color-accent-pop)' }} />
            <h3 className="heading-display text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Leaderboard</h3>
          </div>
          <div className="space-y-4">
            {session.players.sort((a, b) => b.coins - a.coins).map((player, idx) => (
              <div key={player.id} className="flex items-center gap-3 group">
                <span className="text-[10px] font-black w-4 shrink-0" style={{ color: idx === 0 ? 'var(--color-accent-pop)' : '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>{idx + 1}</span>
                <Avatar url={player.avatarUrl} name={player.displayName} size="sm" color={player.avatarColor} />
                <span className="flex-1 text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{player.displayName}</span>
                <span className="text-currency text-xs shrink-0" style={{ color: 'var(--color-accent-pop)', fontSize: '0.8rem' }}>{player.coins.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2 min-h-[400px]">
        {renderPhase()}
      </main>
    </div>
  )
}
