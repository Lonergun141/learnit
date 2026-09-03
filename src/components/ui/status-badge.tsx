import {
  determineItemPhase,
  isPhaseInFlight,
  phaseCopy,
  type ItemPhase,
  type JobStage,
  type LearningStatus,
} from "@/lib/learning/statuses";
import { cn } from "@/lib/utils/cn";

/**
 * Tone encodes the class of state — working, settled, stopped — while the
 * label names the step. Giving each in-flight step its own colour would read
 * as four unrelated states rather than one process advancing.
 */
const phaseClassNames: Record<ItemPhase, string> = {
  fetching: "bg-info-soft text-info",
  sorting: "bg-info-soft text-info",
  building: "bg-info-soft text-info",
  stalled: "bg-warning-soft text-warning",
  done: "bg-success-soft text-success",
  failed: "bg-danger-soft text-danger",
};

interface StatusBadgeProps {
  status: LearningStatus;
  failureStage?: JobStage | null;
}

export function StatusBadge({ status, failureStage = null }: StatusBadgeProps) {
  const phase = determineItemPhase({ status, failureStage });

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.07em]",
        phaseClassNames[phase],
      )}
    >
      <span className="relative flex size-1.5 items-center justify-center" aria-hidden="true">
        {isPhaseInFlight(phase) ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75 motion-reduce:hidden" />
        ) : null}
        <span className="inline-flex size-1 rounded-full bg-current" />
      </span>
      {phaseCopy[phase].badge}
    </span>
  );
}
