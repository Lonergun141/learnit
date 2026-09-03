import { cn } from "@/lib/utils/cn";

interface TickRuleProps {
  className?: string;
}

/**
 * A measuring rule — minor ticks every 10px, major every 50px — used the way a
 * film leader or an instrument bezel uses one: to make the sheet feel calibrated.
 */
export function TickRule({ className }: TickRuleProps) {
  return (
    <div aria-hidden="true" className={cn("relative h-3 w-full overflow-hidden", className)}>
      <div
        className="absolute inset-x-0 bottom-0 h-1"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--line-strong) 0 1px, transparent 1px 10px)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2.5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--line-strong) 0 1px, transparent 1px 50px)",
        }}
      />
    </div>
  );
}
