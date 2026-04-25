import type * as Party from "partykit/server";

// --- PERSISTENCE HELPERS ---
const SESSION_KEY = "rpg_session_v1";

const DEFAULT_SETTINGS = {
  startingMoney: 10000,
  lossModifier: 0,
  winModifier: 0,
  highStakesMode: false
};

// --- INLINED UTILS ---
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

  constructor(readonly room: Party.Room) {
    // Initial dummy state, will be loaded from storage in onConnect
    this.session = this.createEmptySession();
    
    // Global tick loop
    setInterval(() => {
      this.tick();
    }, 1000);
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
      createdAt: Date.now()
    };
  }

  async loadSession() {
    const saved = await this.room.storage.get(SESSION_KEY);
    if (saved) {
      this.session = saved;
    } else {
      this.session = this.createEmptySession();
      await this.saveSession();
    }
  }

  async saveSession() {
    await this.room.storage.put(SESSION_KEY, this.session);
  }

  async broadcastSync() {
    this.room.broadcast(JSON.stringify({
      type: "SYNC",
      session: this.session
    }));
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      await this.loadSession();

      const url = new URL(ctx.request.url, "http://localhost");
      const userId = url.searchParams.get("userId");
      const displayName = (url.searchParams.get("displayName") || "Guest").trim();
      const avatarUrl = url.searchParams.get("avatarUrl") || undefined;

      if (!userId) {
        conn.close();
        return;
      }

      conn.setState({ userId });

      // Host assignment
      if (!this.session.hostId || !this.session.players.some((p: any) => p.id === this.session.hostId)) {
        this.session.hostId = userId;
      }

      // Add or update player
      let pIdx = this.session.players.findIndex((p: any) => p.id === userId);
      if (pIdx === -1) {
        this.session.players.push({
          id: userId,
          displayName,
          avatarUrl,
          avatarColor: getAvatarColor(userId),
          initials: getInitials(displayName),
          coins: this.session.settings.startingMoney,
          isConnected: true,
          status: "not_ready",
          role: "spectator",
          stats: { wins: 0, losses: 0, totalWagered: 0, totalEarned: 0, winStreak: 0, totalWon: 0, totalLost: 0 }
        });
        
        this.session.eventFeed.unshift({
          id: `ev_${Date.now()}`,
          type: "join",
          message: `${displayName} joined the lobby`,
          timestamp: Date.now()
        });
      } else {
        const p = this.session.players[pIdx];
        p.isConnected = true;
        p.displayName = displayName;
        if (avatarUrl) p.avatarUrl = avatarUrl;
      }

      // Sync Turn Order
      if (!this.session.turnOrder.includes(userId)) {
        this.session.turnOrder.push(userId);
      }

      await this.saveSession();
      
      // Immediate response to connection
      conn.send(JSON.stringify({ type: "SYNC", session: this.session }));
      this.broadcastSync();

    } catch (err) {
      console.error("[FATAL] onConnect", err);
    }
  }

  async onClose(conn: Party.Connection) {
    const userId = conn.state?.userId;
    if (!userId) return;

    await this.loadSession();
    const pIdx = this.session.players.findIndex((p: any) => p.id === userId);
    if (pIdx !== -1) {
      const p = this.session.players[pIdx];
      p.isConnected = false;
      
      if (this.session.status === "lobby") {
        this.session.players = this.session.players.filter((pl: any) => pl.id !== userId);
        this.session.turnOrder = this.session.turnOrder.filter((id: string) => id !== userId);
        
        if (this.session.hostId === userId && this.session.players.length > 0) {
          this.session.hostId = this.session.players[0].id;
        }
      }

      await this.saveSession();
      this.broadcastSync();
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);
      const userId = sender.state?.userId;
      if (!userId) return;

      await this.loadSession();

      if (msg.type === "SET_READY") {
        const pIdx = this.session.players.findIndex((p: any) => p.id === userId);
        if (pIdx !== -1) {
          this.session.players[pIdx].status = msg.ready ? "ready" : "not_ready";
          await this.saveSession();
          this.broadcastSync();
        }
      } else if (msg.type === "UPDATE_SETTINGS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.settings = { ...this.session.settings, ...msg.settings };
          if (msg.settings.startingMoney !== undefined) {
            for (const p of this.session.players) p.coins = msg.settings.startingMoney;
          }
          await this.saveSession();
          this.broadcastSync();
        }
      } else if (msg.type === "REORDER_PLAYERS") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          this.session.turnOrder = msg.turnOrder;
          await this.saveSession();
          this.broadcastSync();
        }
      } else if (msg.type === "START_GAME") {
        if (this.session.hostId === userId && this.session.status === "lobby") {
          const allReady = this.session.players.every((p: any) => p.status === "ready");
          if (allReady && this.session.players.length >= 2) {
            this.session.status = "in_progress";
            await this.saveSession();
            this.broadcastSync();
          }
        }
      } else if (msg.type === "FORCE_SYNC") {
        this.broadcastSync();
      }
    } catch (e) {
      console.error("[ERROR] onMessage", e);
    }
  }

  async tick() {
    // Only the primary worker should handle the tick logic
    // In dev, this runs every second.
    if (this.session.status !== "in_progress") return;
    
    // Tick logic (timers, phase transitions) would go here
    // For now, keeping it simple to verify basic sync
  }
}
