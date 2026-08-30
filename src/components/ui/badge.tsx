import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "gold" | "amber" | "slate" | "denied" | "open" | "closed";
  className?: string;
};

export function Badge({ children, tone = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em]",
        tone === "gold" && "border-brand-gold/40 text-brand-gold",
        tone === "amber" && "border-brand-amber/50 text-brand-amber",
        tone === "slate" && "border-brand-white/15 text-brand-slate",
        tone === "denied" && "border-denied/40 text-denied",
        tone === "open" && "border-brand-amber/50 bg-brand-amber/10 text-brand-amber",
        tone === "closed" && "border-brand-gold/40 bg-brand-gold/10 text-brand-gold",
        className
      )}
    >
      {children}
    </span>
  );
}
