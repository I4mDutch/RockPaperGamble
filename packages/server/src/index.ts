import type * as Party from "partykit/server";
import { GameSession, Player, GamePhase, RPSChoice, Duel, RPSRound, Bet, GameSettings, RoundHistory, GameEvent, GameEventType } from "@rpg/shared";
import { getPlayerStats, updatePlayerProfile } from './db';

export default class Server implements Party.Server {
  session: GameSession;
  currentDuel: Duel | null = null;

  constructor(readonly room: Party.Room) {
    this.session = {
      id: room.id,
      hostId: "",
      players: [],
      roundNumber: 0,
      turnOrder: [],
      activePlayerIndex: 0,
      status: "lobby",
      phase: "WAITING",
      createdAt: Date.now(),
      currentDuelId: null,
      timeLeft: 0,
      settings: this.getDefaultSettings(),
      playerTurnOrder: [],
      roundHistory: [],
      events: [],
    };

    // Start the global timer loop
    setInterval(() => this.tick(), 1000);
  }

  getDefaultSettings(): GameSettings {
    return {
      startingMoney: 1000,
      balanceModifiers: {
        lossModifier: 0,
        winModifier: 0,
      },
    };
  }

  calculateModifiers(startingMoney: number): { lossModifier: number; winModifier: number } {
    if (startingMoney >= 500000) {
      return { lossModifier: 50, winModifier: -35 };
    } else if (startingMoney >= 100000) {
      return { lossModifier: 25, winModifier: -15 };
    } else if (startingMoney >= 10000) {
      return { lossModifier: 0, winModifier: 0 };
    } else if (startingMoney >= 1000) {
      return { lossModifier: 0, winModifier: 0 };
    } else {
      return { lossModifier: -50, winModifier: 35 };
    }
  }

  generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addEvent(type: GameEventType, message: string, playerId?: string, data?: Record<string, any>) {
    if (!this.session.events) {
      this.session.events = [];
    }
    
    const event: GameEvent = {
      id: this.generateEventId(),
      type,
      message,
      timestamp: Date.now(),
      playerId,
      data,
    };
    
    this.session.events.push(event);
    
    // Keep only last 50 events
    if (this.session.events.length > 50) {
      this.session.events = this.session.events.slice(-50);
    }
    
    this.broadcastEvent(event);
  }

  broadcastEvent(event: GameEvent) {
    this.room.broadcast(JSON.stringify({
      type: "EVENT",
      event,
    }));
  }

  addRoundHistory(winnerId: string, challengerId: string, challengeeId: string, totalPot: number) {
    if (!this.session.roundHistory) {
      this.session.roundHistory = [];
    }
    
    const round: RoundHistory = {
      roundNumber: this.session.roundNumber,
      winnerId,
      challengerId,
      challengeeId,
      totalPot,
      timestamp: Date.now(),
    };
    
    this.session.roundHistory.push(round);
    
    // Keep only last 10 rounds
    if (this.session.roundHistory.length > 10) {
      this.session.roundHistory = this.session.roundHistory.slice(-10);
    }
  }

  canStartGame(): boolean {
    const nonHostPlayers = this.session.players.filter(p => p.id !== this.session.hostId);
    if (nonHostPlayers.length === 0) return false;
    return nonHostPlayers.every(p => p.isReady);
  }

  tick() {
    if (this.session.status !== "in_progress") return;
    if (this.session.timeLeft > 0) {
      this.session.timeLeft--;
      if (this.session.timeLeft === 0) {
        this.handlePhaseTimeout();
      }
      this.broadcastSync();
    }
  }

  handlePhaseTimeout() {
    switch (this.session.phase) {
      case "BETTING":
        this.startRPSRound();
        break;
      case "RPS_ROUND":
        this.handleRPSRoundTimeout();
        break;
      case "RESULTS":
        this.startNewRound();
        break;
    }
  }

