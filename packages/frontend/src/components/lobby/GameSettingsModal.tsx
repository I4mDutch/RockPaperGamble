import { useState, useEffect } from 'react'
import { X, Settings, AlertTriangle } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { formatMoney } from '@/lib/utils'
import { getBalanceModifiers } from '@rpg/shared'

interface GameSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GameSettingsModal = ({ isOpen, onClose }: GameSettingsModalProps) => {
  const { session, updateSettings } = useGameStore()
  const { user, guestUser } = useAuthStore()
  const [startingMoney, setStartingMoney] = useState(10000)
  const [inputValue, setInputValue] = useState('10000')
  const [isEditing, setIsEditing] = useState(false)

  const currentUserId = user?.id || guestUser?.id
  const isHost = session?.hostId === currentUserId

  useEffect(() => {
    if (session?.settings && !isEditing) {
      setStartingMoney(session.settings.startingMoney)
      setInputValue(session.settings.startingMoney.toString())
    }
  }, [session?.settings, isEditing])

  if (!isOpen || !session) return null

  // Check if game has started
  const canEdit = session.status === 'lobby' && isHost

  const handleSliderChange = (value: number) => {
    setStartingMoney(value)
    setInputValue(value.toString())
    updateSettings({ startingMoney: value })
  }

  const handleInputFocus = () => {
    setIsEditing(true)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const numValue = parseInt(inputValue) || 100
    const clampedValue = Math.max(100, Math.min(1000000, numValue))
    setStartingMoney(clampedValue)
    setInputValue(clampedValue.toString())
    updateSettings({ startingMoney: clampedValue })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(value)
    
    // Only update server if it's a valid number and we're not just typing
    const numValue = parseInt(value) || 0
    if (numValue >= 100 && numValue <= 1000000) {
      setStartingMoney(numValue)
      // We still update settings but the isEditing flag prevents the useEffect from resetting our typing
      updateSettings({ startingMoney: numValue })
    }
  }

  const modifiers = getBalanceModifiers(startingMoney)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-800 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <Settings className="text-brand-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Game Settings</h2>
              <p className="text-xs text-slate-500">Configure match options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Starting Money Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Starting Money</label>
              <span className="text-lg font-black text-brand-accent">
                {formatMoney(startingMoney)}
              </span>
            </div>

            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="100"
                max="1000000"
                step="100"
                value={startingMoney}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                disabled={!canEdit}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-brand-primary"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>$100</span>
                <span>$500k</span>
                <span>$1M</span>
              </div>
            </div>

            {/* Numeric Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                disabled={!canEdit}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-center font-bold focus:outline-none focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Balance Modifiers Display */}
          {modifiers.highStakes && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle size={16} />
                <span className="text-sm font-bold">High-Stakes Mode Enabled</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Balance modifiers are active for this game mode.</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-500/20">
                  <span className="text-slate-500">Win Modifier:</span>
                  <span className={modifiers.win >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {modifiers.win > 0 ? '+' : ''}{(modifiers.win * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Loss Modifier:</span>
                  <span className={modifiers.loss >= 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {modifiers.loss > 0 ? '+' : ''}{(modifiers.loss * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modifier Legend */}
          <div className="p-4 rounded-2xl bg-slate-900/30 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance Modifiers</p>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>$100 – $999</span>
                <span className="text-emerald-400">Lose -50% • Win +35%</span>
              </div>
              <div className="flex justify-between">
                <span>$1k – $99k</span>
                <span className="text-slate-300">Normal</span>
              </div>
              <div className="flex justify-between">
                <span>$100k – $499k</span>
                <span className="text-orange-400">Lose +25% • Win -15%</span>
              </div>
              <div className="flex justify-between">
                <span>$500k – $1M</span>
                <span className="text-red-400">Lose +50% • Win -35%</span>
              </div>
            </div>
          </div>

          {!canEdit && (
            <p className="text-xs text-center text-slate-500 italic">
              {session.status !== 'lobby' 
                ? 'Settings can only be changed in the lobby'
                : 'Only the host can change game settings'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}