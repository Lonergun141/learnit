import { describe, expect, it, vi } from "vitest";

import { PendingProviderJobError } from "../_shared/providers/supadata";
import { ProviderError } from "../_shared/providers/types";
import {
  handleWorkerRequest,
  type LearningJob,
  type WorkerDependencies,
} from "./handler";

const jobs: LearningJob[] = [
  {
    id: "job-1",
    userId: "user-a",
    itemId: "item-1",
    topicId: null,
    stage: "fetch",
    attempts: 1,
    maxAttempts: 3,
    payload: {},
  },
  {
    id: "job-2",
    userId: "user-b",
    itemId: "item-2",
    topicId: null,
    stage: "fetch",
    attempts: 1,
    maxAttempts: 3,
    payload: {},
  },
  {
    id: "job-3",
    userId: "user-c",
    itemId: "item-3",
    topicId: null,
    stage: "fetch",
    attempts: 1,
    maxAttempts: 3,
    payload: {},
  },
];

function request(secret = "cron-secret", body: unknown = {}) {
  return new Request("http://localhost/functions/v1/process-learning-jobs", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-cron-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

function dependencies(overrides: Partial<WorkerDependencies> = {}): WorkerDependencies {
  return {
    internalSecret: "cron-secret",
    workerId: "worker-1",
    requeueStaleJobs: vi.fn().mockResolvedValue(undefined),
    claimJobs: vi.fn().mockResolvedValue(jobs),
    processJob: vi.fn().mockResolvedValue(undefined),
    failJob: vi.fn().mockResolvedValue("queued"),
    ...overrides,
  };
}

describe("handleWorkerRequest", () => {
  it("rejects an invalid internal secret before claiming jobs", async () => {
    const deps = dependencies();
    const response = await handleWorkerRequest(request("wrong-secret"), deps);

    expect(response.status).toBe(401);
    expect(deps.claimJobs).not.toHaveBeenCalled();
  });

  it("uses a conservative default batch and processes jobs independently", async () => {
    const processJob = vi
      .fn<WorkerDependencies["processJob"]>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ProviderError("permanent failure", false))
      .mockRejectedValueOnce(new Error("temporary failure"));
    const deps = dependencies({ processJob });

    const response = await handleWorkerRequest(request(), deps);

    expect(response.status).toBe(200);
    expect(deps.claimJobs).toHaveBeenCalledWith(5, "worker-1");
    expect(processJob).toHaveBeenCalledTimes(3);
    expect(deps.failJob).toHaveBeenNthCalledWith(1, {
      jobId: "job-2",
      workerId: "worker-1",
      error: "permanent failure",
      retryable: false,
      payloadPatch: {},
    });
    expect(deps.failJob).toHaveBeenNthCalledWith(2, {
      jobId: "job-3",
      workerId: "worker-1",
      error: "temporary failure",
      retryable: true,
      payloadPatch: {},
    });
    await expect(response.json()).resolves.toMatchObject({
      claimed: 3,
      succeeded: 1,
      failed: 2,
    });
  });

  it("preserves a pending provider job ID for the retry", async () => {
    const deps = dependencies({
      claimJobs: vi.fn().mockResolvedValue([jobs[0]]),
      processJob: vi.fn().mockRejectedValue(new PendingProviderJobError("provider-123")),
    });

    await handleWorkerRequest(request(), deps);

    expect(deps.failJob).toHaveBeenCalledWith(
      expect.objectContaining({
        retryable: true,
        payloadPatch: { supadataTranscriptJobId: "provider-123" },
      }),
    );
  });

  it("caps a requested batch size at ten", async () => {
    const deps = dependencies({ claimJobs: vi.fn().mockResolvedValue([]) });

    await handleWorkerRequest(request("cron-secret", { batchSize: 50 }), deps);

    expect(deps.claimJobs).toHaveBeenCalledWith(10, "worker-1");
  });
});

describe("recording why a job failed", () => {
  function failingDependencies(error: unknown) {
    const failJob = vi
      .fn<WorkerDependencies["failJob"]>()
      .mockResolvedValue("failed");
    return {
      failJob,
      deps: dependencies({
        claimJobs: vi.fn().mockResolvedValue([jobs[0]]),
        processJob: vi.fn().mockRejectedValue(error),
        failJob,
      }),
    };
  }

  it("keeps the provider cause alongside the wrapper message", async () => {
    const { failJob, deps } = failingDependencies(
      new ProviderError("Gemini request could not be completed", true, {
        cause: new Error("429 RESOURCE_EXHAUSTED: quota exceeded"),
      }),
    );

    await handleWorkerRequest(request(), deps);

    expect(failJob).toHaveBeenCalledWith(
      expect.objectContaining({
        error:
          "Gemini request could not be completed: 429 RESOURCE_EXHAUSTED: quota exceeded",
      }),
    );
  });

  it("never writes a provider key into the job record", async () => {
    const { failJob, deps } = failingDependencies(
      new ProviderError("Gemini request could not be completed", true, {
        cause: new Error("403 on https://api.test/v1?key=AIzaSyDUMMYKEYVALUE1234567"),
      }),
    );

    await handleWorkerRequest(request(), deps);

    const recorded = failJob.mock.calls[0][0].error;
    expect(recorded).not.toContain("AIzaSyDUMMYKEYVALUE1234567");
    expect(recorded).toContain("[redacted]");
  });

  it("falls back to a generic reason when nothing useful was thrown", async () => {
    const { failJob, deps } = failingDependencies("not an error object");

    await handleWorkerRequest(request(), deps);

    expect(failJob).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Job processing failed" }),
    );
  });
});
