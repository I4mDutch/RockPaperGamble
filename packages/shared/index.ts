export type RPSChoice = "rock" | "paper" | "scissors";

export type PlayerStatus = "not_ready" | "ready";

export interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor?: string;
  initials?: string;
  coins: number;
  lockedCoins: number; // Task 5.1: Wager Lock
  isConnected: boolean;
  status: PlayerStatus;
  role: "challenger" | "challengee" | "spectator";
  inventory?: any[]; // Phase 4: Purchased items
  stats: {
    wins: number;
    losses: number;
    totalWagered: number;
    totalEarned: number;
    winStreak: number;
    totalWon: number;
    totalLost: number;
  };
}

export interface Bet {
  playerId: string;
  targetId: string;
  amount: number;
  placedAt: number;
  locked: boolean;
  payout?: number;
}

export interface GameSettings {
  startingMoney: number;
  lossModifier: number;
  winModifier: number;
  highStakesMode: boolean;
}

export interface RoundHistory {
  roundNumber: number;
  challengerId: string;
  challengeeId: string;
  challengerChoice?: RPSChoice;
  challengeeChoice?: RPSChoice;
  winner: string | "tie";
  prizePool: number;
  timestamp: number;
}

export interface GameEvent {
  id: string;
  type: "join" | "leave" | "bet" | "win" | "gift" | "ready" | "start";
  playerId?: string;
  playerName?: string;
  amount?: number;
  targetId?: string;
  targetName?: string;
  message?: string;
  itemId?: string; // Phase 4
  timestamp: number;
}

export interface RPSRound {
  roundNumber: number;
  challengerChoice?: RPSChoice;
  challengeeChoice?: RPSChoice;
  winner?: string | "tie";
  resolvedAt?: number;
}

export interface Duel {
  id: string;
  challengerId: string;
  challengeeId: string;
  rounds: RPSRound[];
  seriesScore: Record<string, number>;
  targetWins: number;
  winnerId?: string;
  status: "pending" | "betting" | "active" | "finished";
  bets: Bet[];
  startedAt: number;
  completedAt?: number;
}

export type GamePhase =
  | "WAITING"
  | "CHALLENGE_SELECT"
  | "BETTING"
  | "RPS_ROUND"
  | "RESULTS"
  | "GAME_OVER";

export interface GameSession {
  id: string;
  hostId: string;
  players: Player[];
  currentDuelId?: string | null;
  currentDuel?: Duel | null;
  roundNumber: number;
  turnOrder: string[];
  activePlayerIndex: number;
  status: "lobby" | "in_progress" | "complete";
  phase: GamePhase;
  createdAt: number;
  timeLeft: number;
  settings: GameSettings;
  roundHistory: RoundHistory[];
  eventFeed: GameEvent[];
  countdown?: number;
  activeItems: any[]; // Phase 4: Global effects
  traps: any[];       // Phase 4: Placed traps
}

export function getBalanceModifiers(startingMoney: number): { loss: number; win: number; highStakes: boolean } {
  if (startingMoney >= 500000) return { loss: 0.5, win: -0.35, highStakes: true };
  if (startingMoney >= 100000) return { loss: 0.25, win: -0.15, highStakes: true };
  if (startingMoney < 1000) return { loss: -0.5, win: 0.35, highStakes: false };
  return { loss: 0, win: 0, highStakes: false };
}

export const AVATAR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}
