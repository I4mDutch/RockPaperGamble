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
    socket?.send(JSON.stringify({ type: 'LOCK_CHOICE', choice }))
  }

  const choices: { type: RPSChoice; emoji: string; bg: string; border: string; shadowColor: string }[] = [
    { type: 'rock', emoji: '🪨', bg: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,68,68,0.15))', border: 'rgba(239,68,68,0.4)', shadowColor: 'rgba(239,68,68,0.3)' },
    { type: 'paper', emoji: '📄', bg: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(59,130,246,0.15))', border: 'rgba(59,130,246,0.4)', shadowColor: 'rgba(59,130,246,0.3)' },
    { type: 'scissors', emoji: '✂️', bg: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(16,185,129,0.15))', border: 'rgba(16,185,129,0.4)', shadowColor: 'rgba(16,185,129,0.3)' },
  ]

  const challenger = session.players.find(p => p.id === session.currentDuel?.challengerId)
  const challengee = session.players.find(p => p.id === session.currentDuel?.challengeeId)
  const duel = session.currentDuel
  const lastRound = duel?.rounds[duel.rounds.length - 1]
  const isRoundResolved = !!lastRound?.winner

  useEffect(() => { if (!isRoundResolved) setSelected(null) }, [isRoundResolved])

  const getRoundResult = () => {
    if (!lastRound?.winner) return null
    if (lastRound.winner === 'tie') return { text: 'TIE!', color: 'var(--color-accent-pop)' }
    if (lastRound.winner === userId) return { text: 'ROUND WON!', color: 'var(--color-accent-success)' }
    if (isDuelist) return { text: 'ROUND LOST!', color: 'var(--color-accent-danger)' }
    const winnerName = session.players.find(p => p.id === lastRound.winner)?.displayName
    return { text: `${winnerName} WON ROUND!`, color: 'var(--color-accent-primary)' }
  }

  const result = getRoundResult()

  return (
    <div className="w-full max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-4">
        {duel && (
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="pill pill-primary text-sm font-black tracking-widest uppercase">
              Round {Math.max(1, duel.rounds.length)}
            </div>
            
            <div className="flex items-center justify-between w-full max-w-lg gap-8">
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <span className="font-black uppercase truncate text-center w-full" style={{ color: 'var(--color-text-primary)' }}>{challenger?.displayName}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: duel.targetWins }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full transition-all duration-500" style={{
                      background: i < (duel.seriesScore[challenger?.id || ''] || 0) ? 'var(--color-accent-primary)' : 'var(--color-border)',
                      boxShadow: i < (duel.seriesScore[challenger?.id || ''] || 0) ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                      border: `1px solid ${i < (duel.seriesScore[challenger?.id || ''] || 0) ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                    }} />
                  ))}
                </div>
              </div>
              <div className="text-4xl font-black italic shrink-0" style={{ color: 'var(--color-border)' }}>VS</div>
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <span className="font-black uppercase truncate text-center w-full" style={{ color: 'var(--color-text-primary)' }}>{challengee?.displayName}</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: duel.targetWins }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full transition-all duration-500" style={{
                      background: i < (duel.seriesScore[challengee?.id || ''] || 0) ? 'var(--color-accent-secondary)' : 'var(--color-border)',
                      boxShadow: i < (duel.seriesScore[challengee?.id || ''] || 0) ? '0 0 12px rgba(6,182,212,0.4)' : 'none',
                      border: `1px solid ${i < (duel.seriesScore[challengee?.id || ''] || 0) ? 'var(--color-accent-secondary)' : 'var(--color-border)'}`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="heading-display text-4xl" style={{ color: 'var(--color-text-primary)' }}>
          {isDuelist ? 'CHOOSE YOUR WEAPON' : 'DUEL IN PROGRESS'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {isDuelist ? 'Victory belongs to the swift and the brave.' : 'Watch the duelists battle for supremacy.'}
        </p>
        <div className="flex items-center justify-center gap-2" style={{ color: 'var(--color-accent-pop)' }}>
          <Timer size={20} className="animate-pulse" /><span className="text-xl font-black">{session.timeLeft}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {choices.map((choice) => (
          <button
            key={choice.type}
            disabled={!isDuelist || selected !== null}
            onClick={() => handleChoice(choice.type)}
            className="relative aspect-square rounded-3xl p-1 transition-all duration-300 transform"
            style={{
              cursor: isDuelist && selected === null ? 'pointer' : 'default',
              transform: selected === choice.type ? 'scale(1.05) translateY(-16px)' : 'none',
              opacity: selected !== null && selected !== choice.type ? 0.4 : 1,
              filter: selected !== null && selected !== choice.type ? 'grayscale(0.5)' : 'none',
            }}
          >
            <div className="w-full h-full rounded-3xl flex flex-col items-center justify-center gap-4 backdrop-blur-md" style={{
              background: choice.bg,
              border: `2px solid ${selected === choice.type ? 'var(--color-accent-primary)' : choice.border}`,
              boxShadow: selected === choice.type ? '0 12px 40px rgba(124,58,237,0.2)' : `0 8px 32px ${choice.shadowColor}`,
            }}>
              <span className="text-8xl filter drop-shadow-lg">{choice.emoji}</span>
              <span className="text-xl font-black uppercase tracking-tighter" style={{ color: 'var(--color-text-primary)', fontFamily: '"Outfit",system-ui,sans-serif' }}>{choice.type}</span>
            </div>
            {selected === choice.type && (
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center animate-in zoom-in" style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: 'var(--shadow-btn)' }}>
                <span className="text-lg font-black">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {isDuelist && selected && !isRoundResolved && (
        <div className="text-center animate-pulse">
          <p className="font-black tracking-widest uppercase" style={{ color: 'var(--color-accent-primary)' }}>Choice Locked. Waiting for opponent...</p>
        </div>
      )}

      {/* Round Result Overlay */}
      <AnimatePresence>
        {isRoundResolved && result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="p-12 rounded-3xl flex flex-col items-center gap-8 text-center max-w-lg w-full" style={{ background: 'var(--color-bg-page)', border: '2px solid var(--color-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.15)' }}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-6xl font-black tracking-tighter" style={{ color: result.color, fontFamily: '"Outfit",system-ui,sans-serif' }}>
                {result.text}
              </motion.div>
              <div className="flex gap-12 items-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-8xl">{lastRound?.challengerChoice === 'rock' ? '🪨' : lastRound?.challengerChoice === 'paper' ? '📄' : '✂️'}</span>
                  <span className="font-bold uppercase text-xs" style={{ color: 'var(--color-text-muted)' }}>{challenger?.displayName}</span>
                </div>
                <div className="text-4xl font-black italic" style={{ color: 'var(--color-border)' }}>VS</div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-8xl">{lastRound?.challengeeChoice === 'rock' ? '🪨' : lastRound?.challengeeChoice === 'paper' ? '📄' : '✂️'}</span>
                  <span className="font-bold uppercase text-xs" style={{ color: 'var(--color-text-muted)' }}>{challengee?.displayName}</span>
                </div>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 3, ease: "linear" }} className="h-full" style={{ background: 'var(--gradient-primary)' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
