import Link from "next/link";

import { cn } from "@/lib/utils/cn";

interface BrandProps {
  inverse?: boolean;
  /** Rotated to run up the fixed rail. */
  vertical?: boolean;
}

/**
 * Wordmark only. Poppins draws a circular full stop, so the signal-green period
 * reads as a dot in the lockup without needing a separate shape to align.
 */
export function Brand({ inverse = false, vertical = false }: BrandProps) {
  return (
    <Link
      className={cn(
        "group inline-block rounded-sm font-display font-bold lowercase leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        vertical
          ? "text-[1rem] tracking-[0.12em] [writing-mode:vertical-rl] [transform:rotate(180deg)]"
          : "text-[1.35rem] tracking-[-0.05em]",
        inverse ? "text-ink" : "text-ink-soft hover:text-ink",
      )}
      href="/"
      aria-label="LearnIT home"
    >
      learnit
      <span className="inline-block text-signal transition-transform duration-300 ease-out group-hover:translate-x-0.5">
        .
      </span>
    </Link>
  );
}
