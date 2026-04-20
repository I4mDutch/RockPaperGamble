import { create } from 'zustand'
import PartySocket from 'partysocket'
import type { GameSession, GameSettings } from '@rpg/shared'

interface GameState {
  socket: PartySocket | null
  session: GameSession | null
  isConnected: boolean
  error: string | null // v2.2.0: Error handling
  
  // Actions
  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => void
  disconnect: () => void
  createLobby: () => string
  
  // v2.2.0: Game settings
  updateSettings: (settings: Partial<GameSettings>) => void
  
  // v2.2.0: Turn order management
  reorderPlayers: (newOrder: string[]) => void
  
  // v2.2.0: Ready status
  setReady: (ready: boolean) => void
  
  // v2.2.0: Start game
  startGame: () => void
  
  // v2.2.0: Gift coins
  giftCoins: (targetId: string, amount: number) => void
  
  // v2.2.0: Set error
  setError: (error: string | null) => void
  
  // v2.2.0: Force synchronization
  forceSync: () => void
  
  // v2.2.0: Generic message sender
  sendMessage: (message: object) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,
  error: null,

  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => {
    if (get().socket) {
      get().socket?.close()
    }

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
          console.log('[SYNC] Received session update:', {
            status: message.session.status,
            players: message.session.players.length,
            turnOrder: message.session.turnOrder,
            playerStatuses: message.session.players.map((p: any) => ({ name: p.displayName, status: p.status }))
          });
          set({ session: message.session })
        } else if (message.type === 'ERROR') {
          set({ error: message.message })
          // Auto-clear error after 5 seconds
          setTimeout(() => set({ error: null }), 5000)
        }
      } catch (err) {
        console.error('Error parsing message:', err)
      }
    })

    socket.addEventListener('open', () => {
      set({ isConnected: true })
      // v2.2.0: Force sync on open
      socket.send(JSON.stringify({ type: 'FORCE_SYNC' }))
    })

    socket.addEventListener('close', () => {
      set({ isConnected: false, session: null })
    })

    socket.addEventListener('error', () => {
      set({ error: 'Connection error. Please try again.' })
    })

    set({ socket })
  },

  disconnect: () => {
    get().socket?.close()
    set({ socket: null, session: null, isConnected: false, error: null })
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
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'UPDATE_SETTINGS', settings }))
    }
  },

  reorderPlayers: (newOrder: string[]) => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'REORDER_PLAYERS', turnOrder: newOrder }))
    }
  },

  setReady: (ready: boolean) => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'SET_READY', ready }))
    }
  },

  startGame: () => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'START_GAME' }))
    }
  },

  giftCoins: (targetId: string, amount: number) => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'GIFT_COINS', targetId, amount }))
    }
  },

  setError: (error: string | null) => {
    set({ error })
    if (error) {
      setTimeout(() => set({ error: null }), 5000)
    }
  },

  forceSync: () => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify({ type: 'FORCE_SYNC' }))
    }
  },

  sendMessage: (message: object) => {
    const { socket } = get()
    if (socket) {
      socket.send(JSON.stringify(message))
    }
  }
}))
