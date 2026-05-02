import { cn } from "@/lib/utils";
import { formatTimer, type TradeEvent } from "@/lib/simulation/engine";

function toLine(trade: TradeEvent, label: string) {
  const type = trade.type === "LONG" ? "buy" : trade.type === "SHORT" ? "sell" : "exec";
  return {
    id: trade.id,
    ts: formatTimer(trade.timestamp),
    type,
    text: `${label} ${trade.type} ${trade.size.toFixed(2)} ETH @ ${trade.price.toFixed(0)}`,
  };
}

export function AgentLogTV({
  side,
  trades,
  className,
  agentName,
}: {
  side: "left" | "right";
  trades: TradeEvent[];
  className?: string;
  agentName?: string;
}) {
  const tone = side === "left" ? "s" : "b";
  const filtered = trades.filter((trade) => trade.agent === side).slice(0, 8);
  const label = agentName ?? `${side.toUpperCase()}_AGENT`;

  return (
    <div className={cn("cell agent-log-tv", className)}>
      <div className={`tv ${tone === "s" ? "tv-stv" : "tv-btv"}`}>
        <div className="tv-head">
          <span className="tv-ch">CH-{tone === "s" ? "01" : "02"}</span>
          <span className={`tv-ttl ${tone}`}>{label}</span>
          <span className="tv-rec">
            <span className={`rec-d ${tone}`} />REC
          </span>
        </div>
        <div className="tv-screen">
          <div className={`log-feed ${tone === "s" ? "sf" : "bf"}`}>
            {filtered.map((trade) => {
              const line = toLine(trade, label);
              return (
                <div key={line.id} className="ll">
                  <span className={`ll-ts ${tone === "b" ? "b" : ""}`}>{line.ts}</span>
                  <span className={`ll-type ${line.type}`}>[{line.type.toUpperCase()}]</span>
                  <span className="ll-text"> {line.text}</span>
                </div>
              );
            })}
          </div>
          <div className={`tv-cursor ${tone}`}>_</div>
        </div>
      </div>
    </div>
  );
}
