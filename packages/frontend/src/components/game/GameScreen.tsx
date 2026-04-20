import { useGameStore } from '@/store/gameStore'
import { ChallengeSelector } from './ChallengeSelector'
import { BettingPhase } from './BettingPhase'
import { RPSDuel } from './RPSDuel'
import { ResultsPhase } from './ResultsPhase'
import { Trophy, TrendingUp } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { RoundHistory } from './RoundHistory'
import { EventFeed } from './EventFeed'
import { formatMoney } from '@/lib/utils'

export const GameScreen = () => {
  const { session } = useGameStore()

  if (!session) return null

  const renderPhase = () => {
    switch (session.phase) {
      case 'CHALLENGE_SELECT':
        return <ChallengeSelector />
      case 'BETTING':
        return <BettingPhase />
      case 'RPS_ROUND':
        return <RPSDuel />
      case 'RESULTS':
        return <ResultsPhase />
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-slate-400 font-bold italic animate-pulse uppercase tracking-widest">
              Waiting for {session.phase}...
            </p>
          </div>
        )
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 lg:p-12 bg-slate-900 overflow-x-hidden">
      {/* Sidebar: Leaderboard & Stats */}
      <aside className="w-full lg:w-80 flex flex-col gap-4 lg:gap-6 order-2 lg:order-1">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Trophy className="text-brand-accent" size={20} />
            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">
              Leaderboard
            </h3>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {session.players.sort((a, b) => b.coins - a.coins).map((player, idx) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className={`
                  text-xs font-black w-4
                  ${idx === 0 ? 'text-yellow-400' : 
                    idx === 1 ? 'text-slate-300' : 
                    idx === 2 ? 'text-orange-400' : 'text-slate-600'}
                `}>
                  {idx + 1}
                </span>
                <Avatar 
                  url={player.avatarUrl} 
                  name={player.displayName} 
                  size="sm" 
                  color={player.avatarColor}
                  initials={player.initials}
                />
                <span className="flex-1 text-sm font-bold text-white truncate">
                  {player.displayName}
                </span>
                <span className="text-sm font-black text-brand-accent">
                  {formatMoney(player.coins)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-400">
            <TrendingUp size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Global Pool</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">
            {formatMoney(session.players.reduce((acc, p) => acc + p.coins, 0))} 
            <span className="text-brand-accent text-xl sm:text-2xl">🪙</span>
          </p>
        </div>
        
        {/* Round History */}
        <RoundHistory />
        
        {/* Event Feed */}
        <EventFeed />
      </aside>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2 min-h-[50vh]">
        {renderPhase()}
      </main>
    </div>
  )
}
