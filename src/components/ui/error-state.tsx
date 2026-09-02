import type { ReactNode } from "react";

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
    <div className="grid min-h-64 place-items-center border-y border-dashed border-line py-12 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-danger-soft text-danger">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
        {digest ? (
          <p className="mt-5 font-mono text-xs text-ink-faint">Reference {digest}</p>
        ) : null}
      </div>
    </div>
  );
}
