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
  const [inputValue, setInputValue] = useState('10000')
  const [isEditing, setIsEditing] = useState(false)

  const currentUserId = user?.id || guestUser?.id
  const isHost = session?.hostId === currentUserId

  useEffect(() => {
    if (session?.settings && !isEditing) {
      setInputValue(session.settings.startingMoney.toString())
    }
  }, [session?.settings, isEditing])

  if (!isOpen || !session) return null

  const canEdit = session.status === 'lobby' && isHost
  const startingMoney = parseInt(inputValue) || 100
  const modifiers = getBalanceModifiers(startingMoney)

  const handleSliderChange = (val: number) => {
    setInputValue(val.toString())
    updateSettings({ startingMoney: val })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(val)
    const num = parseInt(val) || 0
    if (num >= 100 && num <= 1000000) {
      updateSettings({ startingMoney: num })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-800 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center"><Settings className="text-brand-primary" size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Game Settings</h2>
              <p className="text-xs text-slate-500">Configure match options</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Starting Money</label>
              <span className="text-lg font-black text-brand-accent">{formatMoney(startingMoney)}</span>
            </div>
            <input type="range" min="100" max="1000000" step="100" value={startingMoney} onChange={(e) => handleSliderChange(parseInt(e.target.value))} disabled={!canEdit} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed accent-brand-primary" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input type="text" value={inputValue} onChange={handleInputChange} onFocus={() => setIsEditing(true)} onBlur={() => { setIsEditing(false); const final = Math.max(100, Math.min(1000000, startingMoney)); setInputValue(final.toString()); updateSettings({ startingMoney: final }); }} disabled={!canEdit} className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-center font-bold focus:outline-none focus:border-brand-primary disabled:opacity-50" />
            </div>
          </div>

          {modifiers.highStakes && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
              <div className="flex items-center gap-2 text-orange-500"><AlertTriangle size={16} /><span className="text-sm font-bold">High-Stakes Mode Enabled</span></div>
              <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-orange-500/20">
                <div className="flex justify-between"><span>Win Modifier:</span><span className={modifiers.win >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{modifiers.win > 0 ? '+' : ''}{(modifiers.win * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span>Loss Modifier:</span><span className={modifiers.loss >= 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{modifiers.loss > 0 ? '+' : ''}{(modifiers.loss * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
