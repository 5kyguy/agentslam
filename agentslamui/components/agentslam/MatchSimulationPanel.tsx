"use client";

import Link from "next/link";
import { AgentLogTV } from "@/components/agentslam/arena/AgentLogsTV";
import { PnLChart } from "@/components/agentslam/arena/PnLChart";
import { TugOfWarCharacters } from "@/components/agentslam/arena/TugOfWarCharacters";
import { useMatchSimulation } from "@/hooks/useMatchSimulation";
import { formatTimer } from "@/lib/simulation/engine";
import { formatInt, formatMoney } from "@/lib/format";
import { BentoCell, BentoGrid } from "@/components/agentslam/BentoGrid";
import { Chat } from "@/components/agentslam/Chat";
import { ProgressBar } from "@/components/agentslam/ProgressBars";
import { StatRow } from "@/components/agentslam/StatRow";
import { Tag } from "@/components/agentslam/Tags";

type View = "detail" | "arena" | "recap";

function confidenceBand(volatility: number, velocity: number) {
  const spreadPenalty = Math.min(18, volatility / 9);
  const velocityPenalty = Math.min(8, velocity / 2.5);
  const width = Math.max(4, Math.round(16 - spreadPenalty + velocityPenalty));
  return width;
}

export function MatchSimulationPanel({
  matchId,
  view,
}: {
  matchId: string;
  view: View;
}) {
  const {
    state,
    metrics,
    sendChat,
    stopMatch,
    match,
    rawMatch,
    latestDecisions,
    executions,
    memory,
    zgMemory,
    proofSummary,
    connection,
    error,
  } = useMatchSimulation(matchId);

  const leadLeft = state.leftAgentPnL >= state.rightAgentPnL;
  const volatilityNum = Math.abs(state.leftAgentPnL - state.rightAgentPnL);
  const confidenceWidth = confidenceBand(volatilityNum, state.stakingVelocity);
  const activityBars = [...state.recentTrades]
    .reverse()
    .slice(-12)
    .map((trade) => Math.min(10, Math.max(1, Math.round(trade.size * 2))));
  const turningPoints = state.systemEvents
    .filter((event) => event.type === "LEAD_CHANGE" || event.type === "HOT_MONEY" || event.type === "CRITICAL_ALERT")
    .slice(0, 4);
  const decisionCards = latestDecisions.slice(0, 4).map((decision, index) => {
    const side = rawMatch?.contenders.A.name === decision.contender ? "left" : "right";
    const actor = side === "left" ? match.left.codename : match.right.codename;
    const confidence = Math.round(decision.confidence * 100);
    const horizon = decision.action === "hold" ? "observe" : decision.action === "buy" ? "accumulate" : "reduce";
    const risk = confidence >= 75 ? "high-conviction" : confidence >= 50 ? "balanced" : "low-conviction";
    const timestamp = rawMatch?.startedAt
      ? Math.max(0, Math.round((new Date(decision.timestamp).getTime() - new Date(rawMatch.startedAt).getTime()) / 1000))
      : index * 10;
    return { decision, actor, confidence, horizon, risk, reason: decision.reasoning, timestamp };
  });
  const recapInsights = [
    `${match.left.codename} executed ${state.leftAgentTrades} trades with ${formatMoney(state.leftAgentPnL)} end PnL.`,
    `${match.right.codename} executed ${state.rightAgentTrades} trades with ${formatMoney(state.rightAgentPnL)} end PnL.`,
    `Key swing came around t+${state.lastLeadChange}s when lead momentum flipped.`,
  ];

  return (
    <div className="bento-wrap" style={{ paddingTop: 74 }}>
      <BentoGrid cols="bento-12">
        <BentoCell className="s8 cell-dark">
          <div className="section-row">
            <div>
              <div className="cell-title lg">{match.left.name} vs {match.right.name}</div>
              <div className="body-xs mt4">{match.title} · #{match.id}</div>
            </div>
            <Tag variant={match.status === "live" ? "live" : match.status === "upcoming" ? "gold" : "purple"}>
              {match.status}
            </Tag>
          </div>
          <div className="flex gap12 items-center" style={{ marginBottom: 10, flexWrap: "wrap" }}>
            <Tag variant={match.left.style}>{match.left.codename} {state.odds.left}%</Tag>
            <Tag variant={match.right.style}>{match.right.codename} {state.odds.right}%</Tag>
            <span className="mono-sm">Timer {formatTimer(state.duration - state.elapsed)}</span>
            <span className="mono-sm">Staked ${formatInt(Math.round(state.totalStaked))}</span>
            <span className="mono-sm">Backend {connection}</span>
          </div>
          {error && (
            <div className="body-xs" style={{ color: "var(--berserk)", marginBottom: 10 }}>
              {error}
            </div>
          )}
          <ProgressBar value={state.odds.left} color="stoic" />
          <div className="flex gap10" style={{ marginTop: 12, flexWrap: "wrap" }}>
            <Link href={`/matches/${matchId}`} className="nbtn outline">
              Match Detail
            </Link>
            <Link href={`/matches/${matchId}/arena`} className="nbtn fill">
              Live Arena
            </Link>
            <Link href={`/matches/${matchId}/recap`} className="nbtn outline">
              Recap
            </Link>
            {rawMatch?.status === "running" && (
              <button className="nbtn outline" type="button" onClick={() => void stopMatch()}>
                Stop
              </button>
            )}
          </div>
        </BentoCell>

        <BentoCell className="s4">
          <div className="section-hed">Quick Metrics</div>
          <div className="flex-col gap8 mt8">
            <StatRow label="Win probability" value={`${metrics.winRate}% ${match.left.codename}`} />
            <StatRow
              label="Confidence interval"
              value={`${Math.max(0, metrics.winRate - confidenceWidth)}-${Math.min(100, metrics.winRate + confidenceWidth)}%`}
            />
            <StatRow label="PnL spread" value={`${metrics.volatility}`} />
            <StatRow label="Trade tape" value={metrics.totalTrades} />
            <StatRow label={`${match.left.name} PnL`} value={`$${formatMoney(state.leftAgentPnL)}`} />
            <StatRow label={`${match.right.name} PnL`} value={`$${formatMoney(state.rightAgentPnL)}`} />
            <StatRow label="Remaining" value={metrics.remaining} />
          </div>
        </BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        {view === "detail" && (
          <>
            <BentoCell className="s12">
              <div className="section-row">
                <div className="section-hed">Tale of the Tape</div>
              </div>
              <div className="bento bento-2">
                <div className="cell cell-stoic">
                  <div className="cell-title">{match.left.name}</div>
                  <div className="body-xs mt6">Codename: {match.left.codename}</div>
                  <div className="body-xs">Profile: disciplined trend + DCA execution</div>
                  <div className="body-xs">Style risk: controlled drawdown</div>
                </div>
                <div className="cell cell-berserk">
                  <div className="cell-title">{match.right.name}</div>
                  <div className="body-xs mt6">Codename: {match.right.codename}</div>
                  <div className="body-xs">Profile: aggressive momentum / reversal snipes</div>
                  <div className="body-xs">Style risk: high variance, high upside</div>
                </div>
              </div>
            </BentoCell>
            <BentoCell className="s6">
              <div className="section-hed">Trade Activity</div>
              <div className="flex gap4 mt10" style={{ alignItems: "flex-end", minHeight: 80 }}>
                {activityBars.map((v, idx) => (
                  <div
                    key={`${idx}-${v}`}
                    style={{
                      flex: 1,
                      height: `${12 + v * 6}px`,
                      background: leadLeft ? "var(--stoic)" : "var(--berserk)",
                      opacity: 0.15 + v / 14,
                      borderRadius: 4,
                    }}
                  />
                ))}
              </div>
            </BentoCell>
            <BentoCell className="s6">
              <div className="section-hed">Market Telemetry</div>
              <div className="mt10 flex-col gap10">
                <StatRow label="ETH" value={`$${formatMoney(state.ethPrice)}`} />
                <StatRow label="Block" value={formatInt(state.blockHeight)} />
                <StatRow label="TPS" value={state.transactionsPerSecond.toFixed(1)} />
                <StatRow label="Latency" value={`${state.networkLatency.toFixed(0)}ms`} />
                <StatRow label="Stake velocity" value={`${state.stakingVelocity.toFixed(1)} /10s`} />
                <div>
                  <div className="body-xs" style={{ marginBottom: 4 }}>
                    Trade anticipation
                  </div>
                  <ProgressBar value={state.tradeAnticipationMeter} color="gold" />
                </div>
              </div>
            </BentoCell>
            <BentoCell className="s6">
              <div className="section-hed">Decision Feed (Per Tick)</div>
              <div className="flex-col gap8 mt10">
                {decisionCards.map((item) => (
                  <div key={`${item.decision.contender}-${item.decision.timestamp}-${item.decision.action}`} className="cell" style={{ padding: 12 }}>
                    <div className="flex justify-between items-center">
                      <div className="mono-sm">{item.actor}</div>
                      <div className="mono-sm">{formatTimer(item.timestamp)}</div>
                    </div>
                    <div className="body-xs mt4">
                      {item.decision.action.toUpperCase()} · confidence {item.confidence}% · mode {item.horizon} · {item.risk}
                    </div>
                    <div className="body-xs">{item.reason}</div>
                  </div>
                ))}
                {decisionCards.length === 0 && <div className="body-xs">Waiting for backend decisions.</div>}
              </div>
            </BentoCell>
            <BentoCell className="s12">
              <div className="section-hed">Turning Points</div>
              <div className="flex-col gap8 mt10">
                {turningPoints.map((event) => (
                  <div key={event.id} className="body-xs">
                    <span className="mono-sm" style={{ marginRight: 8, color: "var(--t3)" }}>
                      {formatTimer(event.timestamp)}
                    </span>
                    {event.description}
                  </div>
                ))}
              </div>
            </BentoCell>
          </>
        )}

        {(view === "arena" || view === "recap") && (
          <>
            <TugOfWarCharacters leftPct={state.odds.left} leftName={match.left.name} rightName={match.right.name} />
            <AgentLogTV side="left" trades={state.recentTrades} className="s3" agentName={match.left.codename} />
            <PnLChart
              trades={state.recentTrades}
              className="s6"
              leftLabel={match.left.codename}
              rightLabel={match.right.codename}
            />
            <AgentLogTV side="right" trades={state.recentTrades} className="s3" agentName={match.right.codename} />
            <BentoCell className="s12">
              <Chat messages={state.chatMessages} onSend={sendChat} />
            </BentoCell>
          </>
        )}
      </BentoGrid>

      {view === "recap" && (
        <BentoGrid cols="bento-12" className="mt10">
          <BentoCell className="s12 cell-gold">
            <div className="section-hed">Post Match Debrief</div>
            <div className="body-sm mt8">
              Winner: {leadLeft ? match.left.name : match.right.name} ({leadLeft ? match.left.codename : match.right.codename})
            </div>
            <div className="flex-col gap8 mt10">
              {recapInsights.map((line) => (
                <div key={line} className="body-xs">
                  {line}
                </div>
              ))}
            </div>
          </BentoCell>
        </BentoGrid>
      )}

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s4">
          <div className="section-hed">Uniswap Proof</div>
          <div className="mt10 flex-col gap8">
            <StatRow label="Execution mode" value={proofSummary.uniswapMode} />
            <StatRow label="Quote routes" value={proofSummary.quoteRoutes.join(", ") || "pending"} />
            <StatRow label="Trade records" value={state.recentTrades.length} />
          </div>
        </BentoCell>
        <BentoCell className="s4">
          <div className="section-hed">KeeperHub Audit</div>
          <div className="mt10 flex-col gap8">
            <StatRow label="Submissions" value={proofSummary.keeperHubCount} />
            <StatRow label="Live statuses" value={proofSummary.keeperHubLiveCount} />
            <StatRow label="Errors" value={proofSummary.keeperHubErrorCount} />
          </div>
          <div className="mt10 flex-col gap6">
            {executions.slice(0, 3).map((item) => (
              <div key={item.tradeRecordId} className="body-xs">
                <span className="mono-sm">{item.keeperhubStatus ?? "queued"}</span>{" "}
                {item.keeperhubTransactionLink ? (
                  <a href={item.keeperhubTransactionLink} target="_blank" rel="noreferrer" className="section-link">
                    tx link
                  </a>
                ) : (
                  item.contender
                )}
              </div>
            ))}
            {executions.length === 0 && <div className="body-xs">No KeeperHub submissions yet.</div>}
          </div>
        </BentoCell>
        <BentoCell className="s4">
          <div className="section-hed">0G Memory</div>
          <div className="mt10 flex-col gap8">
            <StatRow label="Memory events" value={proofSummary.memoryEvents} />
            <StatRow label="KV configured" value={proofSummary.zgConfigured ? "yes" : "no"} />
            <StatRow
              label="Last write"
              value={proofSummary.zgLastTxHash ? `${proofSummary.zgLastTxHash.slice(0, 10)}…` : "pending"}
            />
            <StatRow label="KV read-back" value={proofSummary.zgHasSnapshot ? "synced" : "pending"} />
          </div>
          <div className="body-xs mt10">
            Source: {memory?.source ?? "memory"} · Raw bytes: {zgMemory?.raw?.length ?? 0}
          </div>
          {proofSummary.zgLastTxHash && (
            <div className="body-xs mt6">
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${proofSummary.zgLastTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="section-link"
              >
                View on chainscan
              </a>
            </div>
          )}
        </BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s8">
          <div className="section-hed">Recent Trades</div>
          <div className="mt10 flex-col gap6">
            {state.recentTrades.slice(0, 8).map((trade) => (
              <div
                key={trade.id}
                className="flex justify-between body-xs"
                style={{ borderTop: "1px solid var(--border)", paddingTop: 6 }}
              >
                <span>
                  {trade.agent === "left" ? match.left.codename : match.right.codename} {trade.type}
                </span>
                <span className="mono-sm">{trade.size.toFixed(2)} ETH</span>
                <span className="mono-sm">@ ${formatMoney(trade.price)}</span>
                <span
                  className="mono-sm"
                  style={{ color: trade.pnl >= 0 ? "var(--stoic)" : "var(--berserk)" }}
                >
                  {trade.pnl >= 0 ? "+" : "-"}${formatMoney(Math.abs(trade.pnl))}
                </span>
              </div>
            ))}
          </div>
        </BentoCell>
        <BentoCell className="s4">
          <div className="section-hed">System Events</div>
          <div className="mt10 flex-col gap8">
            {state.systemEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="body-xs">
                <span className="mono-sm" style={{ color: "var(--t3)", marginRight: 6 }}>
                  {formatTimer(event.timestamp)}
                </span>
                <span
                  style={{
                    color:
                      event.severity === "high"
                        ? "var(--berserk)"
                        : event.severity === "medium"
                          ? "var(--gold)"
                          : "var(--t2)",
                  }}
                >
                  {event.description}
                </span>
              </div>
            ))}
          </div>
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
