import { PendingProviderJobError } from "../_shared/providers/supadata.ts";
import { ProviderError, type JsonValue } from "../_shared/providers/types.ts";
import { secureCompare } from "../_shared/telegram.ts";

export type JobStage =
  | "fetch"
  | "classify"
  | "build_topic"
  | "capture_playlist"
  | "digest";

export interface LearningJob {
  id: string;
  userId: string;
  itemId: string | null;
  topicId: string | null;
  stage: JobStage;
  attempts: number;
  maxAttempts: number;
  payload: Record<string, JsonValue>;
}

interface FailJobInput {
  jobId: string;
  workerId: string;
  error: string;
  retryable: boolean;
  payloadPatch: Record<string, JsonValue>;
}

export interface WorkerDependencies {
  internalSecret: string;
  workerId: string;
  requeueStaleJobs(): Promise<void>;
  claimJobs(limit: number, workerId: string): Promise<LearningJob[]>;
  processJob(job: LearningJob, workerId: string): Promise<void>;
  failJob(input: FailJobInput): Promise<"queued" | "failed" | "dead">;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 500);
  }
  return "Job processing failed";
}

async function requestedBatchSize(request: Request): Promise<number> {
  try {
    const body = (await request.json()) as { batchSize?: unknown };
    if (typeof body.batchSize !== "number" || !Number.isFinite(body.batchSize)) return 5;
    return Math.min(Math.max(Math.trunc(body.batchSize), 1), 10);
  } catch {
    return 5;
  }
}

export async function handleWorkerRequest(
  request: Request,
  dependencies: WorkerDependencies,
): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const suppliedSecret = request.headers.get("x-internal-cron-secret") ?? "";
  if (!(await secureCompare(dependencies.internalSecret, suppliedSecret))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchSize = await requestedBatchSize(request);
  await dependencies.requeueStaleJobs();
  const jobs = await dependencies.claimJobs(batchSize, dependencies.workerId);
  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await dependencies.processJob(job, dependencies.workerId);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      const payloadPatch: Record<string, JsonValue> = {};
      if (error instanceof PendingProviderJobError) {
        payloadPatch.supadataTranscriptJobId = error.providerJobId;
      }
      try {
        await dependencies.failJob({
          jobId: job.id,
          workerId: dependencies.workerId,
          error: safeErrorMessage(error),
          retryable: error instanceof ProviderError ? error.retryable : true,
          payloadPatch,
        });
      } catch {
        // A later stale-lock pass can recover a job if failure persistence itself fails.
      }
    }
  }

  return Response.json({ claimed: jobs.length, succeeded, failed });
}
