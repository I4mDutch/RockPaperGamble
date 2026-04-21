import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { XCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ToastType } from '@/store/toastStore'

// Utility for cleaner tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onRemove: (id: string) => void
}

const toastConfig = {
  error: {
    icon: XCircle,
    borderColor: 'border-red-500',
    iconColor: 'text-red-400',
    progressColor: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-orange-500',
    iconColor: 'text-orange-400',
    progressColor: 'bg-orange-500',
  },
  success: {
    icon: CheckCircle,
    borderColor: 'border-emerald-500',
    iconColor: 'text-emerald-400',
    progressColor: 'bg-emerald-500',
  },
  info: {
    icon: Info,
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-400',
    progressColor: 'bg-blue-500',
  },
}

export const Toast = ({ id, type, title, message, duration = 5000, onRemove }: ToastProps) => {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)
  const config = toastConfig[type]
  const Icon = config.icon

  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration

    const updateProgress = () => {
      const now = Date.now()
      const remaining = endTime - now
      const percentage = Math.max(0, (remaining / duration) * 100)
      setProgress(percentage)

      if (now < endTime && !isExiting) {
        requestAnimationFrame(updateProgress)
      }
    }

    const animationFrame = requestAnimationFrame(updateProgress)

    return () => cancelAnimationFrame(animationFrame)
  }, [duration, isExiting])

  const handleRemove = () => {
    setIsExiting(true)
    // Wait for exit animation before actually removing
    setTimeout(() => onRemove(id), 300)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: '100%' }}
      animate={isExiting ? { opacity: 0, x: '100%' } : { opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-xl',
        'bg-slate-800/90 backdrop-blur-xl',
        'border-l-4 shadow-xl',
        config.borderColor
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('shrink-0 mt-0.5', config.iconColor)}>
            <Icon size={20} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
            {message && (
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">{message}</p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleRemove}
            className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50">
        <motion.div
          className={cn('h-full', config.progressColor)}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>
    </motion.div>
  )
}
