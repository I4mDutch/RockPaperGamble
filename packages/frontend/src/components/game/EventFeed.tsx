import { useGameStore } from '@/store/gameStore'
import { UserPlus, UserMinus, Coins, Trophy, Gift, CheckCircle, Play } from 'lucide-react'
import { useEffect, useRef } from 'react'

export const EventFeed = () => {
  const { session } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  if (!session?.eventFeed) return null

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [session.eventFeed.length])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'join': return <UserPlus size={14} className="text-emerald-400" />
      case 'leave': return <UserMinus size={14} className="text-slate-400" />
      case 'bet': return <Coins size={14} className="text-brand-accent" />
      case 'win': return <Trophy size={14} className="text-yellow-400" />
      case 'gift': return <Gift size={14} className="text-pink-400" />
      case 'ready': return <CheckCircle size={14} className="text-emerald-400" />
      case 'start': return <Play size={14} className="text-brand-primary" />
      default: return null
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'join': return 'text-emerald-400'
      case 'leave': return 'text-slate-400'
      case 'bet': return 'text-brand-accent'
      case 'win': return 'text-yellow-400'
      case 'gift': return 'text-pink-400'
      case 'ready': return 'text-emerald-400'
      case 'start': return 'text-brand-primary'
      default: return 'text-slate-400'
    }
  }

  // Only show last 5 events
  const recentEvents = session.eventFeed.slice(-5)

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-4 space-y-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Event Feed
      </h4>
      
      <div 
        ref={scrollRef}
        className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide"
      >
        {recentEvents.length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-4">
            No events yet
          </p>
        ) : (
          recentEvents.map((event) => (
            <div 
              key={event.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/30 animate-in slide-in-from-right-2 duration-300"
            >
              <div className="shrink-0 w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${getEventColor(event.type)} truncate`}>
                  {event.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}