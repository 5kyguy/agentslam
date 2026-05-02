export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`cell ${className}`.trim()}>{children}</div>;
}
