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

    setInterval(() => {
      try {
        this.tick()
      } catch (err) {
        console.error('Tick error:', err)
      }
    }, 1000)
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

    for (let i = 0; i < len; i++) {
      this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % len
      const nextId = this.session.turnOrder[this.session.activePlayerIndex]
      const nextPlayer = this.getPlayer(nextId)
      if (nextPlayer && nextPlayer.coins > 0) {
        return
      }
    }
  }

  private startRPSRound() {
    this.session.phase = 'RPS_ROUND'
    this.session.timeLeft = 15
    this.broadcastSync()
  }

  private startNewRound() {
    this.session.roundNumber++
    this.session.phase = 'CHALLENGE_SELECT'
    this.session.timeLeft = 15
    this.updateRolesForChallengeSelect()
    this.session.currentDuel = null
    this.session.currentDuelId = null
    this.broadcastSync()
  }

  private tick() {
    // Allow countdown to run even in lobby status
    if (this.session.countdown !== undefined) {
      if (this.session.countdown > 0) {
        this.session.countdown--
        this.broadcastSync()
      } else {
        this.session.countdown = undefined
        this.session.status = 'in_progress'
        this.startNewRound()
      }
      return
    }

    if (this.session.status !== 'in_progress') return

    if (this.session.timeLeft > 0) {
      this.session.timeLeft--
      if (this.session.timeLeft === 0) {
        this.handlePhaseTimeout()
      }
      this.broadcastSync()
    }
  }

  private handlePhaseTimeout() {
    switch (this.session.phase) {
      case 'BETTING':
        this.startRPSRound()
        break
      case 'RPS_ROUND':
        this.handleRPSRoundTimeout()
        break
      case 'RESULTS':
        this.advanceToNextActivePlayer()
        this.startNewRound()
        break
    }
  }

  private handleRPSRoundTimeout() {
    const duel = this.session.currentDuel
    if (!duel) return

    // If duel is already finished, phase timeout should have been handled by startNewRound via RESULTS
    if (duel.status === 'finished') return

    const lastRound = duel.rounds[duel.rounds.length - 1]
    
    // If we have a winner (either from resolveRPS or a previous timeout), move to next weapon pick
    if (lastRound && lastRound.winner) {
      this.session.timeLeft = 15
      duel.rounds.push({
        roundNumber: duel.rounds.length + 1,
        winner: undefined
      })
      this.broadcastSync()
      return
    }

    // If timeout reached without choices, force a tie
    if (!lastRound) {
      duel.rounds.push({
        roundNumber: 1,
        winner: 'tie',
        resolvedAt: Date.now()
      })
    } else {
      lastRound.winner = 'tie'
      lastRound.resolvedAt = Date.now()
    }
    this.session.timeLeft = 3
    this.broadcastSync()
  }

  private resolveRPS(round: any) {
    const duel = this.session.currentDuel
    if (!duel) return

    const c1 = round.challengerChoice
    const c2 = round.challengeeChoice

    if (c1 === c2) {
      round.winner = 'tie'
    } else if (
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper')
    ) {
      round.winner = duel.challengerId
      duel.seriesScore[duel.challengerId]++
    } else {
      round.winner = duel.challengeeId
      duel.seriesScore[duel.challengeeId]++
    }

    round.resolvedAt = Date.now()

    // Check for match winner (BO5 = 3 wins)
    if (round.winner !== 'tie' && duel.seriesScore[round.winner] >= 3) {
      this.resolveDuel(round.winner)
    } else {
      // 3 second result reveal then handleRPSRoundTimeout will trigger next pick
      this.session.timeLeft = 3
    }
  }

  private resolveDuel(winnerId: string) {
    const duel = this.session.currentDuel
    if (!duel) return

    duel.status = 'finished'
    duel.winnerId = winnerId
    const loserId = winnerId === duel.challengerId ? duel.challengeeId : duel.challengerId

    const totalPool = duel.bets.reduce((sum: number, b: any) => sum + b.amount, 0)
    const winner = this.getPlayer(winnerId)
    const loser = this.getPlayer(loserId)

    if (winner) {
      winner.coins += totalPool
      winner.stats.wins++
      winner.stats.totalEarned += totalPool
      winner.stats.totalWon += totalPool
      winner.stats.winStreak++
      
      // Set payout for winner's wager
      const winnerBet = duel.bets.find((b: any) => b.playerId === winnerId)
      if (winnerBet) {
        winnerBet.payout = totalPool - winnerBet.amount
      }
    }

    if (loser) {
      loser.stats.losses++
      loser.stats.winStreak = 0
      
      // Set payout for loser's wager
      const loserBet = duel.bets.find((b: any) => b.playerId === loserId)
      if (loserBet) {
        loserBet.payout = -loserBet.amount
      }
    }

    // Spectator payouts
    for (const bet of duel.bets) {
      const bettor = this.getPlayer(bet.playerId)
      if (!bettor || bet.playerId === winnerId || bet.playerId === loserId) continue

      if (bet.targetId === winnerId) {
        const reward = bet.amount * 2
        bettor.coins += reward
        bet.payout = reward - bet.amount
        bettor.stats.totalEarned += reward
        bettor.stats.totalWon += reward
      } else {
        bet.payout = -bet.amount
        bettor.stats.totalLost += bet.amount
      }
    }

    this.addEvent({ type: 'win', playerId: winnerId, playerName: winner?.displayName, message: `${winner?.displayName} won the match and ${totalPool.toLocaleString()} coins!` })
    
    this.session.phase = 'RESULTS'
    this.session.timeLeft = 8
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
        if (msg.settings.startingMoney !== undefined) {
          for (const p of this.session.players) p.coins = msg.settings.startingMoney
        }
        this.broadcastSync()
      } else if (msg.type === 'REORDER_PLAYERS') {
        if (this.session.hostId !== userId) return this.sendError(sender, 'Only host can reorder players')
        this.session.turnOrder = msg.turnOrder
        this.broadcastSync()
      } else if (msg.type === 'START_GAME') {
        if (this.session.hostId !== userId) return this.sendError(sender, 'Only host can start the game')
        if (this.session.status !== 'lobby') return
        const allReady = this.session.players.every((p: any) => p.status === 'ready')
        if (!allReady || this.session.players.length < 2) return
        this.addEvent({ type: 'start', playerId: userId, message: 'Match starting!' })
        this.session.countdown = 3
        this.broadcastSync()
      } else if (msg.type === 'SELECT_CHALLENGER') {
        if (this.session.phase !== 'CHALLENGE_SELECT') return this.sendError(sender, 'Not in challenge selection phase')
        const challenger = this.getPlayer(userId)
        const challengee = this.getPlayer(msg.targetId)
        if (!challenger || !challengee || challenger.id === challengee.id) return
        const wager = Number(msg.amount) || 0
        if (challenger.coins < wager || challengee.coins < wager) return

        challenger.coins -= wager
        challengee.coins -= wager

        this.session.currentDuelId = `duel_${Date.now()}`
        this.session.currentDuel = {
          id: this.session.currentDuelId,
          challengerId: challenger.id,
          challengeeId: challengee.id,
          rounds: [],
          seriesScore: { [challenger.id]: 0, [challengee.id]: 0 },
          targetWins: 3,
          status: 'active',
          bets: wager > 0 ? [
            { playerId: challenger.id, targetId: challenger.id, amount: wager, placedAt: Date.now(), locked: true },
            { playerId: challengee.id, targetId: challengee.id, amount: wager, placedAt: Date.now(), locked: true }
          ] : [],
          startedAt: Date.now()
        }
        this.session.phase = 'BETTING'
        this.session.timeLeft = 20
        challenger.role = 'challenger'
        challengee.role = 'challengee'
        
        const eventMessage = wager > 0 
          ? `${challenger.displayName} challenged ${challengee.displayName} for ${wager.toLocaleString()} 🪙`
          : `${challenger.displayName} challenged ${challengee.displayName}`

        this.addEvent({ 
          type: 'bet', 
          playerId: userId, 
          playerName: challenger.displayName, 
          message: eventMessage
        })
        this.broadcastSync()
      } else if (msg.type === 'PLACE_BET') {
        if (!this.session.currentDuel || this.session.phase !== 'BETTING') return
        const p = this.getPlayer(userId)
        const target = this.getPlayer(msg.targetId)
        if (!p || !target || p.coins < msg.amount) return
        
        p.coins -= msg.amount
        this.session.currentDuel.bets.push({
          playerId: userId,
          targetId: msg.targetId,
          amount: msg.amount,
          placedAt: Date.now(),
          locked: true
        })
        
        this.addEvent({
          type: 'bet',
          playerId: userId,
          playerName: p.displayName,
          message: `${p.displayName} bet ${msg.amount.toLocaleString()} 🪙 on ${target.displayName}`
        })
        this.broadcastSync()
      } else if (msg.type === 'LOCK_CHOICE') {
        if (this.session.phase !== 'RPS_ROUND' || !this.session.currentDuel) return
        const duel = this.session.currentDuel
        let round = duel.rounds[duel.rounds.length - 1]
        
        if (!round || round.winner) {
          round = { roundNumber: duel.rounds.length + 1, winner: undefined }
          duel.rounds.push(round)
        }
        
        if (userId === duel.challengerId) round.challengerChoice = msg.choice
        else if (userId === duel.challengeeId) round.challengeeChoice = msg.choice

        if (round.challengerChoice && round.challengeeChoice) {
          this.resolveRPS(round)
        }
        this.broadcastSync()
      } else if (msg.type === 'GIFT_COINS') {
        const fromPlayer = this.getPlayer(userId)
        const toPlayer = this.getPlayer(msg.targetId)
        const amount = Number(msg.amount)
        if (fromPlayer && toPlayer && fromPlayer.coins >= amount) {
          fromPlayer.coins -= amount
          toPlayer.coins += amount
          this.addEvent({
            type: 'gift',
            playerId: userId,
            playerName: fromPlayer.displayName,
            message: `${fromPlayer.displayName} gifted ${amount.toLocaleString()} 🪙 to ${toPlayer.displayName}`
          })
          this.broadcastSync()
        }
      } else if (msg.type === 'FORCE_SYNC') {
        this.broadcastSync()
      }
    } catch (_error) {}
  }
}
