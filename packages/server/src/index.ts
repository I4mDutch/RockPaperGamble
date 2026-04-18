import type * as Party from "partykit/server";
import { GameSession, Player, GamePhase, RPSChoice, Duel, RPSRound, Bet } from "@rpg/shared";
import { getPlayerCoins, updatePlayerCoins } from './db';

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
      case "RESULTS":
        this.startNewRound();
        break;
    }
  }

  startNewRound() {
    this.session.phase = "CHALLENGE_SELECT";
    this.session.timeLeft = 15;
    this.currentDuel = null;
    this.broadcastSync();
  }

  startRPSRound() {
    this.session.phase = "RPS_ROUND";
    this.session.timeLeft = 20;
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

    const persistentCoins = await getPlayerCoins(userId);

    const existingPlayer = this.session.players.find((p) => p.id === userId);
    if (!existingPlayer) {
      const newPlayer: Player = {
        id: userId,
        displayName: displayName,
        coins: persistentCoins,
        isConnected: true,
        role: "spectator",
        stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0 },
      };
      this.session.players.push(newPlayer);
    } else {
      existingPlayer.isConnected = true;
      existingPlayer.coins = persistentCoins;
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
        this.handleSelectChallenger(userId, msg.targetId);
        break;
      case "PLACE_BET":
        this.handlePlaceBet(userId, msg.targetId, msg.amount);
        break;
      case "LOCK_CHOICE":
        this.handleLockChoice(userId, msg.choice);
        break;
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
    this.session.timeLeft = 15;
    this.session.players.forEach(p => {
      p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator";
    });
    this.currentDuel = null;
    this.broadcastSync();
  }

  handleSelectChallenger(userId: string, targetId: string) {
    if (this.session.phase !== "CHALLENGE_SELECT") return;
    const challenger = this.session.players.find(p => p.id === userId);
    if (!challenger || challenger.role !== "challenger") return;

    const challengee = this.session.players.find(p => p.id === targetId);
    if (!challengee) return;

    challengee.role = "challengee";
    this.session.phase = "BETTING";
    this.session.timeLeft = 15;
    
    const duelId = `duel_${Date.now()}`;
    this.session.currentDuelId = duelId;
    this.session.currentDuel = {
      id: duelId,
      challengerId: userId,
      challengeeId: targetId,
      rounds: [],
      bets: [],
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
    
    // PREVENT DOUBLE BETTING: Check if this player already has a bet in this duel
    const existingBet = this.currentDuel.bets.find(b => b.playerId === userId);
    if (existingBet) return;
    
    player.coins -= amount;
    updatePlayerCoins(userId, player.coins);
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
    if (!currentRound || currentRound.status === "completed") {
      currentRound = {
        choices: {},
        status: "waiting",
        winnerId: null
      };
      this.currentDuel.rounds.push(currentRound);
    }

    currentRound.choices[userId] = choice;

    const { challengerId, challengeeId } = this.currentDuel;
    if (currentRound.choices[challengerId] && currentRound.choices[challengeeId]) {
      this.resolveRPS(currentRound);
    }

    this.broadcastSync();
  }

  resolveRPS(round: RPSRound) {
    const { challengerId, challengeeId } = this.currentDuel!;
    const c1 = round.choices[challengerId];
    const c2 = round.choices[challengeeId];

    if (c1 === c2) {
      round.winnerId = "draw";
    } else if (
      (c1 === "rock" && c2 === "scissors") ||
      (c1 === "paper" && c2 === "rock") ||
      (c1 === "scissors" && c2 === "paper")
    ) {
      round.winnerId = challengerId;
    } else {
      round.winnerId = challengeeId;
    }

    round.status = "completed";
    this.resolveDuel(round.winnerId!);
  }

  resolveDuel(winnerId: string) {
    if (!this.currentDuel) return;
    
    this.currentDuel.status = "finished";
    this.currentDuel.winnerId = winnerId;
    
    // "Double or Nothing" or "Push" on Tie
    this.currentDuel.bets.forEach(bet => {
      const player = this.session.players.find(p => p.id === bet.playerId);
      if (!player) return;

      if (winnerId === "draw") {
        // TIE: Return original bet amount (Push)
        player.coins += bet.amount;
        updatePlayerCoins(player.id, player.coins);
        bet.payout = 0; // Or we can show +0 or just show it was a push
      } else if (bet.targetId === winnerId) {
        // WIN: Double the bet
        const payout = bet.amount * 2;
        player.coins += payout;
        updatePlayerCoins(player.id, player.coins);
        bet.payout = payout - bet.amount; // Net gain for display
      } else {
        // LOSS: Lost the amount
        bet.payout = -bet.amount;
      }
    });

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
