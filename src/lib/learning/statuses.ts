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
