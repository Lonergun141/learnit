import { AlertTriangle, BookCheck, BookOpen, Layers3, Route } from "lucide-react";

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

export function MetricStrip({ counts }: MetricStripProps) {
  return (
    <dl className="grid overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(20,34,31,0.07)] sm:grid-cols-5">
      {metricDefinitions.map(({ key, label, icon: Icon }) => (
        <div
          className="flex items-center gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:block sm:border-b-0 sm:border-r sm:px-5 sm:py-5 sm:last:border-r-0"
          key={key}
        >
          <Icon className={key === "failed" && counts[key] > 0 ? "text-danger" : "text-ink-faint"} size={17} />
          <div className="sm:mt-4">
            <dd className="text-xl font-semibold tabular-nums tracking-[-0.025em] text-ink">
              {counts[key]}
            </dd>
            <dt className="text-xs font-medium text-ink-muted">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}
