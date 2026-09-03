import { AlertTriangle, BookCheck, BookOpen, Layers3, Route } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface MetricStripProps {
  counts: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
    topics: number;
  };
}

const metricDefinitions = [
  { key: "total", label: "Library", icon: Layers3 },
  { key: "processing", label: "In transit", icon: Route },
  { key: "completed", label: "Ready", icon: BookCheck },
  { key: "failed", label: "Attention", icon: AlertTriangle },
  { key: "topics", label: "Topics", icon: BookOpen },
] as const;

/**
 * The counter bank. Full-bleed cells split by hairlines, each carrying one
 * zero-padded figure — read as instrumentation, not as a stat card.
 */
export function MetricStrip({ counts }: MetricStripProps) {
  return (
    <dl className="grid grid-cols-2 border-b border-line sm:grid-cols-3 lg:grid-cols-5">
      {metricDefinitions.map(({ key, label, icon: Icon }) => {
        const alert = key === "failed" && counts[key] > 0;
        return (
          <div
            className="group relative border-b border-r border-line px-6 py-5 transition-colors duration-300 last:border-r-0 hover:bg-surface-muted/40 sm:px-8 lg:border-b-0 [&:first-child]:sm:pl-10 [&:first-child]:lg:pl-14"
            key={key}
          >
            <div className="flex items-center justify-between gap-3">
              <dt className="mono-label">{label}</dt>
              <Icon
                className={
                  alert
                    ? "text-danger"
                    : "text-line-strong transition-colors group-hover:text-signal"
                }
                size={13}
              />
            </div>
            <dd
              className={cn(
                "display mt-4 text-[2rem] leading-none tabular-nums sm:text-[2.25rem]",
                alert && "text-danger",
              )}
            >
              {String(counts[key]).padStart(2, "0")}
            </dd>
            <span
              className="absolute bottom-0 left-0 h-px w-0 bg-signal transition-[width] duration-500 ease-out group-hover:w-full"
              aria-hidden="true"
            />
          </div>
        );
      })}
    </dl>
  );
}
