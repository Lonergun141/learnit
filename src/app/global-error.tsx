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
      <body className="grid min-h-full place-items-center bg-background px-6 py-16 text-center">
        <div className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">LearnIT</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            LearnIT could not start this page. Your saved links and topics are unaffected.
          </p>
          <button
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
            onClick={() => retry()}
            type="button"
          >
            Try again
          </button>
          {error.digest ? (
            <p className="mt-6 font-mono text-xs text-ink-faint">Reference {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
