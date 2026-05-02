export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");

export const WS_BASE_URL = API_BASE_URL.replace(/^http/i, "ws");

export type MatchStatus = "created" | "running" | "completed" | "stopped";
export type DecisionAction = "buy" | "sell" | "hold";
export type AgentStatus = "ready" | "in_match" | "destroyed";

export interface StrategyOption {
  id: string;
  name: string;
  riskProfile: string;
  description: string;
}

export interface AgentStats {
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  avgPnlPct: number;
}

export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  strategy: string;
  prompt: string;
  riskTolerance: number;
  personality: string;
  createdAt: string;
  stats: AgentStats;
}

export interface AgentCreateRequest {
  name: string;
  strategy: string;
  prompt?: string;
  riskTolerance?: number;
  personality?: string;
}

export interface MatchCreateRequest {
  agentA: string;
  agentB: string;
  tokenPair: string;
  startingCapitalUsd?: number;
  startingCapitalUsdA?: number;
  startingCapitalUsdB?: number;
  durationSeconds?: number;
}

export interface ContenderState {
  name: string;
  startingCapitalUsd: number;
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
  executionMode?: "paper" | "uniswap_quote_mock" | "uniswap_live_swap";
  quoteRouting?: string;
  mockSwapBuild?: {
    mode?: string;
    chainId?: number;
    routing?: string;
    quoteSnippet?: { amountIn?: string; amountOut?: string };
    note?: string;
  };
  unsignedSwap?: {
    to?: string;
    from?: string;
    data?: string;
    value?: string;
    chainId?: number;
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasFee?: string;
  };
  swapRequestId?: string;
  swapError?: string;
  approvalRequestId?: string;
  tradeRecordId?: string;
  keeperhubSubmissionId?: string;
  keeperhubStatus?: string;
  keeperhubRetryCount?: number;
  onChainTxHash?: string;
  executionReceipt?: Record<string, unknown>;
  lastExecutionError?: string;
  keeperhubTransactionLink?: string;
}

export type FeedEvent = DecisionEvent | TradeEvent;

export interface KeeperHubExecutionAudit {
  tradeRecordId: string;
  contender: string;
  timestamp: string;
  executionMode?: TradeEvent["executionMode"];
  sold: TradeEvent["sold"];
  bought: TradeEvent["bought"];
  keeperhubSubmissionId?: string;
  keeperhubStatus?: string;
  keeperhubRetryCount?: number;
  onChainTxHash?: string;
  keeperhubTransactionLink?: string;
  lastExecutionError?: string;
  executionReceipt?: Record<string, unknown>;
}

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

export interface MemoryEvent {
  schemaVersion?: number;
  kind?: string;
  timestamp?: string;
  matchId?: string;
  agentId?: string;
  contenderName?: string;
  payload?: unknown;
}

export interface MemoryPage {
  events: MemoryEvent[];
  nextCursor: number | null;
  source: string;
}

export interface ZgMemorySnapshot {
  raw: string | null;
  configured: boolean;
}

export interface WsEnvelope {
  event: "snapshot" | "decision" | "trade_executed" | "completed" | "stopped";
  match_id: string;
  timestamp: string;
  payload: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function jsonHeaders(init?: RequestInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: init.body ? jsonHeaders(init) : init.headers,
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listStrategies() {
  return apiFetch<StrategyOption[]>("/api/strategies");
}

export function listAgents() {
  return apiFetch<AgentState[]>("/api/agents");
}

export function createAgent(input: AgentCreateRequest) {
  return apiFetch<AgentState>("/api/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMatches(status?: MatchStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<MatchState[]>(`/api/matches${query}`);
}

export function getMatch(id: string) {
  return apiFetch<MatchState>(`/api/matches/${encodeURIComponent(id)}`);
}

export function createMatch(input: MatchCreateRequest) {
  return apiFetch<MatchState>("/api/matches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function stopMatch(id: string) {
  return apiFetch<MatchState>(`/api/matches/${encodeURIComponent(id)}/stop`, {
    method: "POST",
  });
}

export function getTrades(id: string) {
  return apiFetch<TradeEvent[]>(`/api/matches/${encodeURIComponent(id)}/trades`);
}

export function getFeed(id: string) {
  return apiFetch<FeedEvent[]>(`/api/matches/${encodeURIComponent(id)}/feed`);
}

export function getExecutions(id: string) {
  return apiFetch<KeeperHubExecutionAudit[]>(`/api/matches/${encodeURIComponent(id)}/executions`);
}

export function getMatchMemory(id: string) {
  return apiFetch<MemoryPage>(`/api/matches/${encodeURIComponent(id)}/memory?limit=100`);
}

export function getMatchMemoryFromZg(id: string) {
  return apiFetch<ZgMemorySnapshot>(`/api/matches/${encodeURIComponent(id)}/memory/zg`);
}

export function getLeaderboard() {
  return apiFetch<LeaderboardEntry[]>("/api/leaderboard");
}

export function getMatchWsUrl(id: string) {
  return `${WS_BASE_URL}/ws/matches/${encodeURIComponent(id)}`;
}
