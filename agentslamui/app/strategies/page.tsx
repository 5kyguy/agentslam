"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BentoCell, BentoGrid } from "@/components/agentslam/BentoGrid";
import { ProgressBar } from "@/components/agentslam/ProgressBars";
import { Tag } from "@/components/agentslam/Tags";
import { listStrategies, type StrategyOption } from "@/lib/api";

function confidenceFor(strategy: StrategyOption) {
  if (strategy.riskProfile.includes("Low")) return 78;
  if (strategy.riskProfile.includes("Medium")) return 68;
  if (strategy.riskProfile.includes("High")) return 56;
  return 44;
}

function projectedApy(strategy: StrategyOption) {
  const base = strategy.riskProfile.includes("High") ? 31 : strategy.riskProfile.includes("Medium") ? 23 : 16;
  return base + (strategy.id.length % 5);
}

function tagVariant(risk: string) {
  if (risk.includes("Low")) return "stoic" as const;
  if (risk.includes("Medium")) return "gold" as const;
  if (risk.includes("High")) return "berserk" as const;
  return "purple" as const;
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listStrategies()
      .then(setStrategies)
      .catch((err) => setError(err instanceof Error ? err.message : "Backend unavailable"));
  }, []);

  const hotPick = strategies.find((strategy) => strategy.id === "momentum") ?? strategies[0];

  return (
    <div className="bento-wrap" style={{ paddingTop: 20 }}>
      <BentoGrid cols="bento-12">
        <BentoCell className="s9 cell-dark">
          <div className="cell-title lg">Strategy Marketplace</div>
          <p className="body-sm mt8">Backend strategy catalog used to create real Python contender processes for live arena matches.</p>
          {error && <p className="body-xs mt8" style={{ color: "var(--berserk)" }}>{error}</p>}
        </BentoCell>
        <BentoCell className="s3">
          <div className="section-hed">Hot Pick</div>
          <div className="big-stat berserk mt8">{hotPick?.name ?? "..."}</div>
          <div className="body-xs">{hotPick ? `+${projectedApy(hotPick)}% projected APY` : "Waiting for backend"}</div>
        </BentoCell>
      </BentoGrid>

      <BentoGrid cols="bento-12" className="mt10">
        {strategies.map((s) => (
          <BentoCell key={s.id} className="s4">
            <div className="section-row">
              <div className="cell-title">{s.name}</div>
              <Tag variant={tagVariant(s.riskProfile)}>{s.riskProfile}</Tag>
            </div>
            <div className="body-xs">Projected APY: {projectedApy(s)}%</div>
            <div className="body-xs">Strategy ID: {s.id}</div>
            <div className="body-xs">{s.description}</div>
            <div className="body-xs" style={{ marginTop: 12, marginBottom: 4 }}>
              Confidence
            </div>
            <ProgressBar value={confidenceFor(s)} color={s.riskProfile.includes("High") ? "berserk" : "stoic"} />
            <Link className="nbtn fill" style={{ marginTop: 14 }} href="/matches">
              Run Simulation
            </Link>
          </BentoCell>
        ))}
        {!error && strategies.length === 0 && (
          <BentoCell className="s12">
            <div className="section-hed">Loading strategies</div>
          </BentoCell>
        )}
      </BentoGrid>
    </div>
  );
}
