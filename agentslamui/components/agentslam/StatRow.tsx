export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap8">
      <span className="body-xs">{label}</span>
      <span className="mono-sm">{value}</span>
    </div>
  );
}
