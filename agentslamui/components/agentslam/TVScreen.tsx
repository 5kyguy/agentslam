import type { ChatMessage } from "@/lib/simulation/engine";

function fmtElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function TVScreen({ title, lines }: { title: string; lines: ChatMessage[] }) {
  return (
    <div className="cell cell-dark flex-col gap8">
      <div className="section-row">
        <div className="section-hed">{title}</div>
        <div className="tag tag-live">LIVE</div>
      </div>
      <div style={{ maxHeight: 220, overflow: "auto" }}>
        {lines.slice(0, 8).map((line) => (
          <div key={line.id} className="body-xs" style={{ padding: "4px 0" }}>
            <span className="mono-sm" style={{ color: "var(--t3)", marginRight: 8 }}>
              {fmtElapsed(line.timestamp)}
            </span>
            <span>{line.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
