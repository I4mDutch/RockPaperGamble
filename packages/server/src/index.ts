import type * as Party from "partykit/server";
import { ITEM_REGISTRY } from "./items";

// --- CONFIG ---
const SESSION_KEY = "rpg_prod_v220_final_stable"; 
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
    // Start global tick loop
    this.scheduleTick();
  }

  createEmptySession() {
    return {
      id: this.room.id,
      hostId: "",
      players: [],
      status: "lobby",
      phase: "WAITING",
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
      currentDuel: null,
      activeItems: [], // Phase 4: Global active items/effects
      traps: [],       // Phase 4: Placed traps (Landmines)
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
          // Robust merge
          this.session = {
            ...this.createEmptySession(),
            ...saved,
            players: Array.isArray(saved.players) ? saved.players : [],
            turnOrder: Array.isArray(saved.turnOrder) ? saved.turnOrder : [],
            eventFeed: Array.isArray(saved.eventFeed) ? saved.eventFeed : [],
            settings: saved.settings || { ...DEFAULT_SETTINGS }
          };
        } else {
          this.session = this.createEmptySession();
          await this.save();
        }
        this.isReady = true;
        console.log(`[STORAGE] Session Live for Room: ${this.room.id}`);
      } catch (err) {
        console.error("[STORAGE] Load failed", err);
        this.session = this.createEmptySession();
        this.isReady = true;
      }
    })();
    
    return this.loadPromise;
  }

  async save() {
    if (!this.isReady) return;
    try {
      await this.room.storage.put(SESSION_KEY, this.session);
    } catch (err) {
      console.error("[STORAGE] Save failed", err);
    }
  }

  broadcastSync() {
    // GATEKEEPER: Prevent broadcasting uninitialized state
    if (!this.isReady) return;
    this.room.broadcast(JSON.stringify({ type: "SYNC", session: this.session }));
  }

  addEvent(type: string, message: string, data: any = {}) {
    const event = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      message,
      timestamp: Date.now(),
      ...data
    };
    if (!Array.isArray(this.session.eventFeed)) this.session.eventFeed = [];
    this.session.eventFeed.unshift(event);
    if (this.session.eventFeed.length > 50) {
      this.session.eventFeed = this.session.eventFeed.slice(0, 50);
    }
  }

  getPlayer(userId: string) {
    if (!Array.isArray(this.session.players)) return null;
    return this.session.players.find((p: any) => p.id === userId);
  }

  syncTurnOrder() {
    if (!Array.isArray(this.session.players)) this.session.players = [];
    const playerIds = this.session.players.map((p: any) => p.id);
    let newOrder = (this.session.turnOrder || []).filter((id: string) => playerIds.includes(id));
    playerIds.forEach((id: string) => {
      if (!newOrder.includes(id)) newOrder.push(id);
    });
    this.session.turnOrder = newOrder;
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      // 1. BLOCK HANDSHAKE until storage is loaded
      await this.ensureLoaded();

      const url = new URL(ctx.request.url, "http://localhost");
      const userId = url.searchParams.get("userId");
      const displayName = (url.searchParams.get("displayName") || "Guest").trim();
      const avatarUrl = url.searchParams.get("avatarUrl") || undefined;

      if (!userId) { conn.close(); return; }
      conn.setState({ userId });

      // 2. IDENTITY INITIALIZATION
      let pIdx = this.session.players.findIndex((p: any) => p.id === userId);
      if (pIdx === -1) {
        this.session.players.push({
          id: userId,
          displayName,
          avatarUrl,
          avatarColor: getAvatarColor(userId),
          initials: getInitials(displayName),
          coins: this.session.settings.startingMoney,
          lockedCoins: 0, // Task 5.1: Wager Lock
          isConnected: true,
          status: "not_ready",
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0, totalWon: 0, totalLost: 0 }
        });
        this.addEvent("join", `${displayName} joined the lobby`, { playerId: userId });
      } else {
        const p = this.session.players[pIdx];
        p.isConnected = true;
        p.displayName = displayName;
        if (avatarUrl) p.avatarUrl = avatarUrl;
      }

      // 3. HOST RECOVERY
      if (!this.session.hostId || !this.session.players.some((p: any) => p.id === this.session.hostId)) {
        this.session.hostId = userId;
      }

      // 4. PERSISTENCE SYNC
      this.syncTurnOrder();
      await this.save();
      
      // 5. EXPLICIT HANDSHAKE
      conn.send(JSON.stringify({ type: "SYNC", session: this.session }));
      this.broadcastSync();

    } catch (err) {
      console.error("[FATAL] Handshake crash prevented", err);
    }
  }

  async onClose(conn: Party.Connection) {
    try {
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
          if (this.session.hostId === userId && this.session.players.length > 0) {
            this.session.hostId = this.session.players[0].id;
          }
        }
        await this.save();
        this.broadcastSync();
      }
    } catch (err) {
      console.error("[FATAL] onClose failed", err);
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);
      
      // Resilient identity lookup
      let userId = sender.state?.userId;
      if (!userId) {
        const url = new URL(sender.uri);
        userId = url.searchParams.get("userId");
      }
      if (!userId) return;

      await this.ensureLoaded();

      if (msg.type === "SET_READY") {
        const pIdx = this.session.players.findIndex((p: any) => p.id === userId);
        if (pIdx !== -1) {
          this.session.players[pIdx].status = msg.ready ? "ready" : "not_ready";
          const p = this.session.players[pIdx];
          this.addEvent("ready", `${p.displayName} is ${p.status}`, { playerId: userId });
          await this.save();
          this.broadcastSync();
        }
      } else if (msg.type === "UPDATE_SETTINGS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.settings = { ...this.session.settings, ...msg.settings };
          if (msg.settings.startingMoney !== undefined) {
            for (const p of this.session.players) {
              p.coins = msg.settings.startingMoney;
            }
          }
          await this.save();
          this.broadcastSync();
        }
      } else if (msg.type === "REORDER_PLAYERS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.turnOrder = msg.turnOrder;
          await this.save();
          this.broadcastSync();
        }
      } else if (msg.type === "START_GAME") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          const allReady = this.session.players.every((p: any) => p.status === "ready");
          if (allReady && this.session.players.length >= 2) {
            this.session.countdown = 3;
            this.session.activeItems = [];
            this.session.traps = [];
            this.session.players.forEach((p: any) => p.inventory = []);
            this.addEvent("start", "Match starting!", { playerId: userId });
            await this.save();
            this.broadcastSync();
          }
        }
      } else if (msg.type === "SELECT_CHALLENGER") {
        if (this.session.phase !== "CHALLENGE_SELECT" || userId !== this.session.turnOrder[this.session.activePlayerIndex]) return;
        const challenger = this.getPlayer(userId);
        const challengee = this.getPlayer(msg.targetId);
        if (!challenger || !challengee || challenger.id === challengee.id) return;
        const wager = Number(msg.amount) || 0;
        if (challenger.coins < wager || challengee.coins < wager) return;

        // Task 5.1: Lock wager instead of subtracting
        challenger.coins -= wager;
        challenger.lockedCoins = (challenger.lockedCoins || 0) + wager;
        challengee.coins -= wager;
        challengee.lockedCoins = (challengee.lockedCoins || 0) + wager;
        
        this.session.currentDuel = {
          id: `duel_${Date.now()}`,
          challengerId: userId,
          challengeeId: msg.targetId,
          rounds: [],
          seriesScore: { [userId]: 0, [msg.targetId]: 0 },
          targetWins: 3,
          status: "active",
          bets: wager > 0 ? [
            { playerId: userId, targetId: userId, amount: wager, placedAt: Date.now(), locked: true },
            { playerId: msg.targetId, targetId: msg.targetId, amount: wager, placedAt: Date.now(), locked: true }
          ] : []
        };
        
        this.session.phase = "BETTING";
        this.session.timeLeft = 20;
        challenger.role = "challenger";
        challengee.role = "challengee";
        
        const eventMsg = wager > 0 
          ? `${challenger.displayName} challenged ${challengee.displayName} for ${wager.toLocaleString()} 🪙`
          : `${challenger.displayName} challenged ${challengee.displayName}`;
          
        this.addEvent("bet", eventMsg, { playerId: userId });
        await this.save();
        this.broadcastSync();
      } else if (msg.type === "PLACE_BET") {
        if (!this.session.currentDuel || this.session.phase !== "BETTING") return;
        const p = this.getPlayer(userId);
        const target = this.getPlayer(msg.targetId);
        if (!p || !target || p.coins < msg.amount) return;
        
        // Task 5.1: Lock wager
        p.coins -= msg.amount;
        p.lockedCoins = (p.lockedCoins || 0) + msg.amount;

        this.session.currentDuel.bets.push({
          playerId: userId,
          targetId: msg.targetId,
          amount: msg.amount,
          placedAt: Date.now(),
          locked: true
        });
        
        this.addEvent("bet", `${p.displayName} bet ${msg.amount.toLocaleString()} 🪙 on ${target.displayName}`, { playerId: userId });
        await this.save();
        this.broadcastSync();
      } else if (msg.type === "LOCK_CHOICE") {
        if (this.session.phase !== "RPS_ROUND" || !this.session.currentDuel) return;
        const duel = this.session.currentDuel;
        let round = duel.rounds[duel.rounds.length - 1];
        
        if (!round || round.winner) {
          round = { roundNumber: duel.rounds.length + 1, winner: undefined };
          duel.rounds.push(round);
        }
        
        if (userId === duel.challengerId) round.challengerChoice = msg.choice;
        else if (userId === duel.challengeeId) round.challengeeChoice = msg.choice;

        if (round.challengerChoice && round.challengeeChoice) {
          this.resolveRPS(round);
        }
        await this.save();
        this.broadcastSync();
      } else if (msg.type === "GIFT_COINS") {
        const fromPlayer = this.getPlayer(userId);
        const toPlayer = this.getPlayer(msg.targetId);
        const amount = Number(msg.amount);
        if (fromPlayer && toPlayer && fromPlayer.coins >= amount) {
          fromPlayer.coins -= amount;
          toPlayer.coins += amount
          this.addEvent("gift", `${fromPlayer.displayName} gifted ${amount.toLocaleString()} 🪙 to ${toPlayer.displayName}`, { playerId: userId });
          await this.save();
          this.broadcastSync();
        }
      } else if (msg.type === "PURCHASE_ITEM") {
        const p = this.getPlayer(userId);
        const item = ITEM_REGISTRY[msg.itemId];
        if (p && item && p.coins >= item.cost) {
          p.coins -= item.cost;
          if (!p.inventory) p.inventory = [];
          p.inventory.push({ ...item, instanceId: `item_${Date.now()}` });
          this.addEvent("item", `${p.displayName} purchased ${item.name}`, { playerId: userId });
          await this.save();
          this.broadcastSync();
        }
      } else if (msg.type === "ACTIVATE_ITEM") {
        const p = this.getPlayer(userId);
        if (!p || !p.inventory) return;
        const itemIdx = p.inventory.findIndex((i: any) => i.instanceId === msg.instanceId);
        if (itemIdx === -1) return;
        
        const item = p.inventory[itemIdx];
        p.inventory.splice(itemIdx, 1);
        
        this.handleItemActivation(userId, item, msg.targetId);
        await this.save();
        this.broadcastSync();
      } else if (msg.type === "FORCE_SYNC") {
        this.broadcastSync();
      }
    } catch (err) {
      console.error("[ERROR] onMessage failed", err);
    }
  }

  private resolveRPS(round: any) {
    const duel = this.session.currentDuel;
    if (!duel) return;

    const c1 = round.challengerChoice;
    const c2 = round.challengeeChoice;

    // Task 5.2: Presence-Aware Scoring (Point Only)
    const challenger = this.getPlayer(duel.challengerId);
    const challengee = this.getPlayer(duel.challengeeId);

    if (challenger && !challenger.isConnected) {
      round.winner = duel.challengeeId;
      duel.seriesScore[duel.challengeeId]++;
      this.addEvent("game", `${challenger.displayName} is offline! Point to ${challengee?.displayName}.`, { playerId: duel.challengeeId });
    } else if (challengee && !challengee.isConnected) {
      round.winner = duel.challengerId;
      duel.seriesScore[duel.challengerId]++;
      this.addEvent("game", `${challengee.displayName} is offline! Point to ${challenger?.displayName}.`, { playerId: duel.challengerId });
    } else if (c1 === c2) {
      round.winner = "tie";
    } else if (
      (c1 === "rock" && c2 === "scissors") ||
      (c1 === "paper" && c2 === "rock") ||
      (c1 === "scissors" && c2 === "paper")
    ) {
      round.winner = duel.challengerId;
      duel.seriesScore[duel.challengerId]++;
    } else {
      round.winner = duel.challengeeId;
      duel.seriesScore[duel.challengeeId]++;
    }

    round.resolvedAt = Date.now();

    // Task 4.3: Landmine Trigger
    if (this.session.traps && this.session.traps.length > 0) {
      this.session.traps = this.session.traps.filter((trap: any) => {
        if (trap.type === "landmine") {
          const owner = this.getPlayer(trap.ownerId);
          if (owner) {
            const payout = trap.config?.payout || 250;
            owner.coins += payout;
            this.addEvent("item", `LANDMINE! ${owner.displayName} earned ${payout.toLocaleString()} 🪙 from the duel.`, { playerId: trap.ownerId });
          }
          return false; // Trap consumed
        }
        return true;
      });
    }

    if (round.winner !== "tie" && duel.seriesScore[round.winner] >= 3) {
      this.resolveDuel(round.winner);
    } else {
      this.session.timeLeft = 3;
    }
  }

  private resolveDuel(winnerId: string) {
    const duel = this.session.currentDuel;
    if (!duel) return;

    duel.status = "finished";
    duel.winnerId = winnerId;
    const loserId = winnerId === duel.challengerId ? duel.challengeeId : duel.challengerId;

    const totalPool = duel.bets.reduce((sum: number, b: any) => sum + b.amount, 0);
    const winner = this.getPlayer(winnerId);
    const loser = this.getPlayer(loserId);

    // Resolution: Clear locked coins and apply winnings/losses
    if (winner) {
      winner.lockedCoins = Math.max(0, (winner.lockedCoins || 0) - (duel.bets.find((b: any) => b.playerId === winnerId)?.amount || 0));
      // Winner gets their own bet back + the total pool of losing bets
      const loserBetsPool = duel.bets.filter((b: any) => b.targetId === loserId).reduce((sum: number, b: any) => sum + b.amount, 0);
      
      winner.coins += (duel.bets.find((b: any) => b.playerId === winnerId)?.amount || 0); // Return wager
      winner.coins += loserBetsPool; // Winnings
      
      winner.stats.wins++;
      winner.stats.totalEarned += loserBetsPool;
      winner.stats.totalWon += loserBetsPool;
      winner.stats.winStreak++;
      const wBet = duel.bets.find((b: any) => b.playerId === winnerId);
      if (wBet) wBet.payout = loserBetsPool;
    }

    if (loser) {
      // Loser's bet is already gone (deducted and locked)
      loser.lockedCoins = Math.max(0, (loser.lockedCoins || 0) - (duel.bets.find((b: any) => b.playerId === loserId)?.amount || 0));
      loser.stats.losses++;
      loser.stats.winStreak = 0;
      const lBet = duel.bets.find((b: any) => b.playerId === loserId);
      if (lBet) {
        lBet.payout = -lBet.amount;
        loser.stats.totalLost += lBet.amount;
      }
    }

    duel.bets.forEach((b: any) => {
      const bettor = this.getPlayer(b.playerId);
      if (!bettor || b.playerId === winnerId || b.playerId === loserId) return;

      // Clear locked coins for spectators
      bettor.lockedCoins = Math.max(0, (bettor.lockedCoins || 0) - b.amount);

      if (b.targetId === winnerId) {
        // Task 3.2: 2x payout for correct guesses
        const reward = b.amount * 2;
        bettor.coins += reward;
        b.payout = reward - b.amount;
        bettor.stats.totalEarned += reward - b.amount;
        bettor.stats.totalWon += reward - b.amount;
      } else {
        // Bet is lost
        b.payout = -b.amount;
        bettor.stats.totalLost += b.amount;
      }
    });

    this.addEvent("win", `${winner?.displayName} won the match and ${totalPool.toLocaleString()} 🪙!`, { playerId: winnerId });
    this.session.phase = "RESULTS";
    this.session.timeLeft = 8;
    
    if (this.session.turnOrder.length > 0) {
      this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % this.session.turnOrder.length;
    }
  }

  private startNewMatch() {
    this.session.roundNumber++;
    this.session.phase = "CHALLENGE_SELECT";
    this.session.timeLeft = 15;
    this.session.currentDuel = null;
    
    const len = this.session.turnOrder.length;
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        const id = this.session.turnOrder[this.session.activePlayerIndex];
        const p = this.getPlayer(id);
        if (p && p.coins > 0) break;
        this.session.activePlayerIndex = (this.session.activePlayerIndex + 1) % len;
      }
    }
    
    this.session.players.forEach((p: any) => {
      p.role = p.id === this.session.turnOrder[this.session.activePlayerIndex] ? "challenger" : "spectator";
    });
  }

  private scheduleTick() {
    setTimeout(async () => {
      try {
        await this.tick();
      } catch (err) {
        console.error("[TICK] Error", err);
      } finally {
        this.scheduleTick();
      }
    }, 1000);
  }

  async tick() {
    // PROTECT: No ticks until database is loaded
    if (!this.isReady) return;

    // Handle Countdown
    if (this.session.countdown !== undefined) {
      if (this.session.countdown > 0) {
        this.session.countdown--;
      } else {
        this.session.countdown = undefined;
        this.session.status = "in_progress";
        this.startNewMatch();
      }
      await this.save();
      this.broadcastSync();
      return;
    }

    if (this.session.status !== "in_progress") return;

    // Handle Timers
    if (this.session.timeLeft > 0) {
      this.session.timeLeft--;
      if (this.session.timeLeft === 0) {
        if (this.session.phase === "BETTING") {
          this.session.phase = "RPS_ROUND";
          this.session.timeLeft = 15;
        } else if (this.session.phase === "RPS_ROUND") {
          this.handleRPSRoundTimeout();
        } else if (this.session.phase === "RESULTS") {
          this.startNewMatch();
        }
      }
      await this.save();
      this.broadcastSync();
    }
  }

  private handleItemActivation(userId: string, item: any, targetId?: string) {
    const p = this.getPlayer(userId);
    if (!p) return;

    this.addEvent("item", `${p.displayName} activated ${item.name}!`, { playerId: userId, itemId: item.id });

    switch (item.id) {
      case "atomic_bomb": {
        const target = targetId ? this.getPlayer(targetId) : null;
        if (target) {
          const steal = Math.floor(target.coins * (item.config?.targetSteal || 0.9));
          target.coins -= steal;
          p.coins += steal;
          this.addEvent("item", `Atomic Bomb: Stole ${steal.toLocaleString()} 🪙 from ${target.displayName}`, { playerId: userId });
        }
        // Global steal
        this.session.players.forEach((pl: any) => {
          if (pl.id === userId || pl.id === targetId) return;
          const globalSteal = Math.floor(pl.coins * (item.config?.globalSteal || 0.1));
          pl.coins -= globalSteal;
          p.coins += globalSteal;
        });
        break;
      }
      case "nuke": {
        const backfire = Math.random() < (item.config?.backfireRisk || 0.25);
        if (backfire) {
          const penalty = Math.floor(p.coins * 0.5);
          p.coins -= penalty;
          const split = Math.floor(penalty / (this.session.players.length - 1));
          this.session.players.forEach((pl: any) => {
            if (pl.id !== userId) pl.coins += split;
          });
          this.addEvent("item", `NUKE BACKFIRE! ${p.displayName} lost ${penalty.toLocaleString()} 🪙`, { playerId: userId, type: "danger" });
        } else {
          // Success: Take from others
          this.session.players.forEach((pl: any) => {
            if (pl.id === userId) return;
            const take = Math.floor(pl.coins * (item.config?.poolTake || 0.75));
            pl.coins -= take;
            p.coins += take;
          });
          this.addEvent("item", `NUKE IMPACT! ${p.displayName} absorbed massive wealth.`, { playerId: userId, type: "success" });
        }
        break;
      }
      case "landmine": {
        this.session.traps.push({
          id: `trap_${Date.now()}`,
          ownerId: userId,
          type: "landmine",
          config: item.config
        });
        break;
      }
      case "interceptor": {
        this.session.activeItems.push({
          id: `effect_${Date.now()}`,
          ownerId: userId,
          type: "interceptor",
          expiresAt: Date.now() + 60000 // Lasts 1 minute
        });
        break;
      }
    }
  }

  private handleRPSRoundTimeout() {
    const duel = this.session.currentDuel;
    if (!duel || duel.status === "finished") return;
    
    const last = duel.rounds[duel.rounds.length - 1];
    if (last && last.winner) {
      this.session.timeLeft = 15;
      duel.rounds.push({ roundNumber: duel.rounds.length + 1, winner: undefined });
    } else {
      if (!last) {
        duel.rounds.push({ roundNumber: 1, winner: "tie", resolvedAt: Date.now() });
      } else {
        last.winner = "tie";
        last.resolvedAt = Date.now();
      }
      this.session.timeLeft = 3;
    }
  }
}
