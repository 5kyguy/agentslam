import { cn } from "@/lib/utils";

type Variant = "stoic" | "berserk" | "gold" | "purple" | "gray" | "live";

export function Tag({ children, variant = "gray" }: { children: React.ReactNode; variant?: Variant }) {
  return <span className={cn("tag", `tag-${variant}`)}>{children}</span>;
}
