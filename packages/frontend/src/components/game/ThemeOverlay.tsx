import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const ThemeOverlay: React.FC = () => {
  const { session } = useGameStore();
  const [effect, setEffect] = useState<'none' | 'bomb' | 'nuke'>('none');

  useEffect(() => {
    if (!session?.eventFeed) return;
    
    const lastEvent = session.eventFeed[session.eventFeed.length - 1];
    if (!lastEvent || Date.now() - lastEvent.timestamp > 2000) return;

    if (lastEvent.type === 'item') {
      if (lastEvent.itemId === 'atomic_bomb') {
        setEffect('bomb');
        setTimeout(() => setEffect('none'), 1500);
      } else if (lastEvent.itemId === 'nuke') {
        setEffect('nuke');
        setTimeout(() => setEffect('none'), 3000);
      }
    }
  }, [session?.eventFeed]);

  if (effect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {effect === 'bomb' && (
        <div className="absolute inset-0 bg-red-600/30 animate-shake border-[20px] border-red-500/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#ff000044_100%)]" />
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute h-px bg-cyan-400/50 w-full animate-bolt" style={{ top: `${Math.random() * 100}%`, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl opacity-40 filter blur-sm animate-pulse">☢️</div>
          </div>
        </div>
      )}
      
      {effect === 'nuke' && (
        <div className="absolute inset-0 bg-white animate-flash flex items-center justify-center">
          <div className="text-white font-black text-6xl tracking-tighter mix-blend-difference">
            CRITICAL IMPACT
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -10px); }
          20%, 40%, 60%, 80% { transform: translate(10px, 10px); }
        }
        @keyframes flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bolt {
          0% { transform: translateX(-100%) scaleY(1); opacity: 0; }
          50% { opacity: 1; transform: translateX(0) scaleY(5); }
          100% { transform: translateX(100%) scaleY(1); opacity: 0; }
        }
        .animate-bolt {
          animation: bolt 0.2s linear infinite;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 3;
        }
        .animate-flash {
          animation: flash 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
