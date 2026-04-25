import { useState } from 'react'
import { User as UserIcon, Disc as Discord, ArrowRight, Hand, FileText, Scissors } from 'lucide-react'

export interface SignInPageProps {
  onGuestLogin: (name: string) => void
  onDiscordLogin: () => void
}

export const SignInPage = ({ onGuestLogin, onDiscordLogin }: SignInPageProps) => {
  const [guestName, setGuestName] = useState('')
  const [username, setUsername] = useState('')

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (guestName.trim()) {
      onGuestLogin(guestName.trim())
    }
  }

  const handleJoin = () => {
    if (username.trim()) {
      onGuestLogin(username.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Decorative floating icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Rock icon - top left */}
        <div className="absolute top-[15%] left-[10%] opacity-10 animate-pulse">
          <Hand className="w-16 h-16 text-white rotate-[-15deg]" />
        </div>
        {/* Paper icon - top right */}
        <div className="absolute top-[20%] right-[12%] opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>
          <FileText className="w-20 h-20 text-white rotate-[10deg]" />
        </div>
        {/* Scissors icon - bottom left */}
        <div className="absolute bottom-[25%] left-[15%] opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <Scissors className="w-14 h-14 text-white rotate-[20deg]" />
        </div>
        {/* Rock icon - bottom right */}
        <div className="absolute bottom-[20%] right-[10%] opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <Hand className="w-12 h-12 text-white rotate-[-25deg]" />
        </div>
        {/* Paper icon - center left */}
        <div className="absolute top-[50%] left-[5%] opacity-5 animate-pulse" style={{ animationDelay: '0.8s' }}>
          <FileText className="w-10 h-10 text-white rotate-[-10deg]" />
        </div>
        {/* Scissors icon - center right */}
        <div className="absolute top-[45%] right-[5%] opacity-5 animate-pulse" style={{ animationDelay: '1.2s' }}>
          <Scissors className="w-12 h-12 text-white rotate-[30deg]" />
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        {/* RPG Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-brand-primary/20 mb-4 border border-white/10 shadow-xl">
            <span className="text-5xl animate-bounce">🎲</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">
            ROCK PAPER <span className="text-brand-primary">GAMBLE</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg">
            Bet on the outcome. Win the pot.
          </p>
          <div className="mt-2 text-xs text-slate-500 font-bold tracking-widest">
            V2.2.0
          </div>
        </div>

        {/* Sign-in card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Username input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Enter your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full bg-slate-800/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!username.trim()}
            className="w-full py-4 px-6 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              Join Game
              <ArrowRight size={18} />
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-600 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Discord button */}
          <button
            onClick={onDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-[#5865F2]/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Discord size={24} />
            <span>Continue with Discord</span>
          </button>

          {/* Guest login */}
          <form onSubmit={handleGuestSubmit} className="pt-4 border-t border-white/10">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Play without account</span>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Guest name..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm focus:outline-none focus:border-brand-primary transition-colors placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={!guestName.trim()}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm whitespace-nowrap"
              >
                Play as Guest
              </button>
            </div>
          </form>
        </div>

        {/* Footer text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            By signing in, you agree to lose your imaginary coins in spectacular fashion.
          </p>
        </div>
      </div>
    </div>
  )
}
