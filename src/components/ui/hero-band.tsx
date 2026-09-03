import type { ReactNode } from "react";

import { Blueprint, type BlueprintVariant } from "@/components/ui/blueprint";
import { cn } from "@/lib/utils/cn";

interface HeroBandProps {
  /** Monospace micro-label printed above the title. One or two words. */
  eyebrow: string;
  title: ReactNode;
  /** Right-hand instrument column: a count, a status, a stamp. */
  meta?: ReactNode;
  actions?: ReactNode;
  figure?: BlueprintVariant;
  className?: string;
}

/**
 * The page plate. Compact enough that the work starts above the fold, but ruled,
 * measured, and set in the display face so it still reads as a title card.
 */
export function HeroBand({ eyebrow, title, meta, actions, figure, className }: HeroBandProps) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line", className)}>
      {/*
       * One texture, not three. Column rules and the crosshatch both drew a
       * grid, and a tick ruler under every title made a third. The crosshatch
       * alone carries the drafting-table read without competing with the type.
       */}
      <div className="grid-field absolute inset-0 opacity-20" aria-hidden="true" />
      {figure ? (
        <Blueprint
          variant={figure}
          className="absolute -right-16 top-1/2 hidden h-[20rem] w-[20rem] -translate-y-1/2 text-signal/[0.09] lg:block"
        />
      ) : null}

      <div className="rise relative flex flex-col gap-8 px-6 pb-9 pt-11 sm:flex-row sm:items-end sm:justify-between sm:px-10 lg:px-14">
        <div className="min-w-0">
          <p className="mono-label flex items-center gap-3">
            <span className="h-px w-8 bg-signal" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="display mt-5 text-[clamp(1.9rem,3.6vw,3.1rem)] leading-[0.98]">{title}</h1>
          {actions ? <div className="mt-7">{actions}</div> : null}
        </div>
        {meta ? <div className="shrink-0 sm:text-right">{meta}</div> : null}
      </div>
    </section>
  );
}
