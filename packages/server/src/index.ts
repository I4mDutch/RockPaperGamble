import type * as Party from "partykit/server";

// --- CONFIG ---
const SESSION_KEY = "rpg_prod_v4_final_stable"; 
const DEFAULT_SETTINGS = {
  startingMoney: 10000,
  lossModifier: 0,
  winModifier: 0,
  highStakesMode: false
};

// --- UTILS ---
const AVATAR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];
function getAvatarColor(id: string): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

export default class Server implements Party.Server {
  session: any;
  loadPromise: Promise<void> | null = null;
  isReady = false;

  constructor(readonly room: Party.Room) {
    this.session = this.createEmptySession();
    setInterval(() => { this.tick(); }, 1000);
  }

  createEmptySession() {
    return {
      id: this.room.id,
      hostId: "",
      players: [],
      status: "lobby",
      phase: "WAITING",
      settings: { ...DEFAULT_SETTINGS },
      turnOrder: [],
      activePlayerIndex: 0,
      eventFeed: [],
      roundHistory: [],
      roundNumber: 0,
      timeLeft: 0,
      currentDuel: null,
      createdAt: Date.now()
    };
  }

  async ensureLoaded() {
    if (this.isReady) return;
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = (async () => {
      try {
        const saved = await this.room.storage.get(SESSION_KEY);
        if (saved) {
          this.session = {
            ...this.createEmptySession(),
            ...saved,
            players: saved.players || [],
            turnOrder: saved.turnOrder || [],
            eventFeed: saved.eventFeed || [],
            settings: saved.settings || { ...DEFAULT_SETTINGS }
          };
        } else {
          this.session = this.createEmptySession();
          await this.save();
        }
        this.isReady = true;
        console.log(`[ENGINE] Room ${this.room.id} ready`);
      } catch (err) {
        console.error("[STORAGE] Fail", err);
        this.session = this.createEmptySession();
        this.isReady = true;
      }
    })();
    
    return this.loadPromise;
  }

  async save() {
    if (!this.isReady) return;
    await this.room.storage.put(SESSION_KEY, this.session);
  }

  broadcastSync() {
    this.room.broadcast(JSON.stringify({ type: "SYNC", session: this.session }));
  }

  addEvent(type: string, message: string, data: any = {}) {
    const event = { id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, type, message, timestamp: Date.now(), ...data };
    this.session.eventFeed.unshift(event);
    if (this.session.eventFeed.length > 50) this.session.eventFeed = this.session.eventFeed.slice(0, 50);
  }

  getPlayer(userId: string) {
    return this.session.players.find((p: any) => p.id === userId);
  }

  syncTurnOrder() {
    const playerIds = this.session.players.map((p: any) => p.id);
    let newOrder = (this.session.turnOrder || []).filter((id: string) => playerIds.includes(id));
    playerIds.forEach((id: string) => { if (!newOrder.includes(id)) newOrder.push(id); });
    this.session.turnOrder = newOrder;
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      await this.ensureLoaded();
      const url = new URL(ctx.request.url, "http://localhost");
      const userId = url.searchParams.get("userId");
      const displayName = (url.searchParams.get("displayName") || "Guest").trim();
      const avatarUrl = url.searchParams.get("avatarUrl") || undefined;

      if (!userId) { conn.close(); return; }
      conn.setState({ userId });

      if (!this.session.hostId || !this.session.players.some((p: any) => p.id === this.session.hostId)) {
        this.session.hostId = userId;
      }

      let pIdx = this.session.players.findIndex((p: any) => p.id === userId);
      if (pIdx === -1) {
        this.session.players.push({
          id: userId, displayName, avatarUrl, avatarColor: getAvatarColor(userId), initials: getInitials(displayName),
          coins: this.session.settings.startingMoney, isConnected: true, status: "not_ready", role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0, totalWon: 0, totalLost: 0 }
        });
        this.addEvent("join", `${displayName} joined the lobby`, { playerId: userId });
      } else {
        const p = this.session.players[pIdx];
        p.isConnected = true; p.displayName = displayName; if (avatarUrl) p.avatarUrl = avatarUrl;
      }

