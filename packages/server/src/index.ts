import type * as Party from 'partykit/server'

const AVATAR_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']

function getAvatarColor(id: string): string {
  if (!id) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '??'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default class Server implements Party.Server {
  session: any

  constructor(readonly room: Party.Room) {
    this.session = {
      id: room.id,
      hostId: '',
      players: [],
      status: 'lobby',
      phase: 'WAITING',
      settings: {
        startingMoney: 10000,
        lossModifier: 0,
        winModifier: 0,
        highStakesMode: false
      },
      turnOrder: [],
      activePlayerIndex: 0,
      eventFeed: [],
      roundHistory: [],
      roundNumber: 0,
      timeLeft: 0,
      currentDuelId: null,
      currentDuel: null,
      createdAt: Date.now()
    }
  }

  private addEvent(event: any) {
    this.session.eventFeed.unshift({ id: `${Date.now()}_${Math.random()}`, timestamp: Date.now(), ...event })
    this.session.eventFeed = this.session.eventFeed.slice(0, 50)
  }

  private sendError(conn: Party.Connection, message: string) {
    conn.send(JSON.stringify({ type: 'ERROR', message }))
  }

  private getPlayer(userId: string) {
    return this.session.players.find((p: any) => p.id === userId)
  }

  private isEliminated(player: any): boolean {
    return !player || player.coins <= 0
  }

  private canAfford(player: any, amount: number): boolean {
    return !!player && Number.isFinite(amount) && amount > 0 && player.coins >= amount
  }

  private updateRolesForChallengeSelect() {
    const activePlayerId = this.session.turnOrder[this.session.activePlayerIndex]
    for (const p of this.session.players) {
      p.role = p.id === activePlayerId ? 'challenger' : 'spectator'
    }
  }

  private advanceToNextActivePlayer() {
    const len = this.session.turnOrder.length
    if (!len) return

    for (let i = 1; i <= len; i++) {
      const nextIndex = (this.session.activePlayerIndex + i) % len
      const nextId = this.session.turnOrder[nextIndex]
      const nextPlayer = this.getPlayer(nextId)
      if (nextPlayer && nextPlayer.coins > 0) {
        this.session.activePlayerIndex = nextIndex
        return
      }
    }
  }

  private applyBetPayouts(winnerId: string) {
    const duel = this.session.currentDuel
    if (!duel) return

    for (const bet of duel.bets) {
      const bettor = this.getPlayer(bet.playerId)
      if (!bettor) continue

      let payout = 0
      if (bet.targetId === winnerId) {
        payout = bet.amount * 2
      }

      bettor.coins += payout
      bet.payout = payout - bet.amount
      if (payout > 0) {
        bettor.stats.totalEarned += payout
        bettor.stats.totalWon += payout
      } else {
        bettor.stats.totalLost += bet.amount
      }
    }
  }

  broadcastSync() {
    this.room.broadcast(JSON.stringify({ type: 'SYNC', session: this.session }))
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url, 'http://localhost')
    const userId = url.searchParams.get('userId')
    const displayName = (url.searchParams.get('displayName') || 'Guest').trim()
    const avatarUrl = url.searchParams.get('avatarUrl') || undefined

    if (!userId) {
      conn.close()
      return
    }

    conn.setState({ userId })

    if (!this.session.hostId) {
      this.session.hostId = userId
    }

    let p = this.getPlayer(userId)
    if (!p) {
      p = {
        id: userId,
        displayName,
        avatarUrl,
        avatarColor: getAvatarColor(userId),
        initials: getInitials(displayName),
        coins: this.session.settings.startingMoney,
        isConnected: true,
        status: 'not_ready',
        role: 'spectator',
        stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0, totalWon: 0, totalLost: 0 }
      }
      this.session.players.push(p)
      this.addEvent({ type: 'join', playerId: userId, playerName: displayName, message: `${displayName} joined` })
    } else {
      p.isConnected = true
      p.displayName = displayName
      if (avatarUrl) p.avatarUrl = avatarUrl
    }

    if (!this.session.turnOrder.includes(userId)) {
      this.session.turnOrder.push(userId)
    }

    conn.send(JSON.stringify({ type: 'SYNC', session: this.session }))
    this.broadcastSync()
  }

  onClose(conn: Party.Connection) {
    const userId = conn.state?.userId
    if (!userId) return

    const p = this.getPlayer(userId)
    if (!p) return

    p.isConnected = false
    if (this.session.status === 'lobby') {
      this.session.players = this.session.players.filter((pl: any) => pl.id !== userId)
      this.session.turnOrder = this.session.turnOrder.filter((id: string) => id !== userId)
      this.addEvent({ type: 'leave', playerId: userId, playerName: p.displayName, message: `${p.displayName} left` })
      if (this.session.hostId === userId && this.session.players.length > 0) {
        this.session.hostId = this.session.players[0].id
      }
    }

    this.broadcastSync()
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message)
      const userId = sender.state?.userId
      if (!userId) return

      if (msg.type === 'SET_READY') {
        const p = this.getPlayer(userId)
        if (p) {
          p.status = msg.ready ? 'ready' : 'not_ready'
          this.addEvent({ type: 'ready', playerId: userId, playerName: p.displayName, message: `${p.displayName} is ${p.status}` })
        }
        this.broadcastSync()
      } else if (msg.type === 'UPDATE_SETTINGS') {
        if (this.session.hostId !== userId) return this.sendError(sender, 'Only host can update settings')
        this.session.settings = { ...this.session.settings, ...msg.settings }
        this.broadcastSync()
      } else if (msg.type === 'REORDER_PLAYERS') {
        if (this.session.hostId !== userId) return this.sendError(sender, 'Only host can reorder players')
        this.session.turnOrder = msg.turnOrder
        this.broadcastSync()
      } else if (msg.type === 'START_GAME') {
        if (this.session.hostId !== userId) return this.sendError(sender, 'Only host can start the game')
        this.session.status = 'in_progress'
        this.session.phase = 'CHALLENGE_SELECT'
        this.session.currentDuel = null
        this.session.currentDuelId = null
        this.session.roundNumber = 1
        this.updateRolesForChallengeSelect()
        this.addEvent({ type: 'start', playerId: userId, message: 'Match started' })
        this.broadcastSync()
      } else if (msg.type === 'SELECT_CHALLENGER') {
        if (this.session.phase !== 'CHALLENGE_SELECT') return this.sendError(sender, 'Not in challenge selection phase')

        const activePlayerId = this.session.turnOrder[this.session.activePlayerIndex]
        if (activePlayerId !== userId) return this.sendError(sender, 'It is not your turn to challenge')

        const challenger = this.getPlayer(userId)
        const challengee = this.getPlayer(msg.targetId)
        if (!challenger || !challengee) return this.sendError(sender, 'Invalid challenger or target')
        if (this.isEliminated(challenger)) return this.sendError(sender, 'You are eliminated and cannot challenge')
        if (this.isEliminated(challengee)) return this.sendError(sender, 'Target player is eliminated')
        if (challengee.id === challenger.id) return this.sendError(sender, 'You cannot challenge yourself')

        this.session.currentDuelId = `${Date.now()}_${challenger.id}_${challengee.id}`
        this.session.currentDuel = {
          id: this.session.currentDuelId,
          challengerId: challenger.id,
          challengeeId: challengee.id,
          rounds: [],
          seriesScore: { [challenger.id]: 0, [challengee.id]: 0 },
          targetWins: 3,
          status: 'betting',
          bets: [],
          startedAt: Date.now()
        }
        this.session.phase = 'BETTING'
        this.session.timeLeft = 20

        challenger.role = 'challenger'
        challengee.role = 'challengee'
        for (const p of this.session.players) {
          if (p.id !== challenger.id && p.id !== challengee.id) p.role = 'spectator'
        }

        this.addEvent({ type: 'bet', playerId: userId, playerName: challenger.displayName, message: `${challenger.displayName} challenged ${challengee.displayName}` })
        this.broadcastSync()
      } else if (msg.type === 'PLACE_BET') {
        if (!this.session.currentDuel || !['BETTING', 'RPS_ROUND'].includes(this.session.phase)) {
          return this.sendError(sender, 'No active duel for betting')
        }

        const bettor = this.getPlayer(userId)
        if (!bettor) return this.sendError(sender, 'Player not found')
        if (this.isEliminated(bettor)) return this.sendError(sender, 'Eliminated players cannot place bets')

        const amount = Number(msg.amount)
        if (!Number.isFinite(amount) || amount <= 0) return this.sendError(sender, 'Bet amount must be greater than 0')
        if (!this.canAfford(bettor, amount)) return this.sendError(sender, 'Insufficient coins for this bet')

        const duel = this.session.currentDuel
        const target = this.getPlayer(msg.targetId)
        if (!target || (target.id !== duel.challengerId && target.id !== duel.challengeeId)) {
          return this.sendError(sender, 'Bet target must be one of the duelists')
        }

        const existingBet = duel.bets.find((b: any) => b.playerId === userId)
        if (existingBet) return this.sendError(sender, 'You already placed a bet this duel')

        bettor.coins -= amount
        bettor.stats.totalWagered += amount

        duel.bets.push({
          playerId: userId,
          targetId: target.id,
          amount,
          placedAt: Date.now(),
          locked: true
        })

        this.addEvent({ type: 'bet', playerId: userId, playerName: bettor.displayName, targetId: target.id, targetName: target.displayName, amount, message: `${bettor.displayName} bet ${amount} on ${target.displayName}` })

        this.broadcastSync()
      } else if (msg.type === 'GIFT_COINS') {
        const fromPlayer = this.getPlayer(userId)
        const toPlayer = this.getPlayer(msg.targetId)
        const amount = Number(msg.amount)

        if (!fromPlayer || !toPlayer) return this.sendError(sender, 'Invalid gift source or target')
        if (fromPlayer.id === toPlayer.id) return this.sendError(sender, 'You cannot gift coins to yourself')
        if (!Number.isFinite(amount) || amount <= 0) return this.sendError(sender, 'Gift amount must be greater than 0')
        if (!this.canAfford(fromPlayer, amount)) return this.sendError(sender, 'Insufficient coins to gift')

        fromPlayer.coins -= amount
        toPlayer.coins += amount
        fromPlayer.stats.totalLost += amount
        toPlayer.stats.totalEarned += amount

        if (this.isEliminated(fromPlayer)) {
          this.addEvent({ type: 'gift', playerId: fromPlayer.id, message: `${fromPlayer.displayName} has been eliminated` })
        }
        if (!this.isEliminated(toPlayer)) {
          this.addEvent({ type: 'gift', playerId: toPlayer.id, message: `${toPlayer.displayName} is back in play` })
        }

        this.addEvent({
          type: 'gift',
          playerId: fromPlayer.id,
          playerName: fromPlayer.displayName,
          targetId: toPlayer.id,
          targetName: toPlayer.displayName,
          amount,
          message: `${fromPlayer.displayName} gifted ${amount} coins to ${toPlayer.displayName}`
        })

        this.broadcastSync()
      } else if (msg.type === 'FORCE_SYNC') {
        this.broadcastSync()
      }
    } catch (_error) {
      // Ignore malformed messages.
    }
  }
}
