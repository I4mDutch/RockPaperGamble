import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  guestUser: { id: string; displayName: string } | null
  session: Session | null
  loading: boolean
  setUser: (user: User | null) => void
  setGuestUser: (name: string) => void
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  guestUser: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setGuestUser: (name) => {
    const guest = { id: `guest_${Math.random().toString(36).substr(2, 9)}`, displayName: name }
    localStorage.setItem('rpg_guest', JSON.stringify(guest))
    set({ guestUser: guest })
  },
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('rpg_guest')
    set({ user: null, session: null, guestUser: null })
  },
  initialize: async () => {
    const guestJson = localStorage.getItem('rpg_guest')
    const guestUser = guestJson ? JSON.parse(guestJson) : null
    
    const { data: { session } } = await supabase.auth.getSession()
    set({ 
      session, 
      user: session?.user ?? null, 
      guestUser,
      loading: false 
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ 
        session, 
        user: session?.user ?? null, 
        loading: false 
      })
    })
  }
}))
