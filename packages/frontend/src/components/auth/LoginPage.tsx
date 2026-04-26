import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Disc as Discord, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { WaveBackground } from '../ui/WaveBackground'

export const LoginPage = () => {
  const [guestName, setGuestName] = useState('')
  const { setGuestUser } = useAuthStore()

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    })
    if (error) console.error('Error logging in:', error.message)
  }

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (guestName.trim()) setGuestUser(guestName.trim())
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />

      {/* Split layout: branding left, form right */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left: Branding Panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16">
          <div className="max-w-md text-center lg:text-left space-y-6 backdrop-blur-md bg-white/50 p-10 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <Sparkles size={12} style={{ color: 'var(--color-accent-primary)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent-primary)' }}>v3.0.0</span>
            </div>
            <h1 className="heading-display text-responsive-5xl leading-[0.95]">
              ROCK<br />PAPER<br />
              <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#7DD3FC,#0891B2,#2563EB,#7DD3FC)] bg-[length:200%_100%] animate-liquid-blue drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] inline-block">
                GAMBLE
              </span>
            </h1>
            <p className="text-base leading-relaxed font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Challenge your friends to Rock Paper Scissors — but with real stakes. Bet coins, bluff your opponents, and take everything.
            </p>
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {['🥷', '🐲', '🔥'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm" style={{ background: 'var(--color-bg-page)', border: '2px solid var(--color-bg-surface)' }}>{e}</div>
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>Join the action</span>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <div className="card-modern space-y-5 bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <div className="text-center pb-2">
                <h2 className="heading-display text-2xl text-slate-800">Get Started</h2>
                <p className="text-sm mt-1 text-slate-500">Sign in to start playing</p>
              </div>

              {/* Discord */}
              <button
                onClick={handleDiscordLogin}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 text-white font-semibold rounded-xl transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: '#5865F2', boxShadow: '0 4px 16px rgba(88,101,242,0.25)', fontFamily: '"Outfit", system-ui, sans-serif' }}
              >
                <Discord size={20} />
                Continue with Discord
              </button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">or</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Guest */}
              <form onSubmit={handleGuestLogin} className="space-y-3">
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Enter your name..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl pl-12 pr-4 py-4 text-sm font-medium transition-all focus:outline-none bg-white border border-slate-200 text-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-sm"
                  />
                </div>
                <button disabled={!guestName.trim()} className="btn-gradient w-full py-4 text-base bg-gradient-to-r from-slate-800 to-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all rounded-xl">
                  <span className="flex items-center justify-center gap-2">Play as Guest <ArrowRight size={18} /></span>
                </button>
              </form>
            </div>

            <p className="text-center text-[10px] font-bold tracking-wide leading-relaxed text-slate-500">
              By signing in, you agree to lose your imaginary coins in spectacular fashion.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes liquid-blue {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-liquid-blue {
          animation: liquid-blue 3s linear infinite;
        }
      `}} />
    </div>
  )
}
