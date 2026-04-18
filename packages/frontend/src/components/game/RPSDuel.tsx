import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Timer } from 'lucide-react'
import type { RPSChoice } from '@rpg/shared'

export const RPSDuel = () => {
  const { session, socket } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const [selected, setSelected] = useState<RPSChoice | null>(null)

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const me = session.players.find(p => p.id === userId)
  const isDuelist = me?.role === 'challenger' || me?.role === 'challengee'

  const handleChoice = (choice: RPSChoice) => {
    setSelected(choice)
    socket?.send(JSON.stringify({
      type: 'LOCK_CHOICE',
      choice
    }))
  }

  const choices: { type: RPSChoice; emoji: string; color: string }[] = [
    { type: 'rock', emoji: '🪨', color: 'from-rose-500 to-rose-700' },
    { type: 'paper', emoji: '📄', color: 'from-blue-500 to-blue-700' },
    { type: 'scissors', emoji: '✂️', color: 'from-emerald-500 to-emerald-700' },
  ]

  const challenger = session.players.find(p => p.id === session.currentDuel?.challengerId)
  const challengee = session.players.find(p => p.id === session.currentDuel?.challengeeId)
  const duel = session.currentDuel
  const lastRound = duel?.rounds[duel.rounds.length - 1]
  const isRoundResolved = !!lastRound?.winner

  // Reset local selection when round changes
  useEffect(() => {
    if (!isRoundResolved) {
      setSelected(null)
    }
  }, [isRoundResolved])

  const getRoundResult = () => {
    if (!lastRound?.winner) return null
    if (lastRound.winner === 'tie') return { text: 'TIE!', color: 'text-amber-400' }
    if (lastRound.winner === userId) return { text: 'ROUND WON!', color: 'text-emerald-400' }
    if (isDuelist) return { text: 'ROUND LOST!', color: 'text-rose-400' }
    
    const winnerName = session.players.find(p => p.id === lastRound.winner)?.displayName
    return { text: `${winnerName} WON ROUND!`, color: 'text-brand-primary' }
  }

  const result = getRoundResult()

  return (
    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-4">
        {duel && (
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
              <span className="text-brand-primary font-black italic tracking-widest uppercase text-sm">
                ROUND {duel.rounds.length + 1}
              </span>
            </div>
            
            <div className="flex items-center justify-between w-full max-w-lg gap-8">
              {/* Challenger Score */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-white font-black italic uppercase truncate w-32 text-center">
                  {challenger?.displayName}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: duel.targetWins }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full border border-white/20 transition-all duration-500 ${
                        i < (duel.seriesScore[challenger?.id || ''] || 0) 
                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] scale-110' 
                        : 'bg-white/5'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <div className="text-4xl font-black text-white italic opacity-20">VS</div>

              {/* Challengee Score */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <span className="text-white font-black italic uppercase truncate w-32 text-center">
                  {challengee?.displayName}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: duel.targetWins }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full border border-white/20 transition-all duration-500 ${
                        i < (duel.seriesScore[challengee?.id || ''] || 0) 
                        ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-110' 
                        : 'bg-white/5'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-5xl font-black text-white italic tracking-tighter">
          {isDuelist ? 'CHOOSE YOUR WEAPON' : 'DUEL IN PROGRESS'}
        </h2>
        <p className="text-slate-400">
          {isDuelist ? 'Victory belongs to the swift and the brave.' : 'Watch the duelists battle for supremacy.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-accent">
          <Timer size={20} className="animate-pulse" />
          <span className="text-xl font-black italic">{session.timeLeft}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {choices.map((choice) => (
          <button
            key={choice.type}
            disabled={!isDuelist || selected !== null}
            onClick={() => handleChoice(choice.type)}
            className={`
              relative aspect-square rounded-[2.5rem] p-1 transition-all duration-300 transform
              ${isDuelist && selected === null ? 'hover:scale-105 hover:-translate-y-2 cursor-pointer shadow-2xl' : 'cursor-default'}
              ${selected === choice.type ? 'scale-110 -translate-y-4 ring-4 ring-brand-primary ring-offset-8 ring-offset-slate-900' : 'opacity-80 grayscale-[0.5] hover:grayscale-0'}
            `}
          >
            <div className={`w-full h-full rounded-[2.2rem] bg-linear-to-br ${choice.color} flex flex-col items-center justify-center gap-4 border border-white/20`}>
              <span className="text-8xl filter drop-shadow-2xl">{choice.emoji}</span>
              <span className="text-2xl font-black text-white italic tracking-tighter uppercase">{choice.type}</span>
            </div>
            
            {selected === choice.type && (
              <div className="absolute -top-4 -right-4 bg-brand-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl animate-in zoom-in">
                <span className="text-xl font-black">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {isDuelist && selected && !isRoundResolved && (
        <div className="text-center animate-pulse">
          <p className="text-brand-primary font-black italic tracking-widest uppercase">Choice Locked. Waiting for opponent...</p>
        </div>
      )}

      {/* Round Result Overlay */}
      <AnimatePresence>
        {isRoundResolved && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-2xl p-12 rounded-[3rem] border-4 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 text-center max-w-lg w-full">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-7xl font-black italic tracking-tighter ${result.color}`}
              >
                {result.text}
              </motion.div>
              
              <div className="flex gap-12 items-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-8xl">{lastRound?.challengerChoice === 'rock' ? '🪨' : lastRound?.challengerChoice === 'paper' ? '📄' : '✂️'}</span>
                  <span className="text-white/40 font-bold uppercase text-xs">{challenger?.displayName}</span>
                </div>
                <div className="text-4xl font-black text-white italic opacity-20">VS</div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-8xl">{lastRound?.challengeeChoice === 'rock' ? '🪨' : lastRound?.challengeeChoice === 'paper' ? '📄' : '✂️'}</span>
                  <span className="text-white/40 font-bold uppercase text-xs">{challengee?.displayName}</span>
                </div>
              </div>

              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-brand-primary"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
