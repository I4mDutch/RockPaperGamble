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

  const handleItemSettingChange = (itemId: string, key: string, value: any) => {
    const items = { ...session.settings.items };
    (items as any)[itemId] = { ...(items as any)[itemId], [key]: value };
    updateSettings({ items });
  };

  return (
    <div className="bg-[#0D2E27] border border-[#10B981]/20 rounded-xl p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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

      <div className="pt-4 border-t border-[#10B981]/10 space-y-6">
        <h3 className="text-lg font-bold text-[#10B981] flex items-center gap-2">
          <span>🎒</span> Item Customization
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Atomic Bomb */}
          <div className="space-y-4 p-4 bg-[#0F3F34] rounded-lg border border-[#10B981]/10">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Atomic Bomb</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Cost</label>
                <input
                  type="number"
                  value={session.settings.items.atomic_bomb.cost}
                  onChange={(e) => handleItemSettingChange('atomic_bomb', 'cost', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Target Steal %</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={session.settings.items.atomic_bomb.targetSteal}
                  onChange={(e) => handleItemSettingChange('atomic_bomb', 'targetSteal', parseFloat(e.target.value))}
                  className="w-full accent-[#10B981]"
                />
                <div className="text-right text-[10px] text-white">{(session.settings.items.atomic_bomb.targetSteal * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Nuke */}
          <div className="space-y-4 p-4 bg-[#0F3F34] rounded-lg border border-[#10B981]/10">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Nuke</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Cost</label>
                <input
                  type="number"
                  value={session.settings.items.nuke.cost}
                  onChange={(e) => handleItemSettingChange('nuke', 'cost', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Backfire Risk %</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={session.settings.items.nuke.backfireRisk}
                  onChange={(e) => handleItemSettingChange('nuke', 'backfireRisk', parseFloat(e.target.value))}
                  className="w-full accent-[#10B981]"
                />
                <div className="text-right text-[10px] text-white">{(session.settings.items.nuke.backfireRisk * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Landmine */}
          <div className="space-y-4 p-4 bg-[#0F3F34] rounded-lg border border-[#10B981]/10">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Landmine</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Cost</label>
                <input
                  type="number"
                  value={session.settings.items.landmine.cost}
                  onChange={(e) => handleItemSettingChange('landmine', 'cost', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Payout on Hit</label>
                <input
                  type="number"
                  value={session.settings.items.landmine.payout}
                  onChange={(e) => handleItemSettingChange('landmine', 'payout', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Interceptor */}
          <div className="space-y-4 p-4 bg-[#0F3F34] rounded-lg border border-[#10B981]/10">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Interceptor</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Cost</label>
                <input
                  type="number"
                  value={session.settings.items.interceptor.cost}
                  onChange={(e) => handleItemSettingChange('interceptor', 'cost', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#10B981]/60 uppercase">Min Steal Amount</label>
                <input
                  type="number"
                  value={session.settings.items.interceptor.minSteal}
                  onChange={(e) => handleItemSettingChange('interceptor', 'minSteal', parseInt(e.target.value))}
                  className="w-full bg-[#0D2E27] border border-[#10B981]/20 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#10B981]/40 italic">
          * Settings can only be changed by the lobby host.
        </div>
      </div>
    </div>
  );
};