      this.syncTurnOrder();
      await this.save();
      conn.send(JSON.stringify({ type: "SYNC", session: this.session }));
      this.broadcastSync();
    } catch (err) { console.error("[ERROR] onConnect", err); }
  }

  async onClose(conn: Party.Connection) {
    const userId = conn.state?.userId;
    if (!userId) return;
    await this.ensureLoaded();
    const pIdx = this.session.players.findIndex((p: any) => p.id === userId);
    if (pIdx !== -1) {
      this.session.players[pIdx].isConnected = false;
      if (this.session.status === "lobby") {
        const p = this.session.players[pIdx];
        this.addEvent("leave", `${p.displayName} left the lobby`, { playerId: userId });
        this.session.players = this.session.players.filter((pl: any) => pl.id !== userId);
        this.syncTurnOrder();
        if (this.session.hostId === userId && this.session.players.length > 0) this.session.hostId = this.session.players[0].id;
      }
      await this.save(); this.broadcastSync();
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);
      const userId = sender.state?.userId;
      if (!userId) return;
      await this.ensureLoaded();

      if (msg.type === "SET_READY") {
        const pIdx = this.session.players.findIndex((p: any) => p.id === userId);
        if (pIdx !== -1) {
          this.session.players[pIdx].status = msg.ready ? "ready" : "not_ready";
          const p = this.session.players[pIdx];
          this.addEvent("ready", `${this.session.players[pIdx].displayName} is ${this.session.players[pIdx].status}`, { playerId: userId });
          await this.save(); this.broadcastSync();
        }
      } else if (msg.type === "UPDATE_SETTINGS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.settings = { ...this.session.settings, ...msg.settings };
          if (msg.settings.startingMoney !== undefined) {
            for (const p of this.session.players) p.coins = msg.settings.startingMoney;
          }
          await this.save(); this.broadcastSync();
        }
      } else if (msg.type === "REORDER_PLAYERS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.turnOrder = msg.turnOrder;
          await this.save(); this.broadcastSync();
        }
      } else if (msg.type === "START_GAME") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          const allReady = this.session.players.every((p: any) => p.status === "ready");
          if (allReady && this.session.players.length >= 2) {
            this.session.countdown = 3;
            this.addEvent("start", "Match starting!", { playerId: userId });
            await this.save(); this.broadcastSync();
          }
        }
      } else if (msg.type === "SELECT_CHALLENGER") {
        if (this.session.phase !== "CHALLENGE_SELECT" || userId !== this.session.turnOrder[this.session.activePlayerIndex]) return;
        const challenger = this.getPlayer(userId); const challengee = this.getPlayer(msg.targetId);
        if (!challenger || !challengee || challenger.id === challengee.id) return;
        const wager = Number(msg.amount) || 0;
        if (challenger.coins < wager || challengee.coins < wager) return;
        challenger.coins -= wager; challengee.coins -= wager;
        this.session.currentDuel = {
          id: `duel_${Date.now()}`, challengerId: userId, challengeeId: msg.targetId,
          rounds: [], seriesScore: { [userId]: 0, [msg.targetId]: 0 }, targetWins: 3, status: "active",
          bets: wager > 0 ? [{ playerId: userId, targetId: userId, amount: wager, placedAt: Date.now(), locked: true }, { playerId: msg.targetId, targetId: msg.targetId, amount: wager, placedAt: Date.now(), locked: true }] : []
        };
        this.session.phase = "BETTING"; this.session.timeLeft = 20;
        challenger.role = "challenger"; challengee.role = "challengee";
        this.addEvent("bet", `${challenger.displayName} challenged ${challengee.displayName}${wager > 0 ? ` for ${wager} 🪙` : ""}`);
        await this.save(); this.broadcastSync();
      } else if (msg.type === "PLACE_BET") {
        if (!this.session.currentDuel || this.session.phase !== "BETTING") return;
        const p = this.getPlayer(userId); const target = this.getPlayer(msg.targetId);
        if (!p || !target || p.coins < msg.amount) return;
        p.coins -= msg.amount;
        this.session.currentDuel.bets.push({ playerId: userId, targetId: msg.targetId, amount: msg.amount, placedAt: Date.now(), locked: true });
        this.addEvent("bet", `${p.displayName} bet ${msg.amount} 🪙 on ${target.displayName}`);
        await this.save(); this.broadcastSync();
      } else if (msg.type === "LOCK_CHOICE") {
        if (this.session.phase !== "RPS_ROUND" || !this.session.currentDuel) return;
        const duel = this.session.currentDuel; let round = duel.rounds[duel.rounds.length - 1];
        if (!round || round.winner) { round = { roundNumber: duel.rounds.length + 1, winner: undefined }; duel.rounds.push(round); }
        if (userId === duel.challengerId) round.challengerChoice = msg.choice;
        else if (userId === duel.challengeeId) round.challengeeChoice = msg.choice;
        if (round.challengerChoice && round.challengeeChoice) { this.resolveRPS(round); }
        await this.save(); this.broadcastSync();
      } else if (msg.type === "GIFT_COINS") {
        const s = this.getPlayer(userId); const r = this.getPlayer(msg.targetId);
        if (s && r && s.coins >= msg.amount) {
          s.coins -= msg.amount; r.coins += msg.amount;
          this.addEvent("gift", `${s.displayName} gifted ${msg.amount} 🪙 to ${r.displayName}`);
          await this.save(); this.broadcastSync();
        }
      } else if (msg.type === "FORCE_SYNC") { this.broadcastSync(); }
    } catch (e) { console.error("[ERROR] onMessage", e); }
  }

  private startNewMatch() {
    this.session.roundNumber++; this.session.phase = "CHALLENGE_SELECT"; this.session.timeLeft = 15; this.session.currentDuel = null;
    const len = this.session.turnOrder.length;
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        const id = this.session.turnOrder[this.session.activePlayerIndex];
        const p = this.getPlayer(id); if (p && p.coins > 0) break;
        this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % len;
      }
    }
    this.session.players.forEach((p: any) => { p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator"; });
  }

  private resolveRPS(round: any) {
    const duel = this.session.currentDuel; if (!duel) return;
    const c1 = round.challengerChoice; const c2 = round.challengeeChoice;
    if (c1 === c2) { round.winner = "tie"; }
    else if ((c1 === "rock" && c2 === "scissors") || (c1 === "paper" && c2 === "rock") || (c1 === "scissors" && c2 === "paper")) {
      round.winner = duel.challengerId; duel.seriesScore[duel.challengerId]++;
    } else {
      round.winner = duel.challengeeId; duel.seriesScore[duel.challengeeId]++;
    }
    round.resolvedAt = Date.now();
    if (round.winner !== "tie" && duel.seriesScore[round.winner] >= 3) { this.resolveDuel(round.winner); }
    else { this.session.timeLeft = 3; }
  }

  private resolveDuel(winnerId: string) {
    const duel = this.session.currentDuel; if (!duel) return;
    duel.status = "finished"; duel.winnerId = winnerId;
    const winner = this.getPlayer(winnerId); const totalPool = duel.bets.reduce((sum: number, b: any) => sum + b.amount, 0);
    if (winner) {
      winner.coins += totalPool; winner.stats.wins++;
      winner.stats.totalEarned += totalPool; winner.stats.totalWon += totalPool; winner.stats.winStreak++;
      const wBet = duel.bets.find((b: any) => b.playerId === winnerId); if (wBet) wBet.payout = totalPool - wBet.amount;
    }
    const loserId = winnerId === duel.challengerId ? duel.challengeeId : duel.challengerId;
    const loser = this.getPlayer(loserId);
    if (loser) {
      loser.stats.losses++; loser.stats.winStreak = 0;
      const lBet = duel.bets.find((b: any) => b.playerId === loserId); if (lBet) lBet.payout = -lBet.amount;
    }
    duel.bets.forEach((b: any) => {
      const bettor = this.getPlayer(b.playerId); if (!bettor || b.playerId === winnerId || b.playerId === loserId) return;
      if (b.targetId === winnerId) {
        const reward = b.amount * 2; bettor.coins += reward;
        b.payout = reward - b.amount; bettor.stats.totalEarned += reward; bettor.stats.totalWon += reward;
      } else { b.payout = -b.amount; b.stats.totalLost += b.amount; }
    });
    this.addEvent("win", `${winner?.displayName} won the match and ${totalPool} 🪙!`);
    this.session.phase = "RESULTS"; this.session.timeLeft = 8;
    this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
  }

  async tick() {
    if (!this.isReady) return;

    if (this.session.countdown !== undefined) {
      if (this.session.countdown > 0) { this.session.countdown--; } 
      else { this.session.countdown = undefined; this.session.status = "in_progress"; this.startNewMatch(); }
      await this.save(); this.broadcastSync();
      return;
    }

    if (this.session.status !== "in_progress") return;

    if (this.session.timeLeft > 0) {
      this.session.timeLeft--;
      if (this.session.timeLeft === 0) {
        if (this.session.phase === "BETTING") { this.session.phase = "RPS_ROUND"; this.session.timeLeft = 15; }
        else if (this.session.phase === "RPS_ROUND") { this.handleRPSRoundTimeout(); }
        else if (this.session.phase === "RESULTS") { this.startNewMatch(); }
      }
      await this.save(); this.broadcastSync();
    }
  }

  private handleRPSRoundTimeout() {
    const duel = this.session.currentDuel; if (!duel || duel.status === "finished") return;
    const last = duel.rounds[duel.rounds.length - 1];
    if (last && last.winner) {
      this.session.timeLeft = 15;
      duel.rounds.push({ roundNumber: duel.rounds.length + 1, winner: undefined });
    } else {
      if (!last) duel.rounds.push({ roundNumber: 1, winner: "tie", resolvedAt: Date.now() });
      else { last.winner = "tie"; last.resolvedAt = Date.now(); }
      this.session.timeLeft = 3;
    }
  }
}
