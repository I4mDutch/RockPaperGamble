import { create } from 'zustand'
import PartySocket from 'partysocket'
import type { GameSession, GameSettings } from '@rpg/shared'

interface GameState {
  socket: PartySocket | null
  session: GameSession | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Actions
  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => void
  disconnect: () => void
  createLobby: () => string
  
  // v2.2.0: Game actions
  updateSettings: (settings: Partial<GameSettings>) => void
  reorderPlayers: (newOrder: string[]) => void
  setReady: (ready: boolean) => void
  startGame: () => void
  giftCoins: (targetId: string, amount: number) => void
  forceSync: () => void
  setError: (error: string | null) => void
  sendMessage: (message: object) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,
  isConnecting: false,
  error: null,

  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => {
    const currentSocket = get().socket;
    if (currentSocket) {
      if (currentSocket.room === lobbyId) return;
      currentSocket.close();
    }

    set({ isConnecting: true, error: null });

    const host = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'
    const socket = new PartySocket({
      host,
      room: lobbyId,
      query: {
        userId,
        displayName,
        avatarUrl: avatarUrl || '',
        avatarColor: avatarColor || '',
        initials: initials || ''
      }
    })

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'SYNC') {
          set({ session: message.session })
        } else if (message.type === 'ERROR') {
          set({ error: message.message })
          setTimeout(() => set({ error: null }), 5000)
        }
      } catch (err) {
        console.error('Failed to parse message', err)
      }
    })

    socket.addEventListener('open', () => {
      set({ isConnected: true, isConnecting: false })
      socket.send(JSON.stringify({ type: 'FORCE_SYNC' }))
    })

    socket.addEventListener('close', () => {
      set({ isConnected: false, isConnecting: false, session: null })
    })

    socket.addEventListener('error', () => {
      set({ isConnected: false, isConnecting: false, error: 'Connection error' })
    })

    set({ socket })
  },

  disconnect: () => {
    get().socket?.close()
    set({ socket: null, session: null, isConnected: false, isConnecting: false, error: null })
  },

  createLobby: () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },

  updateSettings: (settings: Partial<GameSettings>) => {
    get().socket?.send(JSON.stringify({ type: 'UPDATE_SETTINGS', settings }))
  },

  reorderPlayers: (newOrder: string[]) => {
    get().socket?.send(JSON.stringify({ type: 'REORDER_PLAYERS', turnOrder: newOrder }))
  },

  setReady: (ready: boolean) => {
    get().socket?.send(JSON.stringify({ type: 'SET_READY', ready }))
  },

  startGame: () => {
    get().socket?.send(JSON.stringify({ type: 'START_GAME' }))
  },

  giftCoins: (targetId: string, amount: number) => {
    get().socket?.send(JSON.stringify({ type: 'GIFT_COINS', targetId, amount }))
  },

  forceSync: () => {
    get().socket?.send(JSON.stringify({ type: 'FORCE_SYNC' }))
  },

  setError: (error: string | null) => {
    set({ error })
    if (error) setTimeout(() => set({ error: null }), 5000)
  },

  sendMessage: (message: object) => {
    get().socket?.send(JSON.stringify(message))
  }
}))
