import { cn } from "@/lib/utils";

export function BentoGrid({
  children,
  cols = "bento-12",
  className,
}: {
  children: React.ReactNode;
  cols?: "bento-12" | "bento-6" | "bento-4" | "bento-3" | "bento-2";
  className?: string;
}) {
  return <div className={cn("bento", cols, className)}>{children}</div>;
}

export function BentoCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("cell", className)}>{children}</section>;
}
