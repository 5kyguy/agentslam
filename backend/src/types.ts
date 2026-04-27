export type MatchStatus = "created" | "running" | "completed" | "stopped";
export type DecisionAction = "buy" | "sell" | "hold";

export interface MatchCreateRequest {
  strategyA: string;
  strategyB: string;
  tokenPair: string;
  startingCapitalUsd: number;
  durationSeconds: number;
}

export interface ContenderState {
  name: string;
  pnlPct: number;
  portfolioUsd: number;
  trades: number;
}

export interface MatchState {
  id: string;
  status: MatchStatus;
  createdAt: string;
  startedAt: string;
  endsAt: string;
  tokenPair: string;
  startingCapitalUsd: number;
  durationSeconds: number;
  timeRemainingSeconds: number;
  ethPrice: number;
  contenders: {
    A: ContenderState;
    B: ContenderState;
  };
}

export interface DecisionEvent {
  event: "decision";
  contender: string;
  action: DecisionAction;
  amount: number;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

export interface TradeEvent {
  event: "trade_executed";
  contender: string;
  txHash: string;
  sold: { token: string; amount: number };
  bought: { token: string; amount: number };
  gasUsd: number;
  timestamp: string;
}

export type FeedEvent = DecisionEvent | TradeEvent;

export interface LeaderboardEntry {
  rank: number;
  strategy: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  avgPnlPct: number;
  matchesPlayed: number;
}

export interface WsEnvelope {
  event: "snapshot" | "decision" | "trade_executed" | "completed" | "stopped";
  match_id: string;
  timestamp: string;
  payload: unknown;
}
