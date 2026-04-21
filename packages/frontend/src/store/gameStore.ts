import { create } from 'zustand'
import PartySocket from 'partysocket'
import type { GameSession } from '@rpg/shared'

interface GameState {
  socket: PartySocket | null
  session: GameSession | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Actions
  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string) => void
  disconnect: () => void
  createLobby: () => string
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,
  isConnecting: false,
  error: null,

  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string) => {
    const currentSocket = get().socket;
    if (currentSocket) {
      // If we're already connected to this room with this user, don't reconnect
      try {
        const url = new URL(currentSocket.url);
        const query = new URLSearchParams(url.search);
        if (currentSocket.room === lobbyId && query.get('userId') === userId) {
          return;
        }
      } catch (e) {
        // Fallback if URL parsing fails
      }
      currentSocket.close();
      set({ socket: null, isConnected: false, isConnecting: false });
    }

    set({ isConnecting: true, error: null });

    const host = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999'
    const socket = new PartySocket({
      host,
      room: lobbyId,
      query: {
        userId,
        displayName,
        avatarUrl: avatarUrl || ''
      }
    })

    socket.addEventListener('message', (event) => {
      if (get().socket !== socket) return
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'SYNC') {
          set({ session: message.session })
        }
      } catch (err) {
        console.error('Failed to parse message', err)
      }
    })

    socket.addEventListener('open', () => {
      if (get().socket !== socket) return
      set({ isConnected: true, isConnecting: false, error: null })
    })

    socket.addEventListener('close', (event) => {
      if (get().socket !== socket) return
      set({ 
        isConnected: false, 
        isConnecting: false, 
        session: null,
        error: event.wasClean ? null : 'Connection lost'
      })
    })

    socket.addEventListener('error', (event) => {
      if (get().socket !== socket) return
      set({ 
        isConnected: false, 
        isConnecting: false, 
        error: 'Failed to connect' 
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
  }
}))
