export type RPSChoice = "rock" | "paper" | "scissors";

export type PlayerStatus = "not_ready" | "ready";

export interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string;
  coins: number;
  isConnected: boolean;
  role: "challenger" | "challengee" | "spectator";
  status: PlayerStatus;
  stats: {
    wins: number;
    losses: number;
    totalWagered: number;
    totalEarned: number;
    winStreak: number;
    totalWon: number;
    totalLost: number;
  };
  // Visual avatar options
  avatarColor?: string;
  initials?: string;
}

export interface GameSettings {
  startingMoney: number;
  lossModifier: number; // e.g., -0.5 for -50%, 0.25 for +25%
  winModifier: number;   // e.g., 0.35 for +35%, -0.15 for -15%
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
  timestamp: number;
}

export interface Bet {
  playerId: string;
  targetId: string;
  amount: number;
  placedAt: number;
  locked: boolean;
  payout?: number;
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
  // v2.2.0 additions
  settings: GameSettings;
  roundHistory: RoundHistory[];
  eventFeed: GameEvent[];
  countdown?: number; // Game start countdown
}

// Helper function to calculate balance modifiers based on starting money
export function getBalanceModifiers(startingMoney: number): { loss: number; win: number; highStakes: boolean } {
  if (startingMoney >= 500000) {
    return { loss: 0.5, win: -0.35, highStakes: true }; // $500k-$1M: Lose +50%, Win -35%
  } else if (startingMoney >= 100000) {
    return { loss: 0.25, win: -0.15, highStakes: true }; // $100k-$499k: Lose +25%, Win -15%
  } else if (startingMoney < 1000) {
    return { loss: -0.5, win: 0.35, highStakes: false }; // $100-$999: Lose -50%, Win +35%
  }
  return { loss: 0, win: 0, highStakes: false }; // Normal range
}

// Avatar color palette
export const AVATAR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#f43f5e", // rose
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
