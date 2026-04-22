import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  UserMinus,
  CheckCircle,
  Coins,
  Trophy,
  Gift,
  Play,
  type LucideIcon,
  Flag
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { GameEvent } from '@rpg/shared'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface EventConfig {
  icon: LucideIcon
  label: string
  accentColor: string
  bgColor: string
  borderColor: string
  iconColor: string
}

const eventConfigs: Record<GameEvent['type'], EventConfig> = {
  join: {
    icon: UserPlus,
    label: 'Joined',
    accentColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  leave: {
    icon: UserMinus,
    label: 'Left',
    accentColor: 'border-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    iconColor: 'text-slate-400',
  },
  ready: {
    icon: CheckCircle,
    label: 'Ready',
    accentColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  bet: {
    icon: Coins,
    label: 'Bet',
    accentColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
  win: {
    icon: Trophy,
    label: 'Winner',
    accentColor: 'border-brand-accent',
    bgColor: 'bg-brand-accent/10',
    borderColor: 'border-brand-accent/20',
    iconColor: 'text-brand-accent',
  },
  gift: {
    icon: Gift,
    label: 'Gift',
    accentColor: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  start: {
    icon: Play,
    label: 'Start',
    accentColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    iconColor: 'text-red-400',
  },
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp
  if (diff < 1000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const EventItem = ({ event, index }: { event: GameEvent; index: number }) => {
  const config = eventConfigs[event.type]
  const Icon = config.icon
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(event.timestamp))

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(event.timestamp))
    }, 10000)
    return () => clearInterval(interval)
  }, [event.timestamp])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden p-4 rounded-2xl border transition-all hover:bg-slate-800/60',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Accent stripe */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 border-l-2', config.accentColor)} />

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg bg-slate-900/50', config.iconColor)}>
              <Icon size={14} />
            </div>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.iconColor)}>
              {config.label}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-200 font-medium leading-relaxed">
          {event.message}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-mono text-slate-500">
            {formatTimestamp(event.timestamp)}
          </span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">{relativeTime}</span>
        </div>
      </div>
    </motion.div>
  )
}

interface EventFeedProps {
  events?: GameEvent[]
  maxEvents?: number
}

export const EventFeed = ({ events = [], maxEvents = 50 }: EventFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Limit events to maxEvents
  const displayedEvents = Array.isArray(events) ? events.slice(-maxEvents) : []

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [events, shouldAutoScroll])

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 flex flex-col h-[500px] overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
          <h3 className="font-bold text-white tracking-tight">Live Event Feed</h3>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-slate-900/50 border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {events.length} Events
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600 transition-colors"
        onScroll={(e) => {
          const target = e.currentTarget
          const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
          setShouldAutoScroll(isAtBottom)
        }}
      >
        <AnimatePresence initial={false}>
          {displayedEvents.length > 0 ? (
            displayedEvents.map((event, idx) => (
              <EventItem key={event.id} event={event} index={idx} />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 flex items-center justify-center">
                <Flag size={20} className="opacity-20" />
              </div>
              <p className="text-sm italic">Waiting for events...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
