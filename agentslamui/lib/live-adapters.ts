import type {
  DecisionEvent,
  FeedEvent,
  KeeperHubExecutionAudit,
  MatchState,
  TradeEvent as BackendTradeEvent,
} from "@/lib/api";
import type { ChatMessage, SimulationState, SystemEvent, TradeEvent as UiTradeEvent } from "@/lib/simulation/engine";

export type AgentBrand = {
  name: string;
  codename: string;
  style: "stoic" | "berserk" | "gold" | "purple";
};

export type MatchMeta = {
  id: string;
  title: string;
  status: "live" | "upcoming" | "recap";
  viewers: number;
  prize: number;
  vol: number;
  left: AgentBrand;
  right: AgentBrand;
};

export type ProofSummary = {
  uniswapMode: string;
  quoteRoutes: string[];
  keeperHubCount: number;
  keeperHubLiveCount: number;
  keeperHubErrorCount: number;
  memoryEvents: number;
  zgConfigured: boolean;
  zgHasSnapshot: boolean;
  zgLastTxHash?: string;
};

const STYLE_SEQUENCE: AgentBrand["style"][] = ["stoic", "berserk", "purple", "gold"];

export function backendStatusToUi(status?: MatchState["status"]): MatchMeta["status"] {
  if (status === "running") return "live";
  if (status === "completed" || status === "stopped") return "recap";
  return "upcoming";
}

export function styleForName(name: string, index: number): AgentBrand["style"] {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), index);
  return STYLE_SEQUENCE[Math.abs(hash) % STYLE_SEQUENCE.length] ?? STYLE_SEQUENCE[index % STYLE_SEQUENCE.length]!;
}

export function codenameFor(name: string, fallback: string) {
  const letters = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 4).toUpperCase())
    .join("-");

  return letters || fallback;
}

export function matchToMeta(match: MatchState | null | undefined, id = "pending"): MatchMeta {
  const leftName = match?.contenders.A.name ?? "Agent Alpha";
  const rightName = match?.contenders.B.name ?? "Agent Beta";
  const prize = Math.round((match?.contenders.A.startingCapitalUsd ?? 1000) + (match?.contenders.B.startingCapitalUsd ?? 1000));
  const spread = Math.abs((match?.contenders.A.pnlPct ?? 0) - (match?.contenders.B.pnlPct ?? 0));

  return {
    id: match?.id ?? id,
    title: match ? `${match.tokenPair} Strategy Duel` : "Backend Arena",
    status: backendStatusToUi(match?.status),
    viewers: match ? 1200 + Math.max(0, match.contenders.A.trades + match.contenders.B.trades) * 44 : 0,
    prize,
    vol: Math.max(12, Math.min(98, Math.round(34 + spread * 8))),
    left: {
      name: leftName,
      codename: codenameFor(leftName, "ALPHA"),
      style: styleForName(leftName, 0),
    },
    right: {
      name: rightName,
      codename: codenameFor(rightName, "BETA"),
      style: styleForName(rightName, 1),
    },
  };
}

function secondsSinceMatchStart(match: MatchState | null, timestamp?: string) {
  if (!timestamp) return 0;
  const startedAt = match?.startedAt || match?.createdAt;
  if (!startedAt) return 0;
  const diff = new Date(timestamp).getTime() - new Date(startedAt).getTime();
  return Math.max(0, Math.round(diff / 1000));
}

function isQuoteToken(token: string) {
  return ["USDC", "USDT", "DAI"].includes(token.toUpperCase());
}

function tradePrice(trade: BackendTradeEvent, fallback: number) {
  const soldQuote = isQuoteToken(trade.sold.token);
  const boughtQuote = isQuoteToken(trade.bought.token);
  const quoteAmount = soldQuote ? trade.sold.amount : boughtQuote ? trade.bought.amount : 0;
  const baseAmount = soldQuote ? trade.bought.amount : boughtQuote ? trade.sold.amount : 0;
  return baseAmount > 0 ? quoteAmount / baseAmount : fallback;
}

