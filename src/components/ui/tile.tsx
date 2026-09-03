import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface TileProps {
  /** Micro-label strip at the head of the tile. Omit when the tile carries its own heading. */
  label?: string;
  /** A single link or stamp pinned to the right of the label strip. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop the body padding when the child draws edge-to-edge rows. */
  flush?: boolean;
}

/**
 * One cell of the bento. A hairline-bounded panel that owns its own rounding
 * and clipping, so flush row content stops cleanly at the corner radius.
 */
export function Tile({ label, action, children, className, flush = false }: TileProps) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 sm:px-6">
          <h2 className="mono-label text-ink-soft">{label}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {/* Relative so a tile can lay texture or a figure behind its own body. */}
      <div className={cn("relative min-w-0 flex-1", flush ? "" : "px-5 py-5 sm:px-6 sm:py-6")}>
        {children}
      </div>
    </section>
  );
}
