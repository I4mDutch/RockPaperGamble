import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, UserMinus, CheckCircle, Coins, Trophy, Gift, Play, type LucideIcon, Flag, Zap
} from 'lucide-react'
import type { GameEvent } from '@rpg/shared'

interface EventConfig {
  icon: LucideIcon
  label: string
  accentColor: string
  bgColor: string
  iconColor: string
}

const eventConfigs: Record<GameEvent['type'], EventConfig> = {
  join:  { icon: UserPlus,   label: 'Joined',  accentColor: 'var(--color-accent-secondary)', bgColor: 'rgba(6,182,212,0.06)',   iconColor: 'var(--color-accent-secondary)' },
  leave: { icon: UserMinus,  label: 'Left',     accentColor: 'var(--color-border)',           bgColor: 'var(--color-bg-surface)', iconColor: 'var(--color-text-muted)' },
  ready: { icon: CheckCircle, label: 'Ready',    accentColor: 'var(--color-accent-success)',  bgColor: 'rgba(16,185,129,0.06)',   iconColor: 'var(--color-accent-success)' },
  bet:   { icon: Coins,      label: 'Bet',      accentColor: 'var(--color-accent-pop)',       bgColor: 'rgba(245,158,11,0.06)',   iconColor: 'var(--color-accent-pop)' },
  win:   { icon: Trophy,     label: 'Winner',   accentColor: 'var(--color-accent-pop)',       bgColor: 'rgba(245,158,11,0.06)',   iconColor: 'var(--color-accent-pop)' },
  gift:  { icon: Gift,       label: 'Gift',     accentColor: 'var(--color-accent-primary)',   bgColor: 'rgba(124,58,237,0.06)',   iconColor: 'var(--color-accent-primary)' },
  start: { icon: Play,       label: 'Start',    accentColor: 'var(--color-accent-primary)',   bgColor: 'rgba(124,58,237,0.06)',   iconColor: 'var(--color-accent-primary)' },
  item:  { icon: Zap,        label: 'Item',     accentColor: 'var(--color-accent-primary)',   bgColor: 'rgba(124,58,237,0.06)',   iconColor: 'var(--color-accent-primary)' },
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 1000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

const EventItem = ({ event, index }: { event: GameEvent; index: number }) => {
  const config = eventConfigs[event.type]
  const Icon = config.icon
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(event.timestamp))

  useEffect(() => {
    const interval = setInterval(() => setRelativeTime(formatRelativeTime(event.timestamp)), 10000)
    return () => clearInterval(interval)
  }, [event.timestamp])

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="relative overflow-hidden p-3.5 rounded-xl transition-all"
      style={{ background: config.bgColor, border: '1px solid var(--color-border)' }}
    >
      {/* Left accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: config.accentColor }} />

      <div className="flex flex-col gap-1 ml-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg" style={{ color: config.iconColor }}>
            <Icon size={12} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: config.iconColor }}>
            {config.label}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed truncate-safe" style={{ color: 'var(--color-text-primary)' }}>
          {event.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)', fontFamily: '"JetBrains Mono", monospace' }}>
            {formatTimestamp(event.timestamp)}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-border)' }}>•</span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{relativeTime}</span>
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
  const displayedEvents = Array.isArray(events) ? [...events].reverse().slice(0, maxEvents) : []

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [events, shouldAutoScroll])

  return (
    <div className="card-modern flex flex-col h-[420px] overflow-hidden" style={{ padding: 0 }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-accent-primary)' }} />
          <h3 className="font-semibold text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Event Feed</h3>
        </div>
        <span className="pill pill-muted text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {events.length}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        onScroll={(e) => {
          const t = e.currentTarget
          setShouldAutoScroll(t.scrollTop <= 50)
        }}
      >
        <AnimatePresence initial={false}>
          {displayedEvents.length > 0 ? (
            displayedEvents.map((event, idx) => (
              <EventItem key={event.id} event={event} index={idx} />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border)' }}>
                <Flag size={16} style={{ color: 'var(--color-border)' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Waiting for events...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
