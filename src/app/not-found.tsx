import { Compass } from "lucide-react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    // Rendered both standalone and inside the app shell's <main>, so it stays a
    // plain block: no nested landmark, no forced full-screen height.
    <div className="grid min-h-[60vh] place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-surface-muted text-ink-muted">
          <Compass size={20} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
          There is nothing at this stop
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          The page you asked for does not exist, or it belongs to a different account.
        </p>
        <Link className={buttonClassName("primary", "mt-6")} href="/dashboard">
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
