import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const SettingsPanel: React.FC = () => {
  const { session, updateSettings, socket } = useGameStore();
  const userId = socket?.id;
  const isHost = session?.hostId === userId;

  if (!session || !isHost) return null;

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="bg-[#0D2E27] border border-[#10B981]/20 rounded-xl p-6 space-y-6">
      <h3 className="text-xl font-bold text-[#10B981] flex items-center gap-2">
        <span>⚙️</span> Room Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Starting Money */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#10B981]/60">Starting Coins</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={session.settings.startingMoney}
              onChange={(e) => handleSettingChange('startingMoney', parseInt(e.target.value))}
              className="flex-1 accent-[#10B981]"
            />
            <span className="text-white font-mono w-16">{session.settings.startingMoney}</span>
          </div>
        </div>

        {/* High Stakes Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#0F3F34] rounded-lg border border-[#10B981]/10">
          <div>
            <div className="font-medium text-white">High Stakes Mode</div>
            <div className="text-xs text-[#10B981]/60">Increased risk/reward multipliers</div>
          </div>
          <button
            onClick={() => handleSettingChange('highStakesMode', !session.settings.highStakesMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              session.settings.highStakesMode ? 'bg-[#10B981]' : 'bg-[#1F2937]'
            }`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              session.settings.highStakesMode ? 'translate-x-6' : ''
            }`} />
          </button>
        </div>

        {/* Loss Modifier */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#10B981]/60">Loss Penalty Multiplier</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={session.settings.lossModifier}
              onChange={(e) => handleSettingChange('lossModifier', parseFloat(e.target.value))}
              className="flex-1 accent-[#10B981]"
            />
            <span className="text-white font-mono w-12">{session.settings.lossModifier}x</span>
          </div>
        </div>

        {/* Win Modifier */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#10B981]/60">Win Reward Multiplier</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={session.settings.winModifier}
              onChange={(e) => handleSettingChange('winModifier', parseFloat(e.target.value))}
              className="flex-1 accent-[#10B981]"
            />
            <span className="text-white font-mono w-12">{session.settings.winModifier}x</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#10B981]/10">
        <div className="text-xs text-[#10B981]/40 italic">
          * Settings can only be changed by the lobby host.
        </div>
      </div>
    </div>
  );
};
