export type LearningStatus = "new" | "fetched" | "sorted" | "done" | "failed";
export type JobStage = "fetch" | "classify" | "build_topic" | "capture_playlist" | "digest";

interface RetryState {
  status: LearningStatus;
  failureStage: JobStage | null;
}

export function determineRetryStage(state: RetryState): JobStage | null {
  if (state.status === "failed" && state.failureStage === "fetch") return "fetch";
  if (state.status === "fetched" && state.failureStage === "classify") return "classify";
  if (state.status === "sorted" && state.failureStage === "build_topic") {
    return "build_topic";
  }
  return null;
}

/**
 * What an item is visibly doing, as opposed to the raw row status.
 *
 * `status` alone cannot answer this: the worker records a classify or build
 * failure by setting `failure_stage` while leaving the status at its last
 * completed step, so a stuck item still reads as `fetched` or `sorted`. Those
 * pairs are `stalled` — waiting on a retry, not on the worker.
 */
export type ItemPhase = "fetching" | "sorting" | "building" | "stalled" | "done" | "failed";

interface PhaseState {
  status: LearningStatus;
  failureStage: JobStage | null;
}

const inFlightPhases: Record<LearningStatus, ItemPhase | null> = {
  new: "fetching",
  fetched: "sorting",
  sorted: "building",
  done: null,
  failed: null,
};

export function determineItemPhase(state: PhaseState): ItemPhase {
  if (state.status === "done") return "done";
  if (state.status === "failed") return "failed";

  const phase = inFlightPhases[state.status];
  if (!phase) return "done";
  return state.failureStage ? "stalled" : phase;
}

export function isPhaseInFlight(phase: ItemPhase): boolean {
  return phase === "fetching" || phase === "sorting" || phase === "building";
}

/** True while at least one item is still moving through the pipeline. */
export function hasWorkInFlight(states: readonly PhaseState[]): boolean {
  return states.some((state) => isPhaseInFlight(determineItemPhase(state)));
}

/**
 * `badge` is the pill label; `detail` is the row subtitle shown in place of a
 * topic name while the item has not been sorted into one yet.
 */
export const phaseCopy: Record<ItemPhase, { badge: string; detail: string }> = {
  fetching: { badge: "Fetching", detail: "Fetching content" },
  sorting: { badge: "Sorting", detail: "Sorting into a topic" },
  building: { badge: "Building", detail: "Building materials" },
  stalled: { badge: "Paused", detail: "Paused — needs a retry" },
  done: { badge: "Done", detail: "Awaiting topic" },
  failed: { badge: "Needs attention", detail: "Could not be fetched" },
};
