import { useState } from 'react'
import { User as UserIcon, Disc as Discord, ArrowRight, Coins } from 'lucide-react'
import { WaveBackground } from '../ui/WaveBackground'

export interface SignInPageProps {
  onGuestLogin: (name: string) => void
  onDiscordLogin: () => void
}

export const SignInPage = ({ onGuestLogin, onDiscordLogin }: SignInPageProps) => {
  const [guestName, setGuestName] = useState('')
  const [username, setUsername] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [isTossing, setIsTossing] = useState(false)

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) {
      triggerShake()
      return
    }
    setIsTossing(true)
    setTimeout(() => {
      onGuestLogin(guestName.trim())
    }, 1000)
  }

  const handleJoin = () => {
    if (!username.trim()) {
      triggerShake()
      return
    }
    onGuestLogin(username.trim())
  }

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <WaveBackground />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] mb-6 backdrop-blur-xl">
            <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">🎲</span>
          </div>
          <h1 className="heading-display text-responsive-4xl text-white mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex justify-center gap-3">
            <div className="flex gap-1">
              {['R','O','C','K'].map((letter, i) => (
                <span key={i} className="inline-block animate-slot-roll" style={{ animationDelay: `${i * 100}ms` }}>{letter}</span>
              ))}
            </div>
            <div className="flex gap-1">
              {['P','A','P','E','R'].map((letter, i) => (
                <span key={i + 4} className="inline-block animate-slot-roll" style={{ animationDelay: `${(i + 4) * 100}ms` }}>{letter}</span>
              ))}
            </div>
            <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#BAE6FD,#0891B2,#3B82F6,#BAE6FD)] bg-[length:200%_100%] animate-liquid-blue drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] ml-2 inline-block animate-slot-roll" style={{ animationDelay: '900ms' }}>
              GAMBLE
            </span>
          </h1>
          <p className="text-cyan-100 font-medium text-sm tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Bet on the outcome. Win the pot.
          </p>
          <div className="mt-2 text-[9px] text-gray-400 font-bold tracking-[0.3em] uppercase">
            v3.0.0 Neon Vegas
          </div>
        </div>

        {/* Sign-in card */}
        <div className="card-modern bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:border-amber-400/30 transition-all duration-500 space-y-6">
          {/* Username input */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest ml-1">
              Username
            </label>
            <div className={`relative ${isShaking ? 'animate-rumble' : ''}`}>
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            className="w-full py-4 text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              Join Game
              <ArrowRight size={18} />
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Discord button */}
          <button
            onClick={onDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-bold rounded-2xl transition-all duration-200 shadow-[0_4px_15px_rgba(88,101,242,0.3)] hover:shadow-[0_0_25px_rgba(88,101,242,0.6)] animate-breathe"
          >
            <Discord size={22} />
            <span>Continue with Discord</span>
          </button>

          {/* Guest login */}
          <form onSubmit={handleGuestSubmit} className="pt-5 border-t border-white/10">
            <div className="text-center mb-3">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Play without account</span>
            </div>
            <div className="flex gap-3">
              <div className={`relative flex-1 ${isShaking ? 'animate-rumble' : ''}`}>
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Guest name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-sm whitespace-nowrap flex items-center gap-2 group relative overflow-hidden"
              >
                <span>Play as Guest</span>
                <div className="relative w-4 h-4">
                  {isTossing ? (
                    <Coins size={16} className="text-amber-400 animate-coin-toss absolute inset-0" />
                  ) : (
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform absolute inset-0 text-gray-300" />
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/40 leading-relaxed tracking-wide font-medium">
            By signing in, you agree to lose your imaginary coins in spectacular fashion.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slot-roll {
          0% { transform: translateY(-50px) rotateX(-90deg); opacity: 0; filter: blur(5px); }
          50% { transform: translateY(10px) rotateX(10deg); opacity: 1; filter: blur(0); }
          75% { transform: translateY(-5px) rotateX(-5deg); }
          100% { transform: translateY(0) rotateX(0deg); opacity: 1; }
        }
        .animate-slot-roll {
          animation: slot-roll 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes liquid-blue {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-liquid-blue {
          animation: liquid-blue 3s linear infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }

        @keyframes rumble {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(4px) rotate(1deg); }
        }
        .animate-rumble {
          animation: rumble 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes coin-toss {
          0% { transform: translateY(0) rotateY(0deg); opacity: 1; }
          40% { transform: translateY(-30px) rotateY(360deg); opacity: 1; }
          80% { transform: translateY(0) rotateY(720deg); opacity: 1; }
          100% { transform: translateY(0) rotateY(720deg) scale(0); opacity: 0; }
        }
        .animate-coin-toss {
          animation: coin-toss 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}} />
    </div>
  )
}
