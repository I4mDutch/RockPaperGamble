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
    if (session?.settings && !isEditing) setInputValue(session.settings.startingMoney.toString())
  }, [session?.settings, isEditing])

  if (!isOpen || !session) return null

  const canEdit = session.status === 'lobby' && isHost
  const startingMoney = parseInt(inputValue) || 100
  const modifiers = getBalanceModifiers(startingMoney)

  const handleSliderChange = (val: number) => { setInputValue(val.toString()); updateSettings({ startingMoney: val }) }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(val)
    const num = parseInt(val) || 0
    if (num >= 100 && num <= 1000000) updateSettings({ startingMoney: num })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl animate-in zoom-in-95 duration-200" style={{ background: 'var(--color-bg-page)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
              <Settings size={20} style={{ color: 'var(--color-accent-primary)' }} />
            </div>
            <div>
              <h2 className="heading-display text-xl">Game Settings</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Configure match options</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Starting Money</label>
              <span className="text-lg font-black text-currency" style={{ color: 'var(--color-accent-pop)' }}>{formatMoney(startingMoney)}</span>
            </div>
            <input type="range" min="100" max="1000000" step="100" value={startingMoney} onChange={(e) => handleSliderChange(parseInt(e.target.value))} disabled={!canEdit} className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed" style={{ background: 'var(--color-border)', accentColor: 'var(--color-accent-primary)' }} />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--color-text-muted)' }}>$</span>
              <input type="text" value={inputValue} onChange={handleInputChange} onFocus={() => setIsEditing(true)} onBlur={() => { setIsEditing(false); const final = Math.max(100, Math.min(1000000, startingMoney)); setInputValue(final.toString()); updateSettings({ startingMoney: final }); }} disabled={!canEdit} className="w-full rounded-xl pl-8 pr-4 py-3 text-center font-bold focus:outline-none disabled:opacity-50" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>

          {modifiers.highStakes && (
            <div className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--color-accent-pop)' }}><AlertTriangle size={16} /><span className="text-sm font-bold">High-Stakes Mode</span></div>
              <div className="text-xs space-y-1 pt-2" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex justify-between"><span>Win Modifier:</span><span className="font-bold" style={{ color: modifiers.win >= 0 ? 'var(--color-accent-success)' : 'var(--color-accent-danger)' }}>{modifiers.win > 0 ? '+' : ''}{(modifiers.win * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span>Loss Modifier:</span><span className="font-bold" style={{ color: modifiers.loss >= 0 ? 'var(--color-accent-danger)' : 'var(--color-accent-success)' }}>{modifiers.loss > 0 ? '+' : ''}{(modifiers.loss * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
