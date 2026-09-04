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
  /**
   * Called once a job has failed for good, so the person who sent the link is
   * told rather than left waiting. Never called for a retryable failure, which
   * is still on its way to succeeding.
   */
  notifyTerminalFailure?(job: LearningJob): Promise<void>;
}

/**
 * Strips anything that looks like a credential out of a provider message.
 *
 * These strings are stored on the job and shown on the item page, so a provider
 * that echoes the request back must not put a key in the database.
 */
function redactSecrets(text: string): string {
  return text
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[redacted]")
    .replace(/([?&](?:key|api_?key|access_token|token)=)[^&\s]+/gi, "$1[redacted]");
}

/**
 * Collects a message and the messages of everything that caused it.
 *
 * Providers are wrapped in a ProviderError carrying a stable, readable summary,
 * which on its own says only that a request failed — never whether the cause was
 * a quota, a rejected key, or a timeout. Keeping the chain means the reason a
 * job died is recorded with the job rather than left in the runtime logs.
 */
function errorChain(error: unknown, depth = 0): string[] {
  if (depth > 3 || !(error instanceof Error)) return [];
  return [
    error.message.trim(),
    ...errorChain((error as { cause?: unknown }).cause, depth + 1),
  ].filter(Boolean);
}

function safeErrorMessage(error: unknown): string {
  const chain = [...new Set(errorChain(error))];
  if (chain.length === 0) return "Job processing failed";
  return redactSecrets(chain.join(": ")).slice(0, 500);
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
      const reason = safeErrorMessage(error);
      console.error(JSON.stringify({
        event: "learning_job_error",
        jobId: job.id,
        stage: job.stage,
        reason,
      }));
      const payloadPatch: Record<string, JsonValue> = {};
      if (error instanceof PendingProviderJobError) {
        payloadPatch.supadataTranscriptJobId = error.providerJobId;
      }
      try {
        const outcome = await dependencies.failJob({
          jobId: job.id,
          workerId: dependencies.workerId,
          error: reason,
          retryable: error instanceof ProviderError ? error.retryable : true,
          payloadPatch,
        });
        if (outcome !== "queued") await dependencies.notifyTerminalFailure?.(job);
      } catch {
        // A later stale-lock pass can recover a job if failure persistence itself fails.
      }
    }
  }

  return Response.json({ claimed: jobs.length, succeeded, failed });
}
