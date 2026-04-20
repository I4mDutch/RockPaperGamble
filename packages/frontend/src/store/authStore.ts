import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface GuestUser {
  id: string
  displayName: string
  avatarUrl?: string
  avatarColor?: string
  initials?: string
}

interface AuthState {
  user: User | null
  guestUser: GuestUser | null
  session: Session | null
  loading: boolean
  setUser: (user: User | null) => void
  setGuestUser: (name: string) => void
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
  guestLogout: () => void // v2.2.0: Allow guests to logout
  initialize: () => Promise<void>
  updateProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  guestUser: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setGuestUser: (name) => {
    const id = `guest_${Math.random().toString(36).substr(2, 9)}`
    const guest: GuestUser = { 
      id, 
      displayName: name, 
      avatarUrl: '🎲',
      // Generate a consistent color based on id
      avatarColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
      initials: name.slice(0, 2).toUpperCase()
    }
    localStorage.setItem('rpg_guest', JSON.stringify(guest))
    set({ guestUser: guest, loading: false })
  },
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('rpg_guest')
    set({ user: null, session: null, guestUser: null, loading: false })
  },
  guestLogout: () => {
    // v2.2.0: Allow guests to logout without affecting Discord users
    localStorage.removeItem('rpg_guest')
    set({ guestUser: null, loading: false })
  },
  updateProfile: async (updates) => {
    const { user, guestUser } = get()
    
    if (user) {
      // 1. Update Auth Metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.displayName ?? user.user_metadata.full_name,
          avatar_url: updates.avatarUrl ?? user.user_metadata.avatar_url
        }
      })

      // 2. Update Profiles Table (for game server)
      await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName ?? user.user_metadata.full_name,
          avatar_url: updates.avatarUrl ?? user.user_metadata.avatar_url
        })
        .eq('id', user.id)

      if (!error && data.user) {
        set({ user: data.user })
      }
    } else if (guestUser) {
      const newGuest: GuestUser = {
        ...guestUser,
        displayName: updates.displayName ?? guestUser.displayName,
        avatarUrl: updates.avatarUrl ?? guestUser.avatarUrl,
        initials: updates.displayName ? updates.displayName.slice(0, 2).toUpperCase() : guestUser.initials
      }
      localStorage.setItem('rpg_guest', JSON.stringify(newGuest))
      set({ guestUser: newGuest })
    }
  },
  initialize: async () => {
    // 1. Get initial session
    const { data: { session } } = await supabase.auth.getSession()
    
    // 2. Check guest - ensure proper typing
    const guestJson = localStorage.getItem('rpg_guest')
    let guestUser: GuestUser | null = null
    if (guestJson) {
      try {
        guestUser = JSON.parse(guestJson)
      } catch {
        localStorage.removeItem('rpg_guest')
      }
    }

    set({ 
      session, 
      user: session?.user ?? null, 
      guestUser,
      loading: false 
    })

    // 3. Listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Only clear guestUser if there was a user (not guest)
        const { guestUser } = get()
        set({ user: null, session: null, guestUser: guestUser, loading: false })
      } else if (session) {
        set({ session, user: session.user, loading: false })
      }
    })
  }
}))
