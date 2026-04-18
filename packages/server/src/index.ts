import type * as Party from "partykit/server";
import { GameSession, Player, GamePhase, RPSChoice, Duel, RPSRound, Bet } from "@rpg/shared";
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
    };

    // Start the global timer loop
    setInterval(() => this.tick(), 1000);
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
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: winStreak },
        };
        this.session.players.push(newPlayer);
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
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0 }
        });
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
    this.session.status = "in_progress";
    this.session.turnOrder = this.session.players.map(p => p.id);
    this.startNewRound();
  }

  startNewRound() {
    this.session.roundNumber++;
    this.session.phase = "CHALLENGE_SELECT";
    this.session.timeLeft = 10;
    this.session.players.forEach(p => {
      p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator";
    });
    this.currentDuel = null;
    this.broadcastSync();
  }

  handleSelectChallenger(userId: string, targetId: string, amount: number = 0) {
    if (this.session.phase !== "CHALLENGE_SELECT") return;
    const challenger = this.session.players.find(p => p.id === userId);
    if (!challenger || challenger.role !== "challenger") return;

    const challengee = this.session.players.find(p => p.id === targetId);
    if (!challengee) return;

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

    const totalPool = this.currentDuel.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winner = this.session.players.find(p => p.id === winnerId);
    
    if (winner) {
      winner.coins += totalPool;
    }

    this.currentDuel.bets.forEach(bet => {
      const player = this.session.players.find(p => p.id === bet.playerId);
      if (!player) return;

      if (bet.targetId === winnerId) {
        if (player.id === winnerId) {
          // The winner took the whole pool. Their tracked profit is totalPool - their wager.
          bet.payout = totalPool - bet.amount;
        } else {
          // Spectators double their money
          const payout = bet.amount * 2;
          player.coins += payout;
          updatePlayerProfile(player.id, { coins: player.coins });
          bet.payout = payout - bet.amount;
        }
      } else {
        bet.payout = -bet.amount;
      }
    });

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
