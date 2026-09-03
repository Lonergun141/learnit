"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Replaces the root layout when it is the thing that failed, so it cannot rely
 * on anything the layout provides and must render its own document shell.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="grid min-h-full place-items-center bg-background px-6 py-24 text-center">
        <div className="max-w-md">
          <p className="mono-label">learnit</p>
          <h1 className="display mt-8 text-[2rem] leading-none">Something went wrong</h1>
          <p className="mt-5 text-sm leading-7 text-ink-muted">
            Your saved links and topics are unaffected.
          </p>
          <button
            className="mt-10 inline-flex min-h-11 items-center justify-center rounded-lg bg-signal px-6 font-display text-[0.75rem] font-semibold uppercase tracking-[0.09em] text-[#14170f] transition-[filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => retry()}
            type="button"
          >
            Try again
          </button>
          {error.digest ? <p className="mono-label mt-10">Reference {error.digest}</p> : null}
        </div>
      </body>
    </html>
  );
}
