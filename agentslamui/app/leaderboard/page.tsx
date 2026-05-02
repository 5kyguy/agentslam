"use client";

import { useEffect, useMemo, useState } from "react";
import { BentoCell, BentoGrid } from "@/components/agentslam/BentoGrid";
import { Leaderboard } from "@/components/agentslam/Leaderboard";
import { formatInt } from "@/lib/format";
import { getLeaderboard, listAgents, type AgentState, type LeaderboardEntry } from "@/lib/api";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getLeaderboard(), listAgents()])
      .then(([nextEntries, nextAgents]) => {
        setEntries(nextEntries);
        setAgents(nextAgents);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Backend unavailable"));
  }, []);

  const strategyRank = useMemo(
    () =>
      entries.map((entry) => ({
        name: entry.strategy,
        score: Math.round(entry.rating),
        delta: Math.round(entry.avgPnlPct),
      })),
    [entries],
  );

  const agentRank = useMemo(
    () =>
      [...agents]
        .sort((a, b) => b.stats.rating - a.stats.rating)
        .slice(0, 8)
        .map((agent) => ({
          name: agent.name,
          score: Math.round(agent.stats.rating),
          delta: agent.stats.wins - agent.stats.losses,
        })),
    [agents],
  );

  const bestClimb = entries.length ? Math.max(...entries.map((entry) => Math.round(entry.avgPnlPct))) : 0;
  const completed = entries.reduce((sum, entry) => sum + entry.matchesPlayed, 0);

  return (
    <div className="bento-wrap" style={{ paddingTop: 20 }}>
      <BentoGrid cols="bento-12">
        <BentoCell className="s12 cell-dark">
          <div className="cell-title lg">Global Leaderboard</div>
          <p className="body-sm mt8">Ranked backend agents after completed matches, using referee-stored win/loss/PnL updates.</p>
          {error && <p className="body-xs mt8" style={{ color: "var(--berserk)" }}>{error}</p>}
        </BentoCell>
      </BentoGrid>
      <BentoGrid cols="bento-12" className="mt10">
        <div className="s6">
          <Leaderboard title="Strategy Ranking" items={strategyRank} />
        </div>
        <div className="s6">
          <Leaderboard title="Registered Agents" items={agentRank} />
        </div>
      </BentoGrid>
      <BentoGrid cols="bento-12" className="mt10">
        <BentoCell className="s4">
          <div className="big-stat gold">{entries.length || agents.length}</div>
          <div className="body-xs">Ranked or registered contenders</div>
        </BentoCell>
        <BentoCell className="s4">
          <div className="big-stat stoic">{bestClimb >= 0 ? "+" : ""}{bestClimb}</div>
          <div className="body-xs">Best average PnL delta</div>
        </BentoCell>
        <BentoCell className="s4">
          <div className="big-stat purple">{formatInt(completed)}</div>
          <div className="body-xs">Completed match records</div>
        </BentoCell>
      </BentoGrid>
      {!error && entries.length === 0 && (
        <BentoGrid cols="bento-12" className="mt10">
          <BentoCell className="s12">
            <div className="section-hed">No completed matches yet</div>
            <p className="body-sm mt8">Run a full match from the command center to populate backend rankings.</p>
          </BentoCell>
        </BentoGrid>
      )}
    </div>
  );
}
