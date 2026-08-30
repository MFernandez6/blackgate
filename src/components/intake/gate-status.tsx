import type { IntakeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OPEN_GATE_STATUSES, STATUS_LABELS } from "@/lib/constants";

export function GateStatus({
  status,
  compact = false,
}: {
  status: IntakeStatus;
  compact?: boolean;
}) {
  const open = OPEN_GATE_STATUSES.includes(status);
  const declined = status === "DECLINED";
  const promoted = status === "PROMOTED";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border px-2.5 py-1",
        open && "border-brand-amber/40 bg-brand-amber/10",
        !open && !declined && "border-brand-gold/40 bg-brand-gold/10",
        declined && "border-denied/40 bg-denied-muted"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5",
          open && "animate-gate-pulse bg-brand-amber",
          !open && !declined && "bg-brand-gold",
          declined && "bg-denied"
        )}
      />
      <span
        className={cn(
          "font-mono text-[9px] font-bold uppercase tracking-[0.16em]",
          open && "text-brand-amber",
          !open && !declined && "text-brand-gold",
          declined && "text-denied"
        )}
      >
        {compact
          ? STATUS_LABELS[status]
          : open
            ? `Gate open · ${STATUS_LABELS[status]}`
            : promoted
              ? "Gate closed · Promoted"
              : declined
                ? "Gate closed · Declined"
                : `Gate closed · ${STATUS_LABELS[status]}`}
      </span>
    </div>
  );
}
