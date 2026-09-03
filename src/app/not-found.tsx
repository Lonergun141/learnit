import Link from "next/link";

import { Blueprint } from "@/components/ui/blueprint";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    // Rendered both standalone and inside the app shell, so it stays a plain
    // block: no nested landmark, no forced full-screen height.
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-6 py-24 text-center">
      <Blueprint
        variant="burst"
        className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 text-signal/[0.07]"
      />
      <div className="relative max-w-md">
        <p className="mono-label">Not found</p>
        <p className="display mt-8 text-[clamp(3.5rem,12vw,7rem)] leading-none">404</p>
        <h1 className="display mt-8 text-base tracking-[0.05em]">Nothing at this stop</h1>
        <p className="mt-4 text-sm leading-7 text-ink-muted">
          This page does not exist, or belongs to another account.
        </p>
        <Link className={buttonClassName("primary", "mt-10")} href="/dashboard">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