function sideForContender(match: MatchState | null, contender: string): "left" | "right" {
  if (match?.contenders.A.name === contender) return "left";
  if (match?.contenders.B.name === contender) return "right";
  return "left";
}

function sidePnlUsd(match: MatchState | null, side: "left" | "right") {
  const contender = side === "left" ? match?.contenders.A : match?.contenders.B;
  if (!contender) return 0;
  return contender.portfolioUsd - contender.startingCapitalUsd;
}

export function toUiTrades(match: MatchState | null, trades: BackendTradeEvent[]): UiTradeEvent[] {
  const counts = trades.reduce(
    (acc, trade) => {
      const side = sideForContender(match, trade.contender);
      acc[side] += 1;
      return acc;
    },
    { left: 0, right: 0 },
  );

  return trades
    .map((trade) => {
      const side = sideForContender(match, trade.contender);
      const isBuy = isQuoteToken(trade.sold.token);
      const sideCount = Math.max(1, counts[side]);
      const pnl = sidePnlUsd(match, side) / sideCount;

      return {
        id: trade.tradeRecordId ?? trade.txHash ?? `${trade.contender}-${trade.timestamp}`,
        timestamp: secondsSinceMatchStart(match, trade.timestamp),
        agent: side,
        type: isBuy ? "LONG" : "SHORT",
        size: isBuy ? trade.bought.amount : trade.sold.amount,
        pnl,
        price: tradePrice(trade, match?.ethPrice ?? 0),
      } satisfies UiTradeEvent;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function toSystemEvents(match: MatchState | null, feed: FeedEvent[]): SystemEvent[] {
  return feed
    .slice(-24)
    .reverse()
    .map((event, index) => {
      if (event.event === "decision") {
        return {
          id: `decision-${event.contender}-${event.timestamp}-${index}`,
          timestamp: secondsSinceMatchStart(match, event.timestamp),
          type: event.action === "hold" ? "QUEST" : "LEAD_CHANGE",
          description: `${event.contender} ${event.action.toUpperCase()}: ${event.reasoning}`,
          severity: event.action === "hold" ? "low" : event.confidence >= 0.75 ? "high" : "medium",
        } satisfies SystemEvent;
      }

      return {
        id: `trade-${event.tradeRecordId ?? event.txHash}-${index}`,
        timestamp: secondsSinceMatchStart(match, event.timestamp),
        type: event.lastExecutionError ? "CRITICAL_ALERT" : "HOT_MONEY",
        description: `${event.contender} swapped ${event.sold.amount} ${event.sold.token} for ${event.bought.amount} ${event.bought.token}`,
        severity: event.lastExecutionError ? "high" : "medium",
      } satisfies SystemEvent;
    });
}

export function toChatMessages(match: MatchState | null, feed: FeedEvent[], localMessages: ChatMessage[]): ChatMessage[] {
  const generated = feed
    .slice(-8)
    .reverse()
    .map((event, index) => {
      if (event.event === "decision") {
        return {
          id: `chat-decision-${event.timestamp}-${index}`,
          timestamp: secondsSinceMatchStart(match, event.timestamp),
          author: event.contender,
          role: "bot",
          content: `${event.action.toUpperCase()} (${Math.round(event.confidence * 100)}%): ${event.reasoning}`,
          prediction: sideForContender(match, event.contender),
        } satisfies ChatMessage;
      }

      return {
        id: `chat-trade-${event.tradeRecordId ?? event.txHash}-${index}`,
        timestamp: secondsSinceMatchStart(match, event.timestamp),
        author: "Referee",
        role: "oracle",
        content: `${event.contender} trade recorded via ${event.executionMode ?? "paper"}.`,
        prediction: sideForContender(match, event.contender),
      } satisfies ChatMessage;
    });

  return [...localMessages, ...generated, {
    id: "backend-system",
    timestamp: 0,
    author: "System",
    role: "system",
    content: "Backend arena connected. Decisions, trades, and proofs stream from the referee.",
  }];
}

function oddsFromMatch(match: MatchState | null) {
  if (!match) return { left: 50, right: 50 };
  const spread = match.contenders.A.pnlPct - match.contenders.B.pnlPct;
  const left = Math.max(5, Math.min(95, Math.round(50 + spread * 4)));
  return { left, right: 100 - left };
}

function elapsedSeconds(match: MatchState | null) {
  if (!match) return 0;
  return Math.max(0, match.durationSeconds - match.timeRemainingSeconds);
}

export function toSimulationState(
  match: MatchState | null,
  trades: BackendTradeEvent[],
  feed: FeedEvent[],
  localMessages: ChatMessage[],
): SimulationState {
  const uiTrades = toUiTrades(match, trades);
  const leftPnl = sidePnlUsd(match, "left");
  const rightPnl = sidePnlUsd(match, "right");
  const odds = oddsFromMatch(match);
  const elapsed = elapsedSeconds(match);

  return {
    matchId: match?.id ?? "pending",
    elapsed,
    duration: match?.durationSeconds ?? 300,
    leftAgentPnL: leftPnl,
    rightAgentPnL: rightPnl,
    leftAgentTrades: match?.contenders.A.trades ?? uiTrades.filter((t) => t.agent === "left").length,
    rightAgentTrades: match?.contenders.B.trades ?? uiTrades.filter((t) => t.agent === "right").length,
    stakingVelocity: Math.max(0.5, Math.min(10, uiTrades.length / 2 + Math.abs(leftPnl - rightPnl) / 100)),
    totalStaked: Math.round((match?.contenders.A.portfolioUsd ?? 0) + (match?.contenders.B.portfolioUsd ?? 0)),
    leftStaked: Math.round(match?.contenders.A.portfolioUsd ?? 0),
    rightStaked: Math.round(match?.contenders.B.portfolioUsd ?? 0),
    odds,
    ethPrice: match?.ethPrice ?? 0,
    blockHeight: 0,
    transactionsPerSecond: uiTrades.length ? 18 + uiTrades.length : 0,
    networkLatency: 0,
    recentTrades: uiTrades,
    chatMessages: toChatMessages(match, feed, localMessages),
    systemEvents: toSystemEvents(match, feed),
    lastLeadChange: uiTrades.find((trade) => Math.abs(trade.pnl) > 0)?.timestamp ?? 0,
    isPowerUpAvailable: false,
    tradeAnticipationMeter: match?.status === "running" ? Math.min(100, 30 + uiTrades.length * 8) : 0,
  };
}

export function latestDecisions(feed: FeedEvent[]): DecisionEvent[] {
  return feed
    .filter((event): event is DecisionEvent => event.event === "decision")
    .slice(-8)
    .reverse();
}

export function summarizeProofs(
  trades: BackendTradeEvent[],
  executions: KeeperHubExecutionAudit[],
  memoryEvents: number,
  zgConfigured: boolean,
  zgHasSnapshot: boolean,
  zgLastTxHash?: string,
): ProofSummary {
  const routes = new Set(trades.map((trade) => trade.quoteRouting).filter((route): route is string => Boolean(route)));
  const modes = new Set(trades.map((trade) => trade.executionMode).filter(Boolean));
  const mode = modes.size ? [...modes].join(", ") : "waiting";

  return {
    uniswapMode: mode,
    quoteRoutes: [...routes],
    keeperHubCount: executions.length,
    keeperHubLiveCount: executions.filter((item) => item.keeperhubStatus && !["failed", "error"].includes(item.keeperhubStatus)).length,
    keeperHubErrorCount: executions.filter((item) => item.lastExecutionError).length,
    memoryEvents,
    zgConfigured,
    zgHasSnapshot,
    zgLastTxHash,
  };
}
