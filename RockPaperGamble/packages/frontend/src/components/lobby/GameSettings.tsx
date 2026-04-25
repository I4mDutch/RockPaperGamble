import { useMemo } from 'react'
import { Settings, DollarSign, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'

export interface GameSettingsData {
  startingMoney: number
  lossModifier: number
  winModifier: number
  isHighStakes: boolean
}

export interface GameSettingsProps {
  settings: GameSettingsData
  onSettingsChange: (settings: Partial<GameSettingsData>) => void
  isHost: boolean
}

export function calculateModifiers(startingMoney: number): { lossModifier: number; winModifier: number; isHighStakes: boolean } {
  if (startingMoney < 1000) return { lossModifier: -50, winModifier: 35, isHighStakes: false }
  if (startingMoney < 100000) return { lossModifier: 0, winModifier: 0, isHighStakes: false }
  if (startingMoney < 500000) return { lossModifier: 25, winModifier: -15, isHighStakes: true }
  return { lossModifier: 50, winModifier: -35, isHighStakes: true }
}

export function GameSettings({ settings, onSettingsChange, isHost }: GameSettingsProps) {
  const MIN_MONEY = 100
  const MAX_MONEY = 1000000
  const DEFAULT_MONEY = 10000

  const modifiers = useMemo(() => calculateModifiers(settings.startingMoney), [settings.startingMoney])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    const newModifiers = calculateModifiers(value)
    onSettingsChange({
      startingMoney: value,
      ...newModifiers
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? MIN_MONEY : parseInt(e.target.value.replace(/[^0-9]/g, ''), 10)
    const clampedValue = Math.max(MIN_MONEY, Math.min(MAX_MONEY, value))
    const newModifiers = calculateModifiers(clampedValue)
    onSettingsChange({
      startingMoney: clampedValue,
      ...newModifiers
    })
  }

  const getStakesLabel = () => {
    if (settings.startingMoney < 1000) return 'Low Stakes'
    if (settings.startingMoney < 100000) return 'Standard'
    if (settings.startingMoney < 500000) return 'High Stakes'
    return 'Very High Stakes'
  }

  const getStakesColor = () => {
    if (settings.startingMoney < 1000) return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    if (settings.startingMoney < 100000) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    if (settings.startingMoney < 500000) return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    return 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="text-brand-primary" size={20} />
        <h3 className="text-lg font-bold text-white">Game Settings</h3>
        {settings.isHighStakes && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <AlertTriangle size={12} />
            <span>High Stakes</span>
          </div>
        )}
      </div>

      {/* Starting Money Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">Starting Money</label>
          <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStakesColor()}`}>
            {getStakesLabel()}
          </span>
        </div>

        {/* Money Display with Input */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent">
              <DollarSign size={20} />
            </div>
            <input
              type="text"
              value={settings.startingMoney.toLocaleString()}
              onChange={handleInputChange}
              disabled={!isHost}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-black text-white italic tracking-tighter outline-hidden focus:border-brand-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Slider */}
        <div className="relative pt-2">
          <input
            type="range"
            min={MIN_MONEY}
            max={MAX_MONEY}
            step={100}
            value={settings.startingMoney}
            onChange={handleSliderChange}
            disabled={!isHost}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-brand"
            style={{
              background: `linear-gradient(to right, #ff4d4d ${((settings.startingMoney - MIN_MONEY) / (MAX_MONEY - MIN_MONEY)) * 100}%, #334155 ${((settings.startingMoney - MIN_MONEY) / (MAX_MONEY - MIN_MONEY)) * 100}%)`
            }}
          />
          <div className="flex justify-between mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>${MIN_MONEY.toLocaleString()}</span>
            <span>${MAX_MONEY.toLocaleString()}</span>
          </div>
        </div>

        {!isHost && (
          <p className="text-xs text-slate-500 italic text-center">Only the host can change settings</p>
        )}
      </div>

      {/* Modifiers Display */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance Modifiers</p>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Loss Modifier */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            modifiers.lossModifier < 0 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : modifiers.lossModifier > 0 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-slate-700/30 border-white/5'
          }`}>
            <div className={`p-2 rounded-xl ${
              modifiers.lossModifier < 0 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : modifiers.lossModifier > 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-slate-600 text-slate-400'
            }`}>
              <TrendingDown size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">On Loss</p>
              <p className={`text-lg font-black ${
                modifiers.lossModifier < 0 
                  ? 'text-emerald-400' 
                  : modifiers.lossModifier > 0 
                    ? 'text-red-400' 
                    : 'text-slate-400'
              }`}>
                {modifiers.lossModifier === 0 ? 'Normal' : `${modifiers.lossModifier > 0 ? '+' : ''}${modifiers.lossModifier}%`}
              </p>
            </div>
          </div>

          {/* Win Modifier */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            modifiers.winModifier > 0 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : modifiers.winModifier < 0 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-slate-700/30 border-white/5'
          }`}>
            <div className={`p-2 rounded-xl ${
              modifiers.winModifier > 0 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : modifiers.winModifier < 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-slate-600 text-slate-400'
            }`}>
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">On Win</p>
              <p className={`text-lg font-black ${
                modifiers.winModifier > 0 
                  ? 'text-emerald-400' 
                  : modifiers.winModifier < 0 
                    ? 'text-red-400' 
                    : 'text-slate-400'
              }`}>
                {modifiers.winModifier === 0 ? 'Normal' : `${modifiers.winModifier > 0 ? '+' : ''}${modifiers.winModifier}%`}
              </p>
            </div>
          </div>
        </div>

        {/* Modifier Explanation */}
        <div className="text-xs text-slate-500 space-y-1">
          {settings.startingMoney < 1000 && (
            <p>Low stakes games have reduced losses but smaller wins.</p>
          )}
          {settings.startingMoney >= 1000 && settings.startingMoney < 100000 && (
            <p>Standard stakes with normal loss/win modifiers.</p>
          )}
          {settings.startingMoney >= 100000 && settings.startingMoney < 500000 && (
            <p className="text-orange-400">High stakes increase losses but reduce wins. Greater risk!</p>
          )}
          {settings.startingMoney >= 500000 && (
            <p className="text-red-400">Very high stakes significantly increase losses and reduce wins. Extreme risk!</p>
          )}
        </div>
      </div>
    </div>
  )
}
