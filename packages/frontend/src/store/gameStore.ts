import { create } from 'zustand'
import PartySocket from 'partysocket'
import type { GameSession, GamePhase } from '@rpg/shared'

interface GameState {
  socket: PartySocket | null
  session: GameSession | null
  isConnected: boolean
  
  // Actions
  connect: (lobbyId: string, userId: string, displayName: string) => void
  disconnect: () => void
  createLobby: () => string
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,

  connect: (lobbyId: string, userId: string, displayName: string) => {
    if (get().socket) {
      get().socket?.close()
    }

    const host = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'
    const socket = new PartySocket({
      host,
      room: lobbyId,
      query: {
        userId,
        displayName
      }
    })

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'SYNC') {
        set({ session: message.session })
      }
    })

    socket.addEventListener('open', () => {
      set({ isConnected: true })
    })

    socket.addEventListener('close', () => {
      set({ isConnected: false, session: null })
    })

    set({ socket })
  },

  disconnect: () => {
    get().socket?.close()
    set({ socket: null, session: null, isConnected: false })
  },

  createLobby: () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}))
