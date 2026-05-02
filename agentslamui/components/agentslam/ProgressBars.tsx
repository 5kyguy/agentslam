export function ProgressBar({ value, color }: { value: number; color: "stoic" | "berserk" | "gold" | "purple" }) {
  return (
    <div className="bar-wrap">
      <div className={`bar-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function TugOfWarBar({ stoic }: { stoic: number }) {
  const safe = Math.max(0, Math.min(100, stoic));
  return (
    <div className="tug-bar" aria-label="Tug of war momentum">
      <div className="tug-s" style={{ width: `${safe}%` }} />
      <div className="tug-b" style={{ width: `${100 - safe}%` }} />
    </div>
  );
}
