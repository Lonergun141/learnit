import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface SheetSectionProps {
  /** Two-digit ordinal printed at the head of the strip. */
  index: string;
  /** One or two words. The strip is a label, not a paragraph. */
  label: string;
  /** A single link or stamp pinned to the right of the strip. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop the section's padding when the child draws edge-to-edge rows. */
  flush?: boolean;
}

/**
 * One block of the sheet: a thin ruled label strip, then the work at full width.
 * The strip costs a row instead of a column, so nothing is squeezed sideways.
 */
export function SheetSection({
  index,
  label,
  action,
  children,
  className,
  flush = false,
}: SheetSectionProps) {
  return (
    <section className={cn("border-b border-line", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface/40 px-6 py-3 sm:px-10 lg:px-14">
        <h2 className="mono-label flex items-center gap-3">
          <span className="text-signal">{index}</span>
          <span className="h-px w-5 bg-line-strong" aria-hidden="true" />
          <span className="text-ink-soft">{label}</span>
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", flush ? "" : "px-6 py-8 sm:px-10 sm:py-10 lg:px-14")}>
        {children}
      </div>
    </section>
  );
}
