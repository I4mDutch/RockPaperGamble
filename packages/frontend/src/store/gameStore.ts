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

const normalizePartyKitHost = (rawHost?: string): string | null => {
  if (!rawHost) return null

  const normalized = rawHost
    .trim()
    .replace(/^(https?:\/\/|wss?:\/\/)/i, '')
    .replace(/\/$/, '')

  return normalized || null
}

const buildCandidateHosts = (rawHost?: string): string[] => {
  const candidates = [
    normalizePartyKitHost(rawHost),
    window.location.host || null,
    window.location.hostname ? `${window.location.hostname}:1999` : null,
    'localhost:1999'
  ].filter(Boolean) as string[]

  return [...new Set(candidates)]
}

let activeConnectAttempt = 0

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  session: null,
  isConnected: false,
  isConnecting: false,
  error: null,

  connect: (lobbyId: string, userId: string, displayName: string, avatarUrl?: string, avatarColor?: string, initials?: string) => {
    activeConnectAttempt += 1
    const attemptId = activeConnectAttempt

    get().socket?.close()
    set({ isConnecting: true, isConnected: false, error: null, session: null, socket: null })

    const candidateHosts = buildCandidateHosts(import.meta.env.VITE_PARTYKIT_HOST)
    const triedHosts: string[] = []

    const tryHost = (hostIndex: number) => {
      if (attemptId !== activeConnectAttempt) return

      const host = candidateHosts[hostIndex]
      if (!host) {
        set({
          isConnected: false,
          isConnecting: false,
          session: null,
          error: `Unable to connect. Hosts tried: ${triedHosts.join(', ')}`
        })
        return
      }

      triedHosts.push(host)
      let opened = false

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

      set({ socket })

      const tryNextHost = (message: string) => {
        if (attemptId !== activeConnectAttempt) return

        if (hostIndex < candidateHosts.length - 1) {
          try {
            socket.close()
          } catch {
            // no-op
          }
          tryHost(hostIndex + 1)
          return
        }

        set({
          isConnected: false,
          isConnecting: false,
          session: null,
          error: `${message}. Hosts tried: ${triedHosts.join(', ')}`
        })
      }

      socket.addEventListener('message', (event) => {
        if (attemptId !== activeConnectAttempt) return

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
        if (attemptId !== activeConnectAttempt) return
        opened = true
        set({ isConnected: true, isConnecting: false, error: null })
        socket.send(JSON.stringify({ type: 'FORCE_SYNC' }))
      })

      socket.addEventListener('close', () => {
        if (attemptId !== activeConnectAttempt) return

        if (!opened) {
          tryNextHost(`Connection closed before handshake on ${host}`)
          return
        }

        set({ isConnected: false, isConnecting: false, session: null, error: null })
      })

      socket.addEventListener('error', () => {
        if (attemptId !== activeConnectAttempt) return

        if (!opened) {
          tryNextHost(`Connection error while trying ${host}`)
          return
        }

        set({ isConnected: false, isConnecting: false, session: null, error: `Connection dropped on ${host}` })
      })
    }

    tryHost(0)
  },

  disconnect: () => {
    activeConnectAttempt += 1
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
