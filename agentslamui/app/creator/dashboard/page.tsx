"use client";

import { useEffect, useMemo, useState } from "react";
import { BentoCell, BentoGrid } from "@/components/agentslam/BentoGrid";
import { ProgressBar } from "@/components/agentslam/ProgressBars";
import { StatRow } from "@/components/agentslam/StatRow";
import { listAgents, listMatches, getLeaderboard, type AgentState, type LeaderboardEntry, type MatchState } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export default function CreatorDashboardPage() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAgents(), listMatches(), getLeaderboard()])
      .then(([nextAgents, nextMatches, nextLeaderboard]) => {
        setAgents(nextAgents);
        setMatches(nextMatches);
        setLeaderboard(nextLeaderboard);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Backend unavailable"));
  }, []);

  const activeMatches = matches.filter((match) => match.status === "running").length;
  const completedMatches = matches.filter((match) => match.status === "completed").length;
  const avgRating = agents.length
    ? Math.round(agents.reduce((sum, agent) => sum + agent.stats.rating, 0) / agents.length)
    : 0;
  const avgPnl = leaderboard.length
    ? leaderboard.reduce((sum, entry) => sum + entry.avgPnlPct, 0) / leaderboard.length
    : 0;
  const latestEvents = useMemo(
    () =>
      [...matches]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [matches],
  );

  return (
    <div className="bento-wrap" style={{ paddingTop: 20 }}>
      <BentoGrid cols="bento-12">
        <BentoCell className="s8 cell-dark">
          <div className="cell-title lg">Creator Dashboard</div>
          <p className="body-sm mt8">Monitor backend agents, live matches, and ranked strategy performance from the referee store.</p>
          {error && <p className="body-xs mt8" style={{ color: "var(--berserk)" }}>{error}</p>}
        </BentoCell>
        <BentoCell className="s4">
          <div className="section-hed">Creator Tier</div>
          <div className="big-stat gold mt8">{avgRating >= 1250 ? "ORACLE" : "BUILDER"}</div>
          <div className="body-xs">Average rating {avgRating || "pending"}</div>
        </BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s3"><div className="big-stat stoic">{agents.length}</div><div className="big-stat-label">Registered Agents</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat gold">{completedMatches}</div><div className="big-stat-label">Completed Matches</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat purple">{activeMatches}</div><div className="big-stat-label">Active Matches</div></BentoCell>
        <BentoCell className="s3"><div className="big-stat berserk">{avgPnl.toFixed(1)}%</div><div className="big-stat-label">Avg Ranked PnL</div></BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s6">
          <div className="section-hed">Strategy Health</div>
          <div className="body-xs" style={{ marginTop: 10, marginBottom: 4 }}>Execution Stability</div>
          <ProgressBar value={Math.min(100, 60 + completedMatches * 8)} color="stoic" />
          <div className="body-xs" style={{ marginTop: 10, marginBottom: 4 }}>Market Adaptability</div>
          <ProgressBar value={Math.min(100, 50 + leaderboard.length * 10)} color="gold" />
          <div className="body-xs" style={{ marginTop: 10, marginBottom: 4 }}>Risk Discipline</div>
          <ProgressBar value={Math.min(100, Math.max(35, avgRating / 18))} color="purple" />
        </BentoCell>

        <BentoCell className="s6">
          <div className="section-hed">Latest Events</div>
          <div className="mt10 flex-col gap8">
            {latestEvents.map((match) => (
              <StatRow
                key={match.id}
                label={`${match.contenders.A.name} vs ${match.contenders.B.name}`}
                value={`${match.status} $${formatMoney(match.contenders.A.portfolioUsd + match.contenders.B.portfolioUsd)}`}
              />
            ))}
            {latestEvents.length === 0 && <StatRow label="Backend match feed" value="Waiting" />}
          </div>
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