  handleRPSRoundTimeout() {
    if (!this.currentDuel) return;
    
    const lastRound = this.currentDuel.rounds[this.currentDuel.rounds.length - 1];
    
    // If the round was already resolved (we were just showing the 5s result overlay)
    if (lastRound && lastRound.winner) {
      // Start next round in series
      this.session.timeLeft = 15;
      this.currentDuel.rounds.push({
        roundNumber: this.currentDuel.rounds.length + 1,
        winner: undefined
      });
    } else {
      // The 20s timer actually ran out without both players picking
      // For now, let's just force a tie to keep the game moving
      if (lastRound) {
        lastRound.winner = "tie";
        this.session.timeLeft = 3; // Show "TIE" result for 3 seconds
      }
    }
    this.broadcastSync();
  }

  startRPSRound() {
    this.session.phase = "RPS_ROUND";
    this.session.timeLeft = 15;
    this.broadcastSync();
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const query = new URL(ctx.request.url).searchParams;
    const userId = query.get("userId");
    const displayName = query.get("displayName") || "Unknown Player";

    if (!userId) {
      conn.close();
      return;
    }

    // Store the userId on the connection state for easy access in onMessage
    conn.setState({ userId });

    if (!this.session.hostId) {
      this.session.hostId = userId;
    }

    try {
      const queryAvatarUrl = query.get("avatarUrl") || undefined;
      const { coins, winStreak, avatarUrl: dbAvatarUrl } = await getPlayerStats(userId, { 
        displayName, 
        avatarUrl: queryAvatarUrl 
      });
      const avatarUrl = dbAvatarUrl || queryAvatarUrl;

      const existingPlayer = this.session.players.find((p) => p.id === userId);
      if (!existingPlayer) {
        const newPlayer: Player = {
          id: userId,
          displayName: displayName,
          avatarUrl: avatarUrl,
          coins: coins,
          isConnected: true,
          isReady: false,
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: winStreak },
        };
        this.session.players.push(newPlayer);
        this.addEvent("PLAYER_JOINED", `${displayName} joined the game`, userId);
      } else {
        existingPlayer.isConnected = true;
        existingPlayer.displayName = displayName;
        existingPlayer.avatarUrl = avatarUrl;
        existingPlayer.coins = coins;
        // Ensure stats object exists before updating winStreak
        if (!existingPlayer.stats) {
          existingPlayer.stats = { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0 };
        }
        existingPlayer.stats.winStreak = winStreak;
      }
    } catch (err) {
      console.error("Error in onConnect:", err);
      // Fallback for safety to prevent connection drop
      if (!this.session.players.find(p => p.id === userId)) {
        this.session.players.push({
          id: userId,
          displayName,
          coins: 1000,
          isConnected: true,
          isReady: false,
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0 }
        });
        this.addEvent("PLAYER_JOINED", `${displayName} joined the game`, userId);
      }
    }

    this.broadcastSync();
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message);
    const userId = sender.state?.userId;

    if (!userId) return;

    switch (msg.type) {
      case "START_GAME":
        this.handleStartGame(userId);
        break;
      case "SELECT_CHALLENGER":
        this.handleSelectChallenger(userId, msg.targetId, msg.amount);
        break;
      case "PLACE_BET":
        this.handlePlaceBet(userId, msg.targetId, msg.amount);
        break;
      case "LOCK_CHOICE":
        this.handleLockChoice(userId, msg.choice);
        break;
      case "UPDATE_PROFILE":
        this.handleUpdateProfile(userId, msg.displayName, msg.avatarUrl);
        break;
      case "GIFT_COINS":
        this.handleGiftCoins(userId, msg.targetId, msg.amount);
        break;
      case "READY_PLAYER":
        this.handleReadyPlayer(userId, true);
        break;
      case "UNREADY_PLAYER":
        this.handleReadyPlayer(userId, false);
        break;
      case "UPDATE_SETTINGS":
        this.handleUpdateSettings(userId, msg.settings);
        break;
      case "SET_STARTING_PLAYER":
        this.handleSetStartingPlayer(userId, msg.targetId);
        break;
    }
  }

  async handleUpdateProfile(userId: string, displayName: string, avatarUrl: string) {
    const player = this.session.players.find(p => p.id === userId);
    if (player) {
      player.displayName = displayName;
      player.avatarUrl = avatarUrl;
      this.broadcastSync();
      
      // Persist the changes to the database
      try {
        await updatePlayerProfile(userId, { displayName, avatarUrl } as any);
      } catch (err) {
        console.error("Failed to persist profile update:", err);
      }
    }
  }

  handleStartGame(userId: string) {
    if (this.session.hostId !== userId) return;
    if (!this.canStartGame()) return;
    
    this.session.status = "in_progress";
    
    // Initialize playerTurnOrder if not set
    if (!this.session.playerTurnOrder || this.session.playerTurnOrder.length === 0) {
      this.session.playerTurnOrder = this.session.players.map(p => p.id);
    }
    
    // Use playerTurnOrder for turn order if set, otherwise fall back to lobby order
    this.session.turnOrder = this.session.playerTurnOrder.length > 0 
      ? [...this.session.playerTurnOrder]
      : this.session.players.map(p => p.id);
    
    // Apply starting money if settings exist
    if (this.session.settings?.startingMoney) {
      const startingMoney = this.session.settings.startingMoney;
      this.session.players.forEach(p => {
        p.coins = startingMoney;
      });
    }
    
    this.addEvent("GAME_STARTED", "Game started!");
    this.startNewRound();
  }

  handleReadyPlayer(userId: string, isReady: boolean) {
    const player = this.session.players.find(p => p.id === userId);
    if (!player) return;
    
    player.isReady = isReady;
    this.addEvent(
      isReady ? "PLAYER_READY" : "PLAYER_UNREADY",
      `${player.displayName} is ${isReady ? 'ready' : 'not ready'}`,
      userId
    );
    this.broadcastSync();
  }

  handleUpdateSettings(userId: string, settings: Partial<GameSettings>) {
    if (this.session.hostId !== userId) return;
    
    if (!this.session.settings) {
      this.session.settings = this.getDefaultSettings();
    }
    
    if (settings.startingMoney !== undefined) {
      // Clamp starting money to valid range
      const startingMoney = Math.max(100, Math.min(1000000, settings.startingMoney));
      this.session.settings.startingMoney = startingMoney;
      this.session.settings.balanceModifiers = this.calculateModifiers(startingMoney);
    }
    
    this.addEvent("SETTINGS_UPDATED", `Game settings updated`, userId, { settings: this.session.settings });
    this.broadcastSync();
  }

  handleSetStartingPlayer(userId: string, targetId: string) {
    if (this.session.hostId !== userId) return;
    if (this.session.status !== "lobby") return;
    
    const targetPlayer = this.session.players.find(p => p.id === targetId);
    if (!targetPlayer) return;
    
    // Calculate turn order: target first, then others in lobby order
    const lobbyOrder = this.session.players.map(p => p.id);
    const filtered = lobbyOrder.filter(id => id !== targetId);
    this.session.playerTurnOrder = [targetId, ...filtered];
    
    this.addEvent("STARTING_PLAYER_SET", `${targetPlayer.displayName} will start first`, targetId);
    this.broadcastSync();
  }

  startNewRound() {
    this.session.roundNumber++;
    this.session.phase = "CHALLENGE_SELECT";
    this.session.timeLeft = 10;

    // Skip broke players in turn order
    let attempts = 0;
    while (attempts < this.session.turnOrder.length) {
      const candidateId = this.session.turnOrder[this.session.activePlayerIndex];
      const candidate = this.session.players.find(p => p.id === candidateId);
      if (candidate && candidate.coins > 0) break;
      this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
      attempts++;
    }

    this.session.players.forEach(p => {
      p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator";
    });
    this.currentDuel = null;
    this.broadcastSync();
  }

  handleGiftCoins(senderId: string, targetId: string, amount: number) {
    if (!amount || amount <= 0) return;
    const sender = this.session.players.find(p => p.id === senderId);
    const receiver = this.session.players.find(p => p.id === targetId);
    if (!sender || !receiver || sender.id === receiver.id) return;
    if (sender.coins < amount) return;

    sender.coins -= amount;
    receiver.coins += amount;
    updatePlayerProfile(sender.id, { coins: sender.coins });
    updatePlayerProfile(receiver.id, { coins: receiver.coins });
    this.addEvent("BET_PLACED", `${sender.displayName} gifted ${amount} coins to ${receiver.displayName}`, senderId, { amount, targetId });
    this.broadcastSync();
  }

  handleSelectChallenger(userId: string, targetId: string, amount: number = 0) {
    if (this.session.phase !== "CHALLENGE_SELECT") return;
    const challenger = this.session.players.find(p => p.id === userId);
    if (!challenger || challenger.role !== "challenger") return;
    if (challenger.coins <= 0) return; // broke players can't challenge

    const challengee = this.session.players.find(p => p.id === targetId);
    if (!challengee) return;
    if (challengee.coins <= 0) return; // broke players can't be challenged

    // Both players must be able to afford the bet
    const wager = Math.min(amount, challenger.coins, challengee.coins);

    challengee.role = "challengee";
    this.session.phase = "BETTING";
    this.session.timeLeft = 28;
    
    // Deduct wagers
    if (wager > 0) {
      challenger.coins -= wager;
      challengee.coins -= wager;
      updatePlayerProfile(challenger.id, { coins: challenger.coins });
      updatePlayerProfile(challengee.id, { coins: challengee.coins });
    }

    const duelId = `duel_${Date.now()}`;
    this.session.currentDuelId = duelId;
    this.session.currentDuel = {
      id: duelId,
      challengerId: userId,
      challengeeId: targetId,
      rounds: [],
      seriesScore: {
        [userId]: 0,
        [targetId]: 0
      },
      targetWins: 3,
      bets: wager > 0 ? [
        // Represent the match wagers as bets so they go into the total prize pool
        {
          playerId: challenger.id,
          targetId: challenger.id, // bet on themselves
          amount: wager,
          placedAt: Date.now(),
          locked: true,
          payout: 0
        },
        {
          playerId: challengee.id,
          targetId: challengee.id, // bet on themselves
          amount: wager,
          placedAt: Date.now(),
          locked: true,
          payout: 0
        }
      ] : [],
      status: "active",
      startedAt: Date.now()
    };
    this.currentDuel = this.session.currentDuel;
    
    this.addEvent("DUEL_STARTED", `${challenger.displayName} challenged ${challengee.displayName} for ${wager} coins`, userId, { wager, targetId });
    this.broadcastSync();
  }

  handlePlaceBet(userId: string, targetId: string, amount: number) {
    if (this.session.phase !== "BETTING" || !this.currentDuel) return;
    const player = this.session.players.find(p => p.id === userId);
    if (!player || player.coins < amount) return;
    
    const existingBet = this.currentDuel.bets.find(b => b.playerId === userId);
    if (existingBet) return;
    
    player.coins -= amount;
    updatePlayerProfile(userId, { coins: player.coins });
    this.currentDuel.bets.push({
      playerId: userId,
      targetId,
      amount,
      placedAt: Date.now(),
      locked: true,
      payout: 0
    });
    
    this.addEvent("BET_PLACED", `${player.displayName} bet ${amount} coins`, userId, { amount, targetId });
    this.broadcastSync();
  }

  handleLockChoice(userId: string, choice: RPSChoice) {
    if (this.session.phase !== "RPS_ROUND" || !this.currentDuel) return;
    
    let currentRound = this.currentDuel.rounds[this.currentDuel.rounds.length - 1];
    if (!currentRound || currentRound.winner) {
      currentRound = {
        roundNumber: (this.currentDuel.rounds.length) + 1,
        challengerChoice: undefined,
        challengeeChoice: undefined,
        winner: undefined
      };
      this.currentDuel.rounds.push(currentRound);
    }

    if (userId === this.currentDuel.challengerId) {
      currentRound.challengerChoice = choice;
    } else if (userId === this.currentDuel.challengeeId) {
      currentRound.challengeeChoice = choice;
    }

    if (currentRound.challengerChoice && currentRound.challengeeChoice) {
      this.resolveRPS(currentRound);
    }

    this.broadcastSync();
  }

  resolveRPS(round: RPSRound) {
    const { challengerId, challengeeId, seriesScore, targetWins } = this.currentDuel!;
    const c1 = round.challengerChoice;
    const c2 = round.challengeeChoice;

    if (c1 === c2) {
      round.winner = "tie";
    } else if (
      (c1 === "rock" && c2 === "scissors") ||
      (c1 === "paper" && c2 === "rock") ||
      (c1 === "scissors" && c2 === "paper")
    ) {
      round.winner = challengerId;
      seriesScore[challengerId]++;
    } else {
      round.winner = challengeeId;
      seriesScore[challengeeId]++;
    }

    round.resolvedAt = Date.now();

    // Check if series is won
    if (round.winner !== "tie" && seriesScore[round.winner] >= targetWins) {
      this.resolveDuel(round.winner);
    } else {
      // Stay in RPS_ROUND but reset for next round after a short delay
      // In a real app, we'd use a phase, but for now we'll just let the UI handle the transition
      // based on the presence of the 'winner' in the last round.
      this.session.timeLeft = 3; // Give players time to see the round result
    }
  }

  resolveDuel(winnerId: string) {
    if (!this.currentDuel) return;
    
    this.currentDuel.status = "finished";
    this.currentDuel.winnerId = winnerId;
    
    const loserId = winnerId === this.currentDuel.challengerId ? this.currentDuel.challengeeId : this.currentDuel.challengerId;

    let totalPool = this.currentDuel.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winner = this.session.players.find(p => p.id === winnerId);
    
    // First, pay out the spectators who won
    this.currentDuel.bets.forEach(bet => {
      const player = this.session.players.find(p => p.id === bet.playerId);
      if (!player) return;

      // Only spectators get the 2x fixed payout
      const isDuelist = player.id === this.currentDuel?.challengerId || player.id === this.currentDuel?.challengeeId;

      if (bet.targetId === winnerId) {
        if (isDuelist) {
          // Duelists will be handled at the end with the remainder of the pool
          bet.payout = 0; // Temporary, will be updated
        } else {
          // Spectators double their money (return bet + profit equal to bet)
          const payout = bet.amount * 2;
          player.coins += payout;
          updatePlayerProfile(player.id, { coins: player.coins });
          bet.payout = bet.amount; // Their profit is 1x their bet
          totalPool -= payout; // Remove their payout from the pool
        }
      } else {
        // Lost bets
        bet.payout = -bet.amount;
        // The money stays in the pool for the winner
      }
    });

    // Finally, the duel winner gets whatever is left in the pool
    if (winner) {
      winner.coins += Math.max(0, totalPool); // Should not be negative, but safety first
      updatePlayerProfile(winner.id, { coins: winner.coins });
      
      // Update the winner's bet payout record for the UI
      const winnerBet = this.currentDuel.bets.find(b => b.playerId === winnerId);
      if (winnerBet) {
        // Their profit is the final pool amount minus their original wager
        winnerBet.payout = totalPool - winnerBet.amount;
      }
    }

    // Update Win Streaks
    if (winner) {
      winner.stats.winStreak = (winner.stats.winStreak || 0) + 1;
      updatePlayerProfile(winner.id, { coins: winner.coins, winStreak: winner.stats.winStreak });
    }
    const loser = this.session.players.find(p => p.id === loserId);
    if (loser) {
      loser.stats.winStreak = 0;
      updatePlayerProfile(loser.id, { winStreak: 0 });
    }

    this.session.phase = "RESULTS";
    this.session.timeLeft = 8;
    this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
    
    // Add to round history
    this.addRoundHistory(winnerId, this.currentDuel.challengerId, this.currentDuel.challengeeId, totalPool);
    
    // Add events for winner and loser
    this.addEvent("PLAYER_WON", `${winner?.displayName} won the duel and ${totalPool} coins!`, winnerId, { amount: totalPool });
    this.addEvent("PLAYER_LOST", `${loser?.displayName} lost the duel`, loserId);
    this.addEvent("ROUND_COMPLETED", `Round ${this.session.roundNumber} completed`, undefined, { roundNumber: this.session.roundNumber });
    
    this.broadcastSync();
  }

  broadcastSync() {
    this.room.broadcast(JSON.stringify({
      type: "SYNC",
      session: this.session
    }));
  }
}

Server satisfies Party.Worker;
