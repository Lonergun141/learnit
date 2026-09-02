import { ArrowDown, BookOpenCheck, Link2, Route } from "lucide-react";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";

const routeStops = [
  { label: "Capture a useful link", icon: Link2 },
  { label: "Sort it into a topic", icon: Route },
  { label: "Study, brief, and test", icon: BookOpenCheck },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)]">
      <section className="relative hidden overflow-hidden bg-[#10231f] px-10 py-9 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <Brand inverse />
        <div className="my-auto max-w-lg py-16">
          <h1 className="text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white xl:text-[3.35rem]">
            Keep the insight.
            <br />
            Build the understanding.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            LearnIT turns the links worth saving into a connected library of guides, briefings, and quizzes.
          </p>
          <div className="relative mt-12 grid gap-1 pl-2">
            <span className="absolute bottom-7 left-[1.12rem] top-7 w-px bg-white/15" aria-hidden="true" />
            {routeStops.map(({ label, icon: Icon }, index) => (
              <div className="relative flex items-center gap-4 py-3" key={label}>
                <span className="z-10 grid size-9 place-items-center rounded-full border border-white/15 bg-[#18332d] text-[#f0d36a]">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-medium text-white/85">{label}</span>
                {index < routeStops.length - 1 ? (
                  <ArrowDown className="ml-auto text-white/20" size={15} aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/40">A private learning network, built around your sources.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
