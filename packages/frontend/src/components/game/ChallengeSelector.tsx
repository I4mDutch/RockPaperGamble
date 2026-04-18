import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { Swords, Target, Timer } from 'lucide-react'
import { Avatar } from '../common/Avatar'

export const ChallengeSelector = () => {
  const { session, socket } = useGameStore()
  const { user, guestUser } = useAuthStore()

  if (!session) return null

  const userId = user?.id || guestUser?.id
  const isChallenger = session.players.find(p => p.id === userId)?.role === 'challenger'

  const handleSelect = (targetId: string) => {
    if (!isChallenger) return
    socket?.send(JSON.stringify({
      type: 'SELECT_CHALLENGER',
      targetId
    }))
  }

  const otherPlayers = session.players.filter(p => p.id !== userId)

  return (
    <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/20 text-brand-primary mb-2">
          <Swords size={32} />
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">
          {isChallenger ? 'PICK YOUR OPPONENT' : 'WAITING FOR CHALLENGE'}
        </h2>
        <p className="text-slate-400">
          {isChallenger ? 'Choose who you want to duel in Rock Paper Scissors.' : 'The active player is currently choosing their target.'}
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-primary">
          <Timer size={20} className="animate-pulse" />
          <span className="text-lg font-black italic">{session.timeLeft}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => handleSelect(player.id)}
            disabled={!isChallenger}
            className={`
              relative group p-6 rounded-3xl border transition-all duration-300
              ${isChallenger 
                ? 'bg-slate-800/40 border-white/5 hover:border-brand-primary/50 hover:scale-[1.02] cursor-pointer' 
                : 'bg-slate-800/20 border-white/5 opacity-50 cursor-default'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar url={player.avatarUrl} name={player.displayName} size="xl" />
                <div className="absolute -bottom-2 -right-2 bg-brand-accent text-slate-900 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase">
                  {player.coins.toLocaleString()} 🪙
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">{player.displayName}</p>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Spectator</p>
              </div>
            </div>
            
            {isChallenger && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-primary/10 rounded-3xl">
                <div className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl">
                  <Target size={18} />
                  CHALLENGE
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
