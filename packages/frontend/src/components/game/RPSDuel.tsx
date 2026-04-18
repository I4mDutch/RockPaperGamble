import { useState } from 'react'
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

  return (
    <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-4">
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

      {isDuelist && selected && (
        <div className="text-center animate-pulse">
          <p className="text-brand-primary font-black italic tracking-widest uppercase">Choice Locked. Waiting for opponent...</p>
        </div>
      )}
    </div>
  )
}
