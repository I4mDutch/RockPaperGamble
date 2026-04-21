import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  UserMinus,
  CheckCircle,
  Coins,
  Trophy,
  Flag,
  Play,
  type LucideIcon,
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface GameEvent {
  id: string
  type:
    | 'PLAYER_JOINED'
    | 'PLAYER_LEFT'
    | 'PLAYER_READY'
    | 'BET_PLACED'
    | 'PLAYER_WON'
    | 'ROUND_COMPLETED'
    | 'GAME_STARTED'
  playerName: string
  message: string
  timestamp: number
  metadata?: any
}

interface EventFeedProps {
  events: GameEvent[]
  maxEvents?: number
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
  PLAYER_JOINED: {
    icon: UserPlus,
    label: 'Joined',
    accentColor: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  PLAYER_LEFT: {
    icon: UserMinus,
    label: 'Left',
    accentColor: 'border-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    iconColor: 'text-slate-400',
  },
  PLAYER_READY: {
    icon: CheckCircle,
    label: 'Ready',
    accentColor: 'border-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  BET_PLACED: {
    icon: Coins,
    label: 'Bet',
    accentColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
  PLAYER_WON: {
    icon: Trophy,
    label: 'Winner',
    accentColor: 'border-brand-accent',
    bgColor: 'bg-brand-accent/10',
    borderColor: 'border-brand-accent/20',
    iconColor: 'text-brand-accent',
  },
  ROUND_COMPLETED: {
    icon: Flag,
    label: 'Round',
    accentColor: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  GAME_STARTED: {
    icon: Play,
    label: 'Start',
    accentColor: 'border-brand-primary',
    bgColor: 'bg-brand-primary/10',
    borderColor: 'border-brand-primary/20',
    iconColor: 'text-brand-primary',
  },
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return formatTimestamp(timestamp)
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
        'group relative flex items-start gap-3 p-3 rounded-xl',
        'bg-slate-900/30 border border-white/5',
        'hover:bg-slate-900/50 hover:border-white/10',
        'transition-colors duration-200'
      )}
    >
      {/* Left border accent */}
      <div
        className={cn(
          'absolute left-0 top-2 bottom-2 w-1 rounded-l-xl',
          'bg-current opacity-60',
          config.accentColor.replace('border-', 'bg-')
        )}
      />

      {/* Icon container */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg',
          config.bgColor,
          config.borderColor,
          'border'
        )}
      >
        <Icon size={18} className={config.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate">
            {event.playerName}
          </span>
          <span className="text-xs font-medium text-slate-500 flex-shrink-0">
            {config.label}
          </span>
        </div>
        <p className="text-sm text-slate-300 mt-0.5">{event.message}</p>
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

export const EventFeed = ({ events, maxEvents = 50 }: EventFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Limit events to maxEvents
  const displayedEvents = events.slice(-maxEvents)

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [displayedEvents, shouldAutoScroll])

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const isBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsAtBottom(isBottom)
      setShouldAutoScroll(isBottom)
    }
  }

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
      setShouldAutoScroll(true)
      setIsAtBottom(true)
    }
  }

  const hasNewEvents = !isAtBottom && events.length > 0

  return (
    <div
      className={cn(
        'bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10',
        'flex flex-col overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black italic text-white tracking-tight">
            EVENT FEED
          </span>
          <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>
        {events.length > maxEvents && (
          <span className="text-xs text-slate-500">
            Showing last {maxEvents}
          </span>
        )}
      </div>

      {/* Event list container */}
      <div className="relative flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            'h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
            'p-3 space-y-2'
          )}
        >
          <AnimatePresence mode="popLayout">
            {displayedEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-slate-500"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                  <Flag size={20} className="text-slate-600" />
                </div>
                <span className="text-sm font-medium">No events yet</span>
                <span className="text-xs text-slate-600 mt-1">
                  Game events will appear here
                </span>
              </motion.div>
            ) : (
              displayedEvents.map((event, index) => (
                <EventItem
                  key={event.id}
                  event={event}
                  index={Math.min(index, 5)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Scroll to bottom indicator */}
        <AnimatePresence>
          {hasNewEvents && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className={cn(
                'absolute bottom-3 left-1/2 -translate-x-1/2',
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-brand-primary/90 text-white text-xs font-bold',
                'hover:bg-brand-primary transition-colors',
                'shadow-lg shadow-brand-primary/20',
                'z-10'
              )}
            >
              <span>New events</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none" />
        
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-800/50 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default EventFeed
