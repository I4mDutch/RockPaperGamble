import { useGameStore } from '@/store/gameStore'
import { History, Swords } from 'lucide-react'

export const RoundHistory = () => {
  const { session } = useGameStore()
  
  if (!session?.roundHistory || session.roundHistory.length === 0) return null

  const formatChoice = (choice?: string) => {
    if (!choice) return '🤔'
    switch (choice) {
      case 'rock': return '✊'
      case 'paper': return '✋'
      case 'scissors': return '✌️'
      default: return '🤔'
    }
  }

  const getPlayerName = (id: string) => {
    return session.players.find(p => p.id === id)?.displayName || 'Unknown'
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <History className="text-brand-secondary" size={20} />
        <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">
          Round History
        </h3>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
        {[...session.roundHistory].reverse().map((round) => (
          <div 
            key={round.roundNumber}
            className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3"
          >
            {/* Round Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Round {round.roundNumber}
                </span>
              </div>              
              <span className="text-xs text-slate-600">
                {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {/* Matchup */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{formatChoice(round.challengerChoice)}</div>
                <p className="text-xs text-slate-400 truncate">
                  {getPlayerName(round.challengerId)}
                </p>
              </div>
              
              <div className="text-slate-600">
                <span className="text-lg">VS</span>
              </div>
              
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{formatChoice(round.challengeeChoice)}</div>
                <p className="text-xs text-slate-400 truncate">
                  {getPlayerName(round.challengeeId)}
                </p>
              </div>
            </div>
            
            {/* Result */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-slate-500">
                {round.winner === 'tie' ? (
                  <span className="text-slate-400">Tie</span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    {getPlayerName(round.winner)} Wins
                  </span>
                )}
              </span>
              
              <span className="text-brand-accent font-black">
                {round.prizePool.toLocaleString()} 🪙
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {session.roundHistory.length >= 10 && (
        <p className="text-xs text-center text-slate-500 italic">
          Showing last 10 rounds
        </p>
      )}
    </div>
  )
}