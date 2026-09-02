import type { LearningStatus } from "@/lib/learning/statuses";
import { cn } from "@/lib/utils/cn";

const statusClassNames: Record<LearningStatus, string> = {
  new: "bg-info-soft text-info",
  fetched: "bg-violet-soft text-violet",
  sorted: "bg-warning-soft text-warning",
  done: "bg-success-soft text-success",
  failed: "bg-danger-soft text-danger",
};

interface StatusBadgeProps {
  status: LearningStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        statusClassNames[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status === "failed" ? "Needs attention" : status}
    </span>
  );
}
