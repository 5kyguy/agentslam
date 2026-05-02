"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getExecutions,
  getFeed,
  getMatch,
  getMatchMemory,
  getMatchMemoryFromZg,
  getMatchWsUrl,
  getTrades,
  stopMatch as stopMatchRequest,
  type FeedEvent,
  type KeeperHubExecutionAudit,
  type MatchState,
  type MemoryPage,
  type TradeEvent,
  type WsEnvelope,
  type ZgMemorySnapshot,
} from "@/lib/api";
import {
  latestDecisions,
  matchToMeta,
  summarizeProofs,
  toSimulationState,
} from "@/lib/live-adapters";
import { formatTimer, type ChatMessage } from "@/lib/simulation/engine";

type ConnectionState = "loading" | "live" | "reconnecting" | "offline";

function eventKey(event: FeedEvent) {
  if (event.event === "trade_executed") return `trade:${event.tradeRecordId ?? event.txHash}`;
  return `decision:${event.contender}:${event.timestamp}:${event.action}:${event.amount}`;
}

function upsertFeed(prev: FeedEvent[], next: FeedEvent) {
  const key = eventKey(next);
  const idx = prev.findIndex((item) => eventKey(item) === key);
  if (idx === -1) return [...prev, next].slice(-200);
  const copy = [...prev];
  copy[idx] = next;
  return copy;
}

function upsertTrade(prev: TradeEvent[], next: TradeEvent) {
  const key = next.tradeRecordId ?? next.txHash;
  const idx = prev.findIndex((item) => (item.tradeRecordId ?? item.txHash) === key);
  if (idx === -1) return [...prev, next].slice(-200);
  const copy = [...prev];
  copy[idx] = next;
  return copy;
}

export function useMatchSimulation(matchId: string) {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [executions, setExecutions] = useState<KeeperHubExecutionAudit[]>([]);
  const [memory, setMemory] = useState<MemoryPage | null>(null);
  const [zgMemory, setZgMemory] = useState<ZgMemorySnapshot | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setConnection((current) => (current === "live" ? current : "loading"));
    setError(null);

    try {
      const [nextMatch, nextFeed, nextTrades] = await Promise.all([
        getMatch(matchId),
        getFeed(matchId),
        getTrades(matchId),
      ]);
      const [nextExecutions, nextMemory, nextZgMemory] = await Promise.allSettled([
        getExecutions(matchId),
        getMatchMemory(matchId),
        getMatchMemoryFromZg(matchId),
      ] as const);

      setMatch(nextMatch);
      setFeed(nextFeed);
      setTrades(nextTrades);
      setExecutions(nextExecutions.status === "fulfilled" ? nextExecutions.value : []);
      setMemory(nextMemory.status === "fulfilled" ? nextMemory.value : { events: [], nextCursor: null, source: "memory" });
      setZgMemory(nextZgMemory.status === "fulfilled" ? nextZgMemory.value : { raw: null, configured: false });
      setConnection((current) => (current === "live" ? "live" : "reconnecting"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Backend unavailable";
      setError(message);
      setConnection("offline");
    }
  }, [matchId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function scheduleReconnect() {
      if (closed) return;
      setConnection("reconnecting");
      retry = setTimeout(() => {
        void refresh();
        connect();
      }, 2500);
    }

    function connect() {
      if (closed) return;
      socket = new WebSocket(getMatchWsUrl(matchId));

      socket.onopen = () => {
        setConnection("live");
        setError(null);
      };

      socket.onmessage = (message) => {
        try {
          const envelope = JSON.parse(message.data as string) as WsEnvelope;
          if (envelope.match_id !== matchId) return;

          if (envelope.event === "snapshot" || envelope.event === "completed" || envelope.event === "stopped") {
            setMatch(envelope.payload as MatchState);
          }

          if (envelope.event === "decision") {
            setFeed((prev) => upsertFeed(prev, envelope.payload as FeedEvent));
          }

          if (envelope.event === "trade_executed") {
            const trade = envelope.payload as TradeEvent;
            setTrades((prev) => upsertTrade(prev, trade));
            setFeed((prev) => upsertFeed(prev, trade));
            void Promise.all([getExecutions(matchId), getMatchMemory(matchId), getMatchMemoryFromZg(matchId)])
              .then(([nextExecutions, nextMemory, nextZgMemory]) => {
                setExecutions(nextExecutions);
                setMemory(nextMemory);
                setZgMemory(nextZgMemory);
              })
              .catch(() => {
                // Proof panels are supplemental; keep the live arena moving if a proof refresh fails.
              });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to parse live event");
        }
      };

      socket.onerror = () => {
        setError("Live socket error");
      };

      socket.onclose = () => {
        if (!closed) scheduleReconnect();
      };
    }

    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [matchId, refresh]);

  const state = useMemo(
    () => toSimulationState(match, trades, feed, localMessages),
    [feed, localMessages, match, trades],
  );

  const meta = useMemo(() => matchToMeta(match, matchId), [match, matchId]);

  const proofSummary = useMemo(
    () =>
      summarizeProofs(
        trades,
        executions,
        memory?.events.length ?? 0,
        zgMemory?.configured ?? false,
        Boolean(zgMemory?.raw),
      ),
    [executions, memory?.events.length, trades, zgMemory?.configured, zgMemory?.raw],
  );

  const metrics = useMemo(
    () => ({
      winRate: state.odds.left,
      volatility: Math.abs(state.leftAgentPnL - state.rightAgentPnL).toFixed(2),
      totalTrades: trades.length,
      remaining: formatTimer(match?.timeRemainingSeconds ?? Math.max(0, state.duration - state.elapsed)),
    }),
    [match?.timeRemainingSeconds, state, trades.length],
  );

  function sendChat(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setLocalMessages((prev) => [
      {
        id: `user-${Date.now()}`,
        timestamp: state.elapsed,
        author: "You",
        role: "user",
        content: clean,
      },
      ...prev,
    ]);
  }

  async function stopMatch() {
    const stopped = await stopMatchRequest(matchId);
    setMatch(stopped);
  }

  return {
    state,
    metrics,
    sendChat,
    stopMatch,
    refresh,
    match: meta,
    rawMatch: match,
    feed,
    latestDecisions: latestDecisions(feed),
    trades,
    executions,
    memory,
    zgMemory,
    proofSummary,
    connection,
    error,
  };
}
