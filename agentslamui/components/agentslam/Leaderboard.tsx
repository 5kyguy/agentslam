export type LeaderboardItem = {
  name: string;
  score: number;
  delta: number;
};

export function Leaderboard({ title, items }: { title: string; items: LeaderboardItem[] }) {
  return (
    <div className="cell flex-col gap10">
      <div className="section-row">
        <div className="section-hed">{title}</div>
      </div>
      {items.map((item, idx) => (
        <div key={item.name} className="flex justify-between items-center gap8 body-xs">
          <span>
            #{idx + 1} {item.name}
          </span>
          <span className="mono-sm" style={{ color: item.delta >= 0 ? "var(--stoic)" : "var(--berserk)" }}>
            {item.score} ({item.delta >= 0 ? "+" : ""}
            {item.delta})
          </span>
        </div>
      ))}
    </div>
  );
}
