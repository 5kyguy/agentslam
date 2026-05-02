"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { TradeEvent } from "@/lib/simulation/engine";
import { cn } from "@/lib/utils";

type Point = {
  i: number;
  t: number;
  left: number;
  right: number;
  lead: "left" | "right" | "tie";
};

function buildSeries(trades: TradeEvent[]): Point[] {
  const ordered = [...trades].reverse();
  let left = 0;
  let right = 0;

  const points: Point[] = [
    { i: 0, t: 0, left: 0, right: 0, lead: "tie" },
  ];

  ordered.forEach((trade, idx) => {
    if (trade.agent === "left") left += trade.pnl;
    else right += trade.pnl;

    const lead = left === right ? "tie" : left > right ? "left" : "right";
    points.push({
      i: idx + 1,
      t: trade.timestamp,
      left,
      right,
      lead,
    });
  });

  while (points.length < 10) {
    const prev = points[points.length - 1] ?? { i: 0, t: 0, left: 0, right: 0, lead: "tie" as const };
    points.push({ ...prev, i: prev.i + 1, t: prev.t + 6 });
  }

  return points.slice(-18);
}

function minMax(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pad = span * 0.18;
  return { min: min - pad, max: max + pad };
}

function scaleX(index: number, total: number) {
  return (index / Math.max(1, total - 1)) * 100;
}

function scaleY(value: number, min: number, max: number) {
  return ((max - value) / Math.max(1e-6, max - min)) * 100;
}

function toPath(values: number[], min: number, max: number) {
  return values
    .map((value, idx) => {
      const x = scaleX(idx, values.length);
      const y = scaleY(value, min, max);
      return `${idx === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`;
    })
    .join(" ");
}

function formatSignedUsd(value: number) {
  const abs = formatMoney(Math.abs(value));
  if (value > 0) return `+$${abs}`;
  if (value < 0) return `-$${abs}`;
  return `$${abs}`;
}

export function PnLChart({
  trades,
  className,
  leftLabel = "Left",
  rightLabel = "Right",
}: {
  trades: TradeEvent[];
  className?: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const model = useMemo(() => {
    const points = buildSeries(trades);
    const leftVals = points.map((p) => p.left);
    const rightVals = points.map((p) => p.right);
    const y = minMax([...leftVals, ...rightVals, 0]);

    let leadSwitches = 0;
    for (let i = 1; i < points.length; i += 1) {
      if (points[i]!.lead !== "tie" && points[i - 1]!.lead !== "tie" && points[i]!.lead !== points[i - 1]!.lead) {
        leadSwitches += 1;
      }
    }

    const latest = points[points.length - 1] ?? points[0]!;
    const spread = latest.left - latest.right;
    const absChanges = points.slice(1).map((p, i) => Math.abs((p.left - p.right) - ((points[i]?.left ?? 0) - (points[i]?.right ?? 0))));
    const volatility = absChanges.length ? absChanges.reduce((a, b) => a + b, 0) / absChanges.length : 0;

    return {
      points,
      leftVals,
      rightVals,
      y,
      leadSwitches,
      spread,
      volatility,
      latest,
    };
  }, [trades]);

  const activeIndex = hoverIdx ?? model.points.length - 1;
  const activePoint = model.points[activeIndex] ?? model.latest;
  const activeX = scaleX(activeIndex, model.points.length);

  return (
    <div className={cn("cell", className)}>
      <div className="section-row">
        <div className="section-hed">PnL Momentum Chart</div>
        <div className="mono-sm">spread ${formatMoney(model.spread)}</div>
      </div>

      <div className="chart-stats">
        <span className="mono-sm">lead switches: {model.leadSwitches}</span>
        <span className="mono-sm">avg delta: ${formatMoney(model.volatility)}</span>
      </div>

      <div
        className="chart-box chart-box-lg"
        style={{ marginTop: 10, padding: 10 }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
          <line x1="0" y1={scaleY(model.y.max, model.y.min, model.y.max)} x2="100" y2={scaleY(model.y.max, model.y.min, model.y.max)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
          <line x1="0" y1={scaleY(0, model.y.min, model.y.max)} x2="100" y2={scaleY(0, model.y.min, model.y.max)} stroke="rgba(255,255,255,0.18)" strokeWidth="0.9" />
          <line x1="0" y1={scaleY(model.y.min, model.y.min, model.y.max)} x2="100" y2={scaleY(model.y.min, model.y.min, model.y.max)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

          <path d={toPath(model.leftVals, model.y.min, model.y.max)} className="chart-line-left" fill="none" stroke="var(--stoic)" strokeWidth="2" />
          <path d={toPath(model.rightVals, model.y.min, model.y.max)} className="chart-line-right" fill="none" stroke="var(--berserk)" strokeWidth="2" />

          {model.points.map((p, idx) => {
            const x = scaleX(idx, model.points.length);
            const ly = scaleY(p.left, model.y.min, model.y.max);
            const ry = scaleY(p.right, model.y.min, model.y.max);
            const isMarker = idx > 0 && model.points[idx - 1] && model.points[idx - 1]!.lead !== "tie" && p.lead !== "tie" && p.lead !== model.points[idx - 1]!.lead;
            return (
              <g key={`pt-${idx}`}>
                <circle cx={x} cy={ly} r={idx === activeIndex ? 1.7 : 1} fill="var(--stoic)" opacity={idx === activeIndex ? 1 : 0.5} />
                <circle cx={x} cy={ry} r={idx === activeIndex ? 1.7 : 1} fill="var(--berserk)" opacity={idx === activeIndex ? 1 : 0.5} />
                {isMarker && <circle cx={x} cy={scaleY(0, model.y.min, model.y.max)} r={1.6} fill="var(--gold)" />}
              </g>
            );
          })}

          <line x1={activeX} y1="0" x2={activeX} y2="100" className="chart-crosshair" />
        </svg>

        <div className="chart-overlay-hit">
          {model.points.map((p, idx) => (
            <button
              key={`hit-${p.i}`}
              type="button"
              aria-label={`Point ${idx + 1}`}
              className="chart-hit-btn"
              style={{ left: `${scaleX(idx, model.points.length)}%` }}
              onMouseEnter={() => setHoverIdx(idx)}
              onFocus={() => setHoverIdx(idx)}
            />
          ))}
        </div>

        <div className="chart-tooltip" style={{ left: `calc(${activeX}% - 76px)` }}>
          <div className="mono-sm">t+{activePoint.t}s</div>
          <div className="body-xs" style={{ color: "var(--stoic)" }}>{leftLabel}: {formatSignedUsd(activePoint.left)}</div>
          <div className="body-xs" style={{ color: "var(--berserk)" }}>{rightLabel}: {formatSignedUsd(activePoint.right)}</div>
        </div>
      </div>

      <div className="ctimes">
        <span>t+{model.points[0]?.t ?? 0}s</span>
        <span>t+{model.latest.t}s</span>
      </div>
    </div>
  );
}
