import { useGameStore } from '@/store/gameStore'

export const GameCountdown = () => {
  const { session } = useGameStore()
  
  if (!session?.countdown || session.countdown <= 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="text-center">
        <p className="text-slate-400 text-lg mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          Game starting in...
        </p>
        <div className="relative">
          <div 
            key={session.countdown}
            className="text-[12rem] font-black text-brand-primary countdown-number"
          >
            {session.countdown}
          </div>
          
          {/* Glow effect behind number */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-brand-primary/30 rounded-full blur-3xl" />
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-sm">Get ready!</span>
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
        </div>
      </div>
    </div>
  )
}