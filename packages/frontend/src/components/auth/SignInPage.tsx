import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Disc as Discord, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export const SignInPage = () => {
  const [guestName, setGuestName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const { setGuestUser } = useAuthStore()

  // Trigger launch animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Decorative Icons */}
        <div className="absolute top-[10%] left-[10%] text-6xl opacity-10 launch-logo" style={{ animationDelay: '0.6s' }}>
          ✊
        </div>
        <div className="absolute top-[20%] right-[15%] text-5xl opacity-10 launch-logo" style={{ animationDelay: '0.8s' }}>
          ✋
        </div>
        <div className="absolute bottom-[15%] left-[20%] text-6xl opacity-10 launch-logo" style={{ animationDelay: '1s' }}>
          ✌️
        </div>
        <div className="absolute bottom-[25%] right-[10%] text-4xl opacity-10 launch-logo" style={{ animationDelay: '1.2s' }}>
          🎲
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Card */}
      <div 
        className={`relative max-w-md w-full space-y-8 bg-slate-800/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl launch-container ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Logo Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-primary/30 to-brand-secondary/30 mb-6 launch-logo shadow-xl shadow-brand-primary/20">
            <span className="text-5xl float">🎲</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-3 italic launch-title">
            ROCK PAPER <span className="text-brand-primary">GAMBLE</span>
          </h1>
          
          <p className="text-slate-400 font-medium launch-subtitle">
            Bet on the outcome. Win the pot.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-2 launch-subtitle">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">v2.2.0</span>
            <Sparkles size={12} className="text-brand-accent" />
          </div>
        </div>

        {/* Login Options */}
        <div className="space-y-4 launch-buttons">
          {/* Discord Login */}
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-[#5865F2]/20 btn-press group"
          >
            <Discord size={24} />
            <span>Continue with Discord</span>
            <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-600 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Guest Login */}
          <form onSubmit={handleGuestLogin} className="space-y-3">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Enter your name..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={!guestName.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all btn-press group"
            >
              <span>Play as Guest</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/5 launch-footer">
          <p className="text-xs text-center text-slate-500 leading-relaxed">
            By signing in, you agree to lose your imaginary coins in spectacular fashion.
          </p>
        </div>
      </div>
    </div>
  )
}