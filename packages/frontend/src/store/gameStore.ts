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
  purchaseItem: (itemId: string) => void
  activateItem: (instanceId: string, targetId?: string) => void
  forceSync: () => void
  setError: (error: string | null) => void
  sendMessage: (message: object) => void
}

const normalizePartyKitHost = (rawHost?: string): string => {
  const fallbackHost = `${window.location.hostname || 'localhost'}:1999`
  if (!rawHost) return fallbackHost

  return rawHost
    .trim()
    .replace(/^(https?:\/\/|wss?:\/\/)/i, '')
    .replace(/\/$/, '') || fallbackHost
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,
  isConnecting: false,
  error: null,

  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => {
    const currentSocket = get().socket
    if (currentSocket) {
      if (currentSocket.room === lobbyId) return
      currentSocket.close()
    }

    const host = normalizePartyKitHost(import.meta.env.VITE_PARTYKIT_HOST)
    set({ isConnecting: true, isConnected: false, error: null })

    const socket = new PartySocket({
      host,
      party: 'main',
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
          set({ error: message.message, isConnecting: false })
          setTimeout(() => set({ error: null }), 5000)
        }
      } catch (err) {
        console.error('Failed to parse message', err)
      }
    })

    socket.addEventListener('open', () => {
      set({ isConnected: true, isConnecting: false, error: null })
      socket.send(JSON.stringify({ type: 'FORCE_SYNC' }))
    })

    socket.addEventListener('close', () => {
      const { isConnected } = get()
      set({
        isConnected: false,
        isConnecting: false,
        session: null,
        error: isConnected ? null : `Unable to connect to lobby at ${host}`
      })
    })

    socket.addEventListener('error', () => {
      set({
        isConnected: false,
        isConnecting: false,
        session: null,
        error: `Connection error while trying ${host}`
      })
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

  purchaseItem: (itemId: string) => {
    get().socket?.send(JSON.stringify({ type: 'PURCHASE_ITEM', itemId }))
  },

  activateItem: (instanceId: string, targetId?: string) => {
    get().socket?.send(JSON.stringify({ type: 'ACTIVATE_ITEM', instanceId, targetId }))
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
