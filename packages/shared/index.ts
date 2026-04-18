export type RPSChoice = "rock" | "paper" | "scissors";

export interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string;
  coins: number;
  isConnected: boolean;
  role: "challenger" | "challengee" | "spectator";
  stats: {
    wins: number;
    losses: number;
    totalWagered: number;
    totalEarned: number;
    winStreak: number;
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
}
