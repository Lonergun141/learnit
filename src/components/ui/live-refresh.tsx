"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface LiveRefreshProps {
  /**
   * Whether work is still in flight. The server recomputes this on every
   * refresh, so the poller switches itself off on the render that settles the
   * last item.
   */
  active: boolean;
  intervalMs?: number;
  maxDurationMs?: number;
}

const DEFAULT_INTERVAL_MS = 10_000;

/**
 * A job that dies without recording a failure leaves its item in an in-flight
 * status until `requeue_stale_jobs` recovers it, so the poll needs its own
 * ceiling rather than trusting the data to settle.
 */
const DEFAULT_MAX_DURATION_MS = 10 * 60 * 1000;

/**
 * Re-runs the current route's server components on an interval while the
 * pipeline is working, so intake rows advance without a manual reload.
 *
 * Renders nothing. `router.refresh()` preserves client state and scroll
 * position, so polling is invisible apart from the data changing.
 */
export function LiveRefresh({
  active,
  intervalMs = DEFAULT_INTERVAL_MS,
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
}: LiveRefreshProps) {
  const router = useRouter();
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      deadlineRef.current = null;
      return;
    }

    // Survives re-renders so the ceiling measures one continuous run of work,
    // not the time since the latest poll.
    deadlineRef.current ??= Date.now() + maxDurationMs;

    let timer = 0;
    const tick = () => {
      // A background tab has nobody watching it; skip the round trip and catch
      // up the moment it comes forward again.
      if (document.hidden) return;
      if (deadlineRef.current !== null && Date.now() > deadlineRef.current) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    };

    timer = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active, intervalMs, maxDurationMs, router]);

  return null;
}
