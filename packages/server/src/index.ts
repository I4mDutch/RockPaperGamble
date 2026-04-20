import type * as Party from "partykit/server";
import { GameSession, Player, GamePhase, RPSChoice, Duel, RPSRound, Bet, GameSettings, RoundHistory, GameEvent, getBalanceModifiers, getAvatarColor, getInitials } from "@rpg/shared";
import { getPlayerStats, updatePlayerProfile } from './db';

const DEFAULT_SETTINGS: GameSettings = {
  startingMoney: 10000,
  lossModifier: 0,
  winModifier: 0,
  highStakesMode: false,
};

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
      settings: { ...DEFAULT_SETTINGS },
      roundHistory: [],
      eventFeed: [],
    };

    // Start the global timer loop
    setInterval(() => this.tick(), 1000);
    console.log(`[INIT] Server started for room: ${room.id}`);
  }

  // Force everyone into sync
  broadcastSync() {
    // Ensure turnOrder is always synced before broadcasting in lobby
    if (this.session.status === "lobby") {
      this.syncTurnOrder();
    }
    this.room.broadcast(JSON.stringify({
      type: "SYNC",
      session: this.session
    }));
  }

  // Sync turnOrder with player list
  syncTurnOrder() {
    if (this.session.status !== "lobby") return;
    
    const playerIds = this.session.players.map(p => p.id);
    
    // Ensure turnOrder is a fresh array
    let newOrder = Array.isArray(this.session.turnOrder) 
      ? [...this.session.turnOrder].filter(id => playerIds.includes(id))
      : [];
    
    // Append any missing players
    playerIds.forEach(id => {
      if (!newOrder.includes(id)) {
        newOrder.push(id);
      }
    });
    
    // Remove any players no longer in the game
    newOrder = newOrder.filter(id => playerIds.includes(id));
    
    this.session.turnOrder = newOrder;
    console.log(`[SYNC] turnOrder: ${JSON.stringify(this.session.turnOrder)}`);
  }

  // Add event to feed
  addEvent(event: Omit<GameEvent, 'id' | 'timestamp'>) {
    const newEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };
    this.session.eventFeed.push(newEvent);
    if (this.session.eventFeed.length > 50) this.session.eventFeed = this.session.eventFeed.slice(-50);
  }

  tick() {
    if (this.session.status !== "in_progress") return;
    if (this.session.timeLeft > 0) {
      this.session.timeLeft--;
      if (this.session.timeLeft === 0) this.handlePhaseTimeout();
      this.broadcastSync();
    }
  }

  handlePhaseTimeout() {
    switch (this.session.phase) {
      case "BETTING": this.startRPSRound(); break;
      case "RPS_ROUND": this.handleRPSRoundTimeout(); break;
      case "RESULTS": this.startNewRound(); break;
    }
  }

  handleRPSRoundTimeout() {
    if (!this.currentDuel) return;
    const lastRound = this.currentDuel.rounds[this.currentDuel.rounds.length - 1];
    if (lastRound && lastRound.winner) {
      this.session.timeLeft = 15;
      this.currentDuel.rounds.push({ roundNumber: this.currentDuel.rounds.length + 1, winner: undefined });
    } else if (lastRound) {
      lastRound.winner = "tie";
      this.session.timeLeft = 3;
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
    if (!userId) { conn.close(); return; }

    conn.setState({ userId });
    console.log(`[CONNECT] User: ${userId} (${displayName})`);

    if (!this.session.hostId) this.session.hostId = userId;

    try {
      const avatarUrlQuery = query.get("avatarUrl") || undefined;
      const stats = await getPlayerStats(userId, { displayName, avatarUrl: avatarUrlQuery });
      
      const avatarUrl = stats.avatarUrl || avatarUrlQuery;
      const avatarColor = getAvatarColor(userId);
      const initials = getInitials(displayName);
      const startMoney = this.session.settings?.startingMoney || DEFAULT_SETTINGS.startingMoney;

      const pIdx = this.session.players.findIndex(p => p.id === userId);
      const pData: Player = {
        id: userId, displayName, avatarUrl, avatarColor, initials,
        coins: startMoney, isConnected: true, role: "spectator",
        status: "not_ready", // Explicit default
        stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: stats.winStreak || 0, totalWon: 0, totalLost: 0 }
      };

      if (pIdx === -1) {
        console.log(`[JOIN] Adding player ${userId}`);
        this.session.players.push(pData);
        this.addEvent({ type: "join", playerId: userId, playerName: displayName, message: `${displayName} joined` });
      } else {
        console.log(`[RECONN] Updating player ${userId}`);
        const existing = this.session.players[pIdx];
        this.session.players[pIdx] = {
          ...pData,
          coins: existing.coins ?? pData.coins,
          status: (existing.status === "ready" || existing.status === "not_ready") ? existing.status : "not_ready",
          stats: { 
            ...pData.stats, 
            ...(existing.stats || {}), 
            winStreak: Math.max(stats.winStreak || 0, existing.stats?.winStreak || 0) 
          }
        };
      }
      this.syncTurnOrder();
    } catch (err) {
      console.error("[ERR] onConnect:", err);
      // Failsafe
      if (!this.session.players.find(p => p.id === userId)) {
        this.session.players.push({
          id: userId, displayName, avatarColor: getAvatarColor(userId), initials: getInitials(displayName),
          coins: DEFAULT_SETTINGS.startingMoney, isConnected: true, role: "spectator", status: "not_ready",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0, totalWon: 0, totalLost: 0 }
        });
        this.syncTurnOrder();
      }
    }
    this.broadcastSync();
  }

  onClose(conn: Party.Connection) {
    const userId = conn.state?.userId;
    if (!userId) return;
    const player = this.session.players.find(p => p.id === userId);
    if (player) {
      player.isConnected = false;
      if (this.session.status === "lobby") {
        this.session.players = this.session.players.filter(p => p.id !== userId);
        this.syncTurnOrder();
        if (this.session.hostId === userId && this.session.players.length > 0) this.session.hostId = this.session.players[0].id;
      }
      this.addEvent({ type: "leave", playerId: userId, playerName: player.displayName, message: `${player.displayName} left` });
    }
    this.broadcastSync();
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message);
    const userId = sender.state?.userId;
    if (!userId) return;

    switch (msg.type) {
      case "START_GAME": this.handleStartGame(userId); break;
      case "SELECT_CHALLENGER": this.handleSelectChallenger(userId, msg.targetId, msg.amount); break;
      case "PLACE_BET": this.handlePlaceBet(userId, msg.targetId, msg.amount); break;
      case "LOCK_CHOICE": this.handleLockChoice(userId, msg.choice); break;
      case "UPDATE_PROFILE": this.handleUpdateProfile(userId, msg.displayName, msg.avatarUrl); break;
      case "GIFT_COINS": this.handleGiftCoins(userId, msg.targetId, msg.amount); break;
      case "UPDATE_SETTINGS": this.handleUpdateSettings(userId, msg.settings); break;
      case "REORDER_PLAYERS": this.handleReorderPlayers(userId, msg.turnOrder); break;
      case "SET_READY": this.handleSetReady(userId, msg.ready); break;
      case "FORCE_SYNC": this.syncTurnOrder(); this.broadcastSync(); break;
    }
  }

  handleUpdateSettings(userId: string, settings: Partial<GameSettings>) {
    if (this.session.hostId !== userId || this.session.status !== "lobby") return;
    if (settings.startingMoney !== undefined) {
      const mod = getBalanceModifiers(settings.startingMoney);
      this.session.settings = { ...this.session.settings, startingMoney: settings.startingMoney, lossModifier: mod.loss, winModifier: mod.win, highStakesMode: mod.highStakes };
    }
    this.broadcastSync();
  }

  handleReorderPlayers(userId: string, newTurnOrder: string[]) {
    console.log(`[REORDER] Request from ${userId}`);
    if (this.session.hostId !== userId || this.session.status !== "lobby") return;
    const curIds = this.session.players.map(p => p.id).sort();
    const newIds = [...newTurnOrder].sort();
    if (JSON.stringify(curIds) === JSON.stringify(newIds)) {
      this.session.turnOrder = [...newTurnOrder];
      console.log(`[REORDER] Success: ${JSON.stringify(this.session.turnOrder)}`);
    } else {
      console.warn(`[REORDER] Fail: Mismatch. Cur: ${curIds}, New: ${newIds}`);
      this.syncTurnOrder();
    }
    this.broadcastSync();
  }

  handleSetReady(userId: string, ready: boolean) {
    const idx = this.session.players.findIndex(p => p.id === userId);
    if (idx !== -1) {
      this.session.players[idx] = { ...this.session.players[idx], status: ready ? "ready" : "not_ready" };
      console.log(`[READY] ${this.session.players[idx].displayName} is now ${this.session.players[idx].status}`);
      this.addEvent({ type: "ready", playerId: userId, playerName: this.session.players[idx].displayName, message: `${this.session.players[idx].displayName} is ${ready ? 'ready' : 'not ready'}` });
      this.broadcastSync();
    }
  }

  async handleUpdateProfile(userId: string, displayName: string, avatarUrl: string) {
    const player = this.session.players.find(p => p.id === userId);
    if (player) {
      player.displayName = displayName; player.avatarUrl = avatarUrl;
      this.broadcastSync();
      try { await updatePlayerProfile(userId, { displayName, avatarUrl } as any); } catch (err) { console.error("[ERR] Profile:", err); }
    }
  }

  handleStartGame(userId: string) {
    if (this.session.hostId !== userId) return;
    if (!this.session.players.every(p => p.status === "ready") || this.session.players.length < 2) return;
    this.addEvent({ type: "start", playerId: userId, message: "Match starting!" });
    this.session.countdown = 3;
    this.broadcastSync();
    const int = setInterval(() => {
      if (this.session.countdown && this.session.countdown > 1) { this.session.countdown--; this.broadcastSync(); }
      else { clearInterval(int); this.session.countdown = undefined; this.session.status = "in_progress"; this.startNewRound(); }
    }, 1000);
  }

  startNewRound() {
    this.session.roundNumber++; this.session.phase = "CHALLENGE_SELECT"; this.session.timeLeft = 10;
    let attempts = 0;
    while (attempts < this.session.turnOrder.length) {
      const cId = this.session.turnOrder[this.session.activePlayerIndex];
      const c = this.session.players.find(p => p.id === cId);
      if (c && c.coins > 0) break;
      this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
      attempts++;
    }
    this.session.players.forEach(p => { p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator"; });
    this.currentDuel = null;
    this.broadcastSync();
  }

  handleGiftCoins(sId: string, tId: string, amt: number) {
    if (!amt || amt <= 0) return;
    const s = this.session.players.find(p => p.id === sId);
    const r = this.session.players.find(p => p.id === tId);
    if (!s || !r || s.id === r.id || s.coins < amt) return;
    s.coins -= amt; r.coins += amt;
    updatePlayerProfile(s.id, { coins: s.coins }); updatePlayerProfile(r.id, { coins: r.coins });
    this.addEvent({ type: "gift", playerId: sId, playerName: s.displayName, targetId: tId, targetName: r.displayName, amount: amt, message: `${s.displayName} gifted ${amt.toLocaleString()} coins` });
    this.broadcastSync();
  }

  handleSelectChallenger(uId: string, tId: string, amt: number = 0) {
    if (this.session.phase !== "CHALLENGE_SELECT") return;
    const c1 = this.session.players.find(p => p.id === uId);
    const c2 = this.session.players.find(p => p.id === tId);
    if (!c1 || c1.role !== "challenger" || c1.coins <= 0 || !c2 || c2.coins <= 0) return;
    const w = Math.min(amt, c1.coins, c2.coins);
    c2.role = "challengee"; this.session.phase = "BETTING"; this.session.timeLeft = 28;
    if (w > 0) { c1.coins -= w; c2.coins -= w; updatePlayerProfile(c1.id, { coins: c1.coins }); updatePlayerProfile(c2.id, { coins: c2.coins }); }
    const dId = `duel_${Date.now()}`; this.session.currentDuelId = dId;
    this.session.currentDuel = { id: dId, challengerId: uId, challengeeId: tId, rounds: [], seriesScore: { [uId]: 0, [tId]: 0 }, targetWins: 3, bets: w > 0 ? [{ playerId: uId, targetId: uId, amount: w, placedAt: Date.now(), locked: true, payout: 0 }, { playerId: tId, targetId: tId, amount: w, placedAt: Date.now(), locked: true, payout: 0 }] : [], status: "active", startedAt: Date.now() };
    this.currentDuel = this.session.currentDuel;
    this.broadcastSync();
  }

  handlePlaceBet(uId: string, tId: string, amt: number) {
    if (this.session.phase !== "BETTING" || !this.currentDuel) return;
    const p = this.session.players.find(pl => pl.id === uId);
    if (!p || p.coins < amt || this.currentDuel.bets.find(b => b.playerId === uId)) return;
    p.coins -= amt; updatePlayerProfile(uId, { coins: p.coins });
    this.currentDuel.bets.push({ playerId: uId, targetId: tId, amount: amt, placedAt: Date.now(), locked: true, payout: 0 });
    p.stats.totalWagered += amt;
    this.addEvent({ type: "bet", playerId: uId, playerName: p.displayName, targetId: tId, targetName: this.session.players.find(pl => pl.id === tId)?.displayName, amount: amt, message: `${p.displayName} bet ${amt.toLocaleString()}` });
    this.broadcastSync();
  }

  handleLockChoice(uId: string, choice: RPSChoice) {
    if (this.session.phase !== "RPS_ROUND" || !this.currentDuel) return;
    let r = this.currentDuel.rounds[this.currentDuel.rounds.length - 1];
    if (!r || r.winner) { r = { roundNumber: (this.currentDuel.rounds.length) + 1, winner: undefined }; this.currentDuel.rounds.push(r); }
    if (uId === this.currentDuel.challengerId) r.challengerChoice = choice; else if (uId === this.currentDuel.challengeeId) r.challengeeChoice = choice;
    if (r.challengerChoice && r.challengeeChoice) this.resolveRPS(r);
    this.broadcastSync();
  }

  resolveRPS(r: RPSRound) {
    const { challengerId, challengeeId, seriesScore, targetWins } = this.currentDuel!;
    const c1 = r.challengerChoice; const c2 = r.challengeeChoice;
    if (c1 === c2) r.winner = "tie";
    else if ((c1 === "rock" && c2 === "scissors") || (c1 === "paper" && c2 === "rock") || (c1 === "scissors" && c2 === "paper")) { r.winner = challengerId; seriesScore[challengerId]++; }
    else { r.winner = challengeeId; seriesScore[challengeeId]++; }
    r.resolvedAt = Date.now();
    if (r.winner !== "tie" && seriesScore[r.winner] >= targetWins) this.resolveDuel(r.winner); else this.session.timeLeft = 3;
  }

  resolveDuel(wId: string) {
    if (!this.currentDuel) return; this.currentDuel.status = "finished"; this.currentDuel.winnerId = wId;
    const lId = wId === this.currentDuel.challengerId ? this.currentDuel.challengeeId : this.currentDuel.challengerId;
    const pool = this.currentDuel.bets.reduce((s, b) => s + b.amount, 0);
    const win = this.session.players.find(p => p.id === wId); const los = this.session.players.find(p => p.id === lId);
    const { lossModifier, winModifier } = this.session.settings;
    let final = pool; if (win && winModifier !== 0) final += Math.floor(pool * winModifier);
    if (win) { win.coins += final; win.stats.wins++; win.stats.totalEarned += final; win.stats.totalWon += final; }
    if (los) { los.stats.losses++; if (lossModifier !== 0) los.coins = Math.max(0, los.coins + Math.floor(los.coins * lossModifier)); }
    this.currentDuel.bets.forEach(b => {
      const p = this.session.players.find(pl => pl.id === b.playerId); if (!p) return;
      if (b.targetId === wId) {
        const pay = p.id === wId ? final : Math.floor(b.amount * (2 + winModifier));
        if (p.id !== wId) p.coins += pay; updatePlayerProfile(p.id, { coins: p.coins });
        b.payout = pay - b.amount; p.stats.totalWon += pay; p.stats.totalEarned += pay;
      } else { b.payout = -b.amount; p.stats.totalLost += b.amount; }
    });
    if (win) { win.stats.winStreak++; updatePlayerProfile(win.id, { coins: win.coins, winStreak: win.stats.winStreak }); }
    if (los) { los.stats.winStreak = 0; updatePlayerProfile(los.id, { winStreak: 0, coins: los.coins }); }
    this.addRoundHistory({ roundNumber: this.session.roundNumber, challengerId: this.currentDuel.challengerId, challengeeId: this.currentDuel.challengeeId, challengerChoice: this.currentDuel.rounds[this.currentDuel.rounds.length - 1]?.challengerChoice, challengeeChoice: this.currentDuel.rounds[this.currentDuel.rounds.length - 1]?.challengeeChoice, winner: wId, prizePool: final, });
    if (win) this.addEvent({ type: "win", playerId: wId, playerName: win.displayName, amount: final, message: `${win.displayName} won ${final.toLocaleString()}!`, });
    this.session.phase = "RESULTS"; this.session.timeLeft = 8;
    this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
    this.broadcastSync();
  }
}

Server satisfies Party.Worker;
