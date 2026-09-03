import type { ReactNode } from "react";

import { Blueprint } from "@/components/ui/blueprint";

interface ErrorStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /**
   * Support reference from the error boundary. Shown so a user can quote it
   * without exposing the underlying message, which may contain internals.
   */
  digest?: string;
  action?: ReactNode;
}

export function ErrorState({ icon, title, description, digest, action }: ErrorStateProps) {
  return (
    <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-xl border border-dashed border-danger/30 px-6 py-14 text-center">
      <Blueprint
        variant="burst"
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 text-danger/[0.08]"
      />
      <div className="relative max-w-sm">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-danger/40 bg-danger-soft text-danger">
          {icon}
        </div>
        <h2 className="display text-base tracking-[0.02em]">{title}</h2>
        <p className="mx-auto mt-2.5 max-w-xs text-sm leading-6 text-ink-muted">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
        {digest ? <p className="mono-label mt-6">Reference {digest}</p> : null}
      </div>
    </div>
  );
}
