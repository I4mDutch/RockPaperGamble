import React from 'react'

/**
 * v3.0.0 — "Lighter" Neon Vegas Background
 * Bright, elegant animated mesh gradient without the cluttered shapes.
 */
export const WaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-mesh">
      
      {/* 1. Subtle Dot Grid with Vignette (Spotlight effect) */}
      <div 
        className="absolute inset-0 opacity-[0.5] grid-ping"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      {/* Vignette Overlay for Casino Spotlight Feel */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(15, 23, 42, 0.15) 100%)'
        }}
      />

      {/* 3. The Winner "Camera Flash" (Subtle for light mode) */}
      <div className="absolute inset-0 camera-flash pointer-events-none mix-blend-overlay" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mesh {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        .bg-mesh {
          background-color: #cbd5e1; /* Rich silver/slate base instead of white */
          background-image: 
            radial-gradient(at 20% 20%, rgba(56, 189, 248, 0.6) 0px, transparent 70%),
            radial-gradient(at 80% 80%, rgba(167, 139, 250, 0.6) 0px, transparent 70%),
            radial-gradient(at 50% 50%, rgba(251, 191, 36, 0.4) 0px, transparent 80%);
          background-size: 150% 150%;
          animation: mesh 20s ease-in-out infinite alternate;
        }

        @keyframes grid-pulse {
          0%, 85%, 100% { opacity: 0.2; }
          90% { opacity: 0.5; }
        }

        .grid-ping {
          animation: grid-pulse 8s infinite ease-in-out;
        }

        /* Camera Flash */
        @keyframes camera-flash {
          0%, 96%, 100% { opacity: 0; background: transparent; }
          97% { opacity: 0.5; background: white; }
          98% { opacity: 0; background: transparent; }
          99% { opacity: 0.3; background: white; }
        }
        .camera-flash {
          animation: camera-flash 30s infinite;
        }
      `}} />
    </div>
  )
}



