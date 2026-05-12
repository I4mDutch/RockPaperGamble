import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { ShoppingBag, Zap, Shield, Target } from 'lucide-react';

const ITEM_ICONS: Record<string, any> = {
  atomic_bomb: Target,
  nuke: Zap,
  landmine: Shield,
  interceptor: Zap
};

export const ItemsShop: React.FC = () => {
  const { session, socket, purchaseItem, activateItem } = useGameStore();
  const userId = socket?.id;
  const me = session?.players.find(p => p.id === userId);

  if (!session || !me) return null;

  const itemSettings = session.settings.items;

  const ITEMS = [
    {
      id: 'atomic_bomb',
      name: 'Atomic Bomb',
      cost: itemSettings.atomic_bomb.cost,
      description: `Steal ${(itemSettings.atomic_bomb.targetSteal * 100).toFixed(0)}% from target + ${(itemSettings.atomic_bomb.globalSteal * 100).toFixed(0)}% global.`,
      icon: Target
    },
    {
      id: 'nuke',
      name: 'Nuke',
      cost: itemSettings.nuke.cost,
      description: `${(itemSettings.nuke.poolTake * 100).toFixed(0)}% global grab vs ${(itemSettings.nuke.backfireRisk * 100).toFixed(0)}% backfire.`,
      icon: Zap
    },
    {
      id: 'landmine',
      name: 'Landmine',
      cost: itemSettings.landmine.cost,
      description: `Place a trap. Hits for ${itemSettings.landmine.payout.toLocaleString()} 🪙.`,
      icon: Shield
    },
    {
      id: 'interceptor',
      name: 'Interceptor',
      cost: itemSettings.interceptor.cost,
      description: `Steal double wager (min ${itemSettings.interceptor.minSteal.toLocaleString()} 🪙).`,
      icon: Target
    },
  ];

  return (
    <div className="card-modern space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-[#10B981]/10">
        <ShoppingBag size={16} className="text-[#10B981]" />
        <h3 className="heading-display text-sm uppercase tracking-widest text-[#10B981]/60">Items Shop</h3>
      </div>

      <div className="space-y-3">
        {ITEMS.map(item => (
          <div key={item.id} className="group p-3 bg-[#0F3F34] rounded-lg border border-[#10B981]/10 hover:border-[#10B981]/30 transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <item.icon size={14} className="text-[#10B981]" />
                <span className="text-sm font-bold text-white">{item.name}</span>
              </div>
              <span className="text-xs font-mono text-[#10B981]">{item.cost} 🪙</span>
            </div>
            <p className="text-[10px] text-[#10B981]/60 leading-tight mb-2">{item.description}</p>
            <button
              onClick={() => purchaseItem(item.id)}
              disabled={me.coins < item.cost}
              className="w-full py-1.5 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 disabled:opacity-30 disabled:hover:bg-[#10B981]/10 text-[10px] font-bold uppercase tracking-wider text-[#10B981] transition-colors"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>

      {/* Inventory Section */}
      {me.inventory && me.inventory.length > 0 && (
        <div className="pt-4 mt-4 border-t border-[#10B981]/10">
          <h4 className="text-[10px] uppercase tracking-widest text-[#10B981]/40 font-bold mb-3">Your Inventory</h4>
          <div className="flex flex-wrap gap-2">
            {me.inventory.map((item: any, idx: number) => (
              <button
                key={item.instanceId || idx}
                onClick={() => {
                  // For bomb, we might need a target. For now, we'll just pick a random other player or yourself
                  const otherPlayers = session.players.filter(p => p.id !== userId);
                  const targetId = otherPlayers.length > 0 ? otherPlayers[0].id : userId;
                  activateItem(item.instanceId, targetId);
                }}
                className="px-2 py-1 rounded bg-[#10B981] text-[#0F3F34] text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#10B981]/20"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
