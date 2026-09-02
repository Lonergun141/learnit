import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../../src/types/database.ts";
import { requireRuntimeEnvironment } from "../_shared/env.ts";
import {
  classifyTopic,
  createGeminiGateway,
  generateTopicMaterials,
} from "../_shared/providers/gemini.ts";
import { fetchArticleWithFirecrawl } from "../_shared/providers/firecrawl.ts";
import {
  createSupadataGateway,
  fetchPlaylistVideoIds,
  fetchYouTubeWithSupadata,
} from "../_shared/providers/supadata.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";
import { createLearningJobDatabase, mapClaimedJob } from "./database.ts";
import { handleWorkerRequest } from "./handler.ts";
import { processLearningJob } from "./processor.ts";

const REQUIRED_ENVIRONMENT = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "SUPADATA_API_KEY",
  "FIRECRAWL_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "INTERNAL_CRON_SECRET",
  "APP_BASE_URL",
] as const;

const processLearningJobs = {
  async fetch(request: Request): Promise<Response> {
    try {
      const environment = requireRuntimeEnvironment(REQUIRED_ENVIRONMENT);
      const supabase = createClient<Database>(
        environment.SUPABASE_URL,
        environment.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const database = createLearningJobDatabase(supabase);
      const gemini = createGeminiGateway(environment.GEMINI_API_KEY);
      const supadata = createSupadataGateway(environment.SUPADATA_API_KEY);
      const workerId = `edge-${crypto.randomUUID()}`;

      return await handleWorkerRequest(request, {
        internalSecret: environment.INTERNAL_CRON_SECRET,
        workerId,
        async requeueStaleJobs() {
          const { error } = await supabase.rpc("requeue_stale_jobs");
          if (error) throw new Error("Unable to recover stale jobs");
        },
        async claimJobs(limit, id) {
          const { data, error } = await supabase.rpc("claim_learning_jobs", {
            p_limit: limit,
            p_worker_id: id,
          });
          if (error) throw new Error("Unable to claim learning jobs");
          return (data ?? []).map((row) => mapClaimedJob(row));
        },
        async processJob(job, id) {
          const startedAt = performance.now();
          try {
            await processLearningJob(job, id, {
              database,
              model: environment.GEMINI_MODEL,
              appBaseUrl: environment.APP_BASE_URL,
              providers: {
                fetchArticle: (url) =>
                  fetchArticleWithFirecrawl({
                    apiKey: environment.FIRECRAWL_API_KEY,
                    url,
                  }),
                fetchYouTube: (url, pendingJobId) =>
                  fetchYouTubeWithSupadata({ client: supadata, url, pendingJobId }),
                classifyTopic: (input) =>
                  classifyTopic({
                    client: gemini,
                    model: environment.GEMINI_MODEL,
                    ...input,
                  }),
                generateTopicMaterials: (input) =>
                  generateTopicMaterials({
                    client: gemini,
                    model: environment.GEMINI_MODEL,
                    ...input,
                  }),
                fetchPlaylistVideoIds: (playlistId) =>
                  fetchPlaylistVideoIds(supadata, playlistId),
                sendTelegram: (chatId, message) =>
                  sendTelegramMessage(environment.TELEGRAM_BOT_TOKEN, chatId, message),
              },
            });
            console.info(JSON.stringify({
              event: "learning_job_succeeded",
              jobId: job.id,
              stage: job.stage,
              user: job.userId.slice(0, 8),
              durationMs: Math.round(performance.now() - startedAt),
            }));
          } catch (error) {
            console.error(JSON.stringify({
              event: "learning_job_failed",
              jobId: job.id,
              stage: job.stage,
              user: job.userId.slice(0, 8),
              durationMs: Math.round(performance.now() - startedAt),
            }));
            throw error;
          }
        },
        async failJob(input) {
          const { data, error } = await supabase.rpc("fail_learning_job", {
            p_job_id: input.jobId,
            p_worker_id: input.workerId,
            p_error: input.error,
            p_retryable: input.retryable,
            p_payload_patch: input.payloadPatch,
          });
          if (
            error ||
            (data !== "queued" && data !== "failed" && data !== "dead")
          ) {
            throw new Error("Unable to persist job failure");
          }
          return data;
        },
      });
    } catch {
      return Response.json({ error: "Worker unavailable" }, { status: 500 });
    }
  },
};

export default processLearningJobs;
