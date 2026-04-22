import type * as Party from "partykit/server";

// --- CRASH-PROOF UTILS ---
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
// -------------------------

export default class Server implements Party.Server {
  session: any;

  constructor(readonly room: Party.Room) {
    this.session = {
      id: room.id,
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
      createdAt: Date.now()
    };
  }

  broadcastSync() {
    try {
      this.room.broadcast(JSON.stringify({
        type: "SYNC",
        session: this.session
      }));
    } catch (err) {
      console.error("Broadcast failed", err);
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      // Use URL constructor with a dummy base to handle relative URLs safely
      const url = new URL(ctx.request.url, "http://localhost");
      const userId = url.searchParams.get("userId");
      const displayName = (url.searchParams.get("displayName") || "Guest").trim();
      const avatarUrl = url.searchParams.get("avatarUrl") || undefined;

      if (!userId) {
        console.warn("No userId, rejecting");
        conn.close();
        return;
      }

      console.log(`User ${userId} (${displayName}) connected to ${this.room.id}`);
      conn.setState({ userId });

      // Host assignment
      if (!this.session.hostId) {
        this.session.hostId = userId;
      }

      // Sync existing session
      let p = this.session.players.find((player: any) => player.id === userId);
      if (!p) {
        p = {
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
        };
        this.session.players.push(p);
      } else {
        p.isConnected = true;
        p.displayName = displayName;
        if (avatarUrl) p.avatarUrl = avatarUrl;
      }

      if (!this.session.turnOrder.includes(userId)) {
        this.session.turnOrder.push(userId);
      }

      // Immediate SYNC response
      conn.send(JSON.stringify({ type: "SYNC", session: this.session }));
      
      // Global broadcast
      this.broadcastSync();

    } catch (err) {
      console.error("onConnect fatal error", err);
      // Ensure we don't throw so the connection isn't severed by the runtime
    }
  }

  onClose(conn: Party.Connection) {
    const userId = conn.state?.userId;
    if (!userId) return;

    const p = this.session.players.find((pl: any) => pl.id === userId);
    if (p) {
      p.isConnected = false;
      if (this.session.status === "lobby") {
        this.session.players = this.session.players.filter((pl: any) => pl.id !== userId);
        this.session.turnOrder = this.session.turnOrder.filter((id: string) => id !== userId);
        if (this.session.hostId === userId && this.session.players.length > 0) {
          this.session.hostId = this.session.players[0].id;
        }
      }
      this.broadcastSync();
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);
      const userId = sender.state?.userId;
      if (!userId) return;

      if (msg.type === "SET_READY") {
        const p = this.session.players.find((pl: any) => pl.id === userId);
        if (p) p.status = msg.ready ? "ready" : "not_ready";
        this.broadcastSync();
      } else if (msg.type === "UPDATE_SETTINGS") {
        if (this.session.hostId === userId) {
          this.session.settings = { ...this.session.settings, ...msg.settings };
          this.broadcastSync();
        }
      } else if (msg.type === "REORDER_PLAYERS") {
        if (this.session.hostId === userId) {
          this.session.turnOrder = msg.turnOrder;
          this.broadcastSync();
        }
      } else if (msg.type === "START_GAME") {
        if (this.session.hostId === userId) {
          this.session.status = "in_progress";
          this.broadcastSync();
        }
      } else if (msg.type === "FORCE_SYNC") {
        this.broadcastSync();
      }
    } catch (e) {}
  }
}
