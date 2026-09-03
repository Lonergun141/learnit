import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { Blueprint } from "@/components/ui/blueprint";
import { CropMarks } from "@/components/ui/crop-marks";
import { GridRules } from "@/components/ui/grid-rules";
import { TickRule } from "@/components/ui/tick-rule";

const stages = ["Capture", "Sort", "Study"];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(26rem,1fr)_minmax(28rem,0.85fr)]">
      <section className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col">
        <GridRules columns={4} className="opacity-70" />
        <div className="grid-field absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_25%_25%,color-mix(in_oklab,var(--signal)_11%,transparent),transparent_65%)]"
          aria-hidden="true"
        />
        <Blueprint
          variant="node"
          className="absolute -left-28 bottom-[-6rem] h-[38rem] w-72 text-signal/20"
        />
        <Blueprint variant="star" className="absolute right-14 top-24 h-28 w-28 text-signal/40" />
        <CropMarks className="inset-8" />

        <div className="relative px-12 pt-12 xl:px-16">
          <Brand inverse />
        </div>

        <div className="relative my-auto px-12 py-20 xl:px-16">
          <p className="mono-label flex items-center gap-3">
            <span className="h-px w-10 bg-signal" aria-hidden="true" />
            Private network
          </p>
          <h1 className="display mt-12 text-[clamp(3rem,5.2vw,4.75rem)] leading-[0.9]">
            Keep the
            <br />
            <span className="accent-italic text-signal">insight</span>
          </h1>
        </div>

        <div className="relative">
          <TickRule />
          <ol className="grid grid-cols-3 border-t border-line">
            {stages.map((stage, index) => (
              <li className="border-r border-line px-6 py-7 last:border-r-0 xl:px-8" key={stage}>
                <p className="mono-label text-signal">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-display text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  {stage}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-16 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
