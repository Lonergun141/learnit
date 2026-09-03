import type { ReactNode } from "react";

import { Blueprint } from "@/components/ui/blueprint";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <Blueprint
        variant="burst"
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 text-signal/[0.06]"
      />
      <div className="relative max-w-sm">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-line-strong text-signal">
          {icon}
        </div>
        <h2 className="display text-base tracking-[0.02em]">{title}</h2>
        <p className="mx-auto mt-2.5 max-w-xs text-sm leading-6 text-ink-muted">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
