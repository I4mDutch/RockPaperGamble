export type RPSChoice = "rock" | "paper" | "scissors";

export interface Player {
  id: string;
  displayName: string;
  avatarUrl?: string;
  coins: number;
  isConnected: boolean;
  isReady: boolean;
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

export interface GameSettings {
  startingMoney: number;
  balanceModifiers?: {
    lossModifier: number;
    winModifier: number;
  };
}

export interface RoundHistory {
  roundNumber: number;
  winnerId: string;
  challengerId: string;
  challengeeId: string;
  totalPot: number;
  timestamp: number;
}

export type GameEventType = 
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "PLAYER_READY"
  | "PLAYER_UNREADY"
  | "GAME_STARTED"
  | "BET_PLACED"
  | "DUEL_STARTED"
  | "PLAYER_WON"
  | "PLAYER_LOST"
  | "ROUND_COMPLETED"
  | "SETTINGS_UPDATED"
  | "STARTING_PLAYER_SET";

export interface GameEvent {
  id: string;
  type: GameEventType;
  message: string;
  timestamp: number;
  playerId?: string;
  data?: Record<string, any>;
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
  settings?: GameSettings;
  playerTurnOrder?: string[];
  roundHistory?: RoundHistory[];
  events?: GameEvent[];
}
