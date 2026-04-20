import { useEffect, useState } from 'react'

interface CoinAnimationProps {
  amount: number
  onComplete?: () => void
}

export const CoinAnimation = ({ amount, onComplete }: CoinAnimationProps) => {
  const [coins, setCoins] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Generate coin positions
    const newCoins = Array.from({ length: Math.min(10, Math.floor(amount / 100) + 3) }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // Random spread
      y: Math.random() * 100 - 50,
      delay: Math.random() * 0.3,
    }))
    setCoins(newCoins)

    // Hide after animation
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, 1500)

    return () => clearTimeout(timer)
  }, [amount, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute animate-bounce"
            style={{
              left: `${coin.x}px`,
              top: `${coin.y}px`,
              animationDelay: `${coin.delay}s`,
              animationDuration: '0.6s',
            }}
          >
            <span className="text-3xl">🪙</span>
          </div>
        ))}
        <div className="text-2xl font-black text-brand-accent mt-16 animate-in fade-in zoom-in duration-300">
          +{amount.toLocaleString()} 🪙
        </div>
      </div>
    </div>
  )
}

// Hook to trigger coin animation
export function useCoinAnimation() {
  const [activeAnimation, setActiveAnimation] = useState<{ amount: number; id: number } | null>(null)

  const triggerAnimation = (amount: number) => {
    setActiveAnimation({ amount, id: Date.now() })
  }

  const clearAnimation = () => {
    setActiveAnimation(null)
  }

  return {
    activeAnimation,
    triggerAnimation,
    clearAnimation,
    CoinAnimationComponent: activeAnimation ? (
      <CoinAnimation
        key={activeAnimation.id}
        amount={activeAnimation.amount}
        onComplete={clearAnimation}
      />
    ) : null,
  }
}