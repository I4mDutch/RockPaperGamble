import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleDot, FileText, Scissors, ChevronDown, ChevronUp, History } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface RoundHistoryEntry {
  roundNumber: number
  player1Name: string
  player1Choice: 'rock' | 'paper' | 'scissors'
  player2Name: string
  player2Choice: 'rock' | 'paper' | 'scissors'
  winnerName: string | 'tie'
}

interface RoundHistoryProps {
  rounds: RoundHistoryEntry[]
  maxDisplay?: number
}

const ChoiceIcon = ({ choice, className }: { choice: 'rock' | 'paper' | 'scissors'; className?: string }) => {
  const iconProps = { size: 16, className: cn('shrink-0', className) }

  switch (choice) {
    case 'rock':
      return <CircleDot {...iconProps} />
    case 'paper':
      return <FileText {...iconProps} />
    case 'scissors':
      return <Scissors {...iconProps} />
    default:
      return null
  }
}

const ChoiceBadge = ({ choice }: { choice: 'rock' | 'paper' | 'scissors' }) => {
  const colors = {
    rock: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    paper: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    scissors: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider',
        colors[choice]
      )}
    >
      <ChoiceIcon choice={choice} />
      <span>{choice}</span>
    </div>
  )
}

export const RoundHistory = ({ rounds, maxDisplay = 10 }: RoundHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const displayedRounds = rounds.slice(-maxDisplay).reverse()

  if (rounds.length === 0) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <History size={18} />
          <span className="text-sm font-medium">No rounds played yet</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History size={20} className="text-brand-primary" />
          <span className="font-black italic text-white tracking-tight">ROUND HISTORY</span>
          <span className="text-xs font-bold text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-full">
            {rounds.length}
          </span>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Round List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="p-2 space-y-1">
                {displayedRounds.map((round) => {
                  const isTie = round.winnerName === 'tie'
                  const isPlayer1Winner = !isTie && round.winnerName === round.player1Name
                  const isPlayer2Winner = !isTie && round.winnerName === round.player2Name

                  return (
                    <div
                      key={round.roundNumber}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-white/5 hover:border-white/10 transition-all"
                    >
                      {/* Round Number */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg">
                        <span className="text-xs font-black text-slate-400">#{round.roundNumber}</span>
                      </div>

                      {/* Player 1 */}
                      <div className={cn('flex-1 min-w-0', isPlayer1Winner && 'text-brand-accent')}>
                        <p
                          className={cn(
                            'text-sm font-bold truncate',
                            isPlayer1Winner ? 'text-brand-accent' : 'text-slate-300'
                          )}
                        >
                          {round.player1Name}
                        </p>
                        <div className="mt-1">
                          <ChoiceBadge choice={round.player1Choice} />
                        </div>
                      </div>

                      {/* VS / Winner Indicator */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        {isTie ? (
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Tie</span>
                        ) : (
                          <>
                            <span className="text-xs font-black text-slate-600 uppercase">VS</span>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand-accent/20">
                              <span className="text-brand-accent text-xs">▶</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Player 2 */}
                      <div className={cn('flex-1 min-w-0 text-right', isPlayer2Winner && 'text-brand-accent')}>
                        <p
                          className={cn(
                            'text-sm font-bold truncate',
                            isPlayer2Winner ? 'text-brand-accent' : 'text-slate-300'
                          )}
                        >
                          {round.player2Name}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <ChoiceBadge choice={round.player2Choice} />
                        </div>
                      </div>

                      {/* Winner Highlight */}
                      {!isTie && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-brand-accent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            {rounds.length > maxDisplay && (
              <div className="px-4 py-2 bg-slate-900/50 border-t border-white/5">
                <p className="text-xs text-slate-500 text-center">
                  Showing last {maxDisplay} of {rounds.length} rounds
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RoundHistory
