import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameCountdownProps {
  seconds?: number
  onComplete: () => void
}

export const GameCountdown = ({ seconds = 3, onComplete }: GameCountdownProps) => {
  const [showGo, setShowGo] = useState(false)

  useEffect(() => {
    if (seconds === 0 && !showGo) {
      setShowGo(true)
      const timer = setTimeout(() => {
        onComplete()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [seconds, showGo, onComplete])

  const numberVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: {
      scale: [0.5, 1.2, 1.0],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.4, 1],
      },
    },
    exit: { opacity: 0 },
  }

  const goVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: {
      scale: [0.5, 1.3, 1.0, 1.1, 1.0],
      opacity: [0, 1, 1, 1, 0],
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
        times: [0, 0.2, 0.5, 0.7, 1],
      },
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {!showGo ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-8"
            >
              <p className="text-xl font-bold text-white/80 uppercase tracking-widest">
                Game starting in:
              </p>
              <AnimatePresence mode="wait">
                <motion.span
                  key={seconds}
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="font-black italic text-8xl text-brand-primary"
                >
                  {seconds}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              variants={goVariants}
              initial="initial"
              animate="animate"
              className="font-black italic text-8xl text-brand-primary"
            >
              GO!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
