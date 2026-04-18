import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Disc as Discord, User as UserIcon, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export const LoginPage = () => {
  const [guestName, setGuestName] = useState('')
  const { setGuestUser } = useAuthStore()

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) {
      console.error('Error logging in:', error.message)
    }
  }

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (guestName.trim()) {
      setGuestUser(guestName.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-slate-800/50 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-primary/20 mb-6">
            <span className="text-4xl animate-bounce">🎲</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 italic">
            ROCK PAPER <span className="text-brand-primary">GAMBLE</span>
          </h1>
          <p className="text-slate-400 font-medium">
            Bet on the outcome. Win the pot.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-[#5865F2]/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Discord size={24} />
            <span>Continue with Discord</span>
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-600 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <form onSubmit={handleGuestLogin} className="space-y-3">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Enter your name..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors placeholder:text-slate-600"
              />
            </div>
            <button
              disabled={!guestName.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all group"
            >
              <span>Play as Guest</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="pt-6 border-t border-white/5">
          <p className="text-xs text-center text-slate-500 leading-relaxed">
            By signing in, you agree to lose your imaginary coins in spectacular fashion.
          </p>
        </div>
      </div>
    </div>
  )
}
