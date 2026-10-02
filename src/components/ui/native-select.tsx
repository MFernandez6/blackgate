import * as React from "react";
import { cn } from "@/lib/utils";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-brand-white/10 bg-brand-navy/50 transition-colors focus:border-brand-gold px-3 py-2 text-sm text-brand-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold/50 disabled:cursor-not-allowed disabled:opacity-50 font-sans",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
