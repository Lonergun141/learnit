import type { SupabaseClient } from "@supabase/supabase-js";

import type { JsonValue } from "../_shared/providers/types.ts";
import type { Database } from "../../../src/types/database.ts";
import type { LearningJob } from "./handler.ts";
import type { LearningJobDatabase } from "./processor.ts";

type SupabaseConnection = SupabaseClient<Database>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordPayload(value: unknown): Record<string, JsonValue> {
  return isRecord(value) ? (value as Record<string, JsonValue>) : {};
}

function parseDigestContext(value: unknown) {
  if (!isRecord(value) || typeof value.digestDate !== "string") {
    throw new Error("Digest context is invalid");
  }
  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems.flatMap((item) =>
    isRecord(item) &&
    typeof item.topicId === "string" &&
    typeof item.topicName === "string"
      ? [{
          topicId: item.topicId,
          topicName: item.topicName,
          title: typeof item.title === "string" ? item.title : null,
        }]
      : [],
  );

  return {
    digestDate: value.digestDate,
    chatId: typeof value.chatId === "number" ? value.chatId : null,
    items,
    failedCount:
      typeof value.failedCount === "number" && value.failedCount >= 0
        ? value.failedCount
        : 0,
  };
}

export function mapClaimedJob(row: Record<string, unknown>): LearningJob {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    itemId: typeof row.item_id === "string" ? row.item_id : null,
    topicId: typeof row.topic_id === "string" ? row.topic_id : null,
    stage: row.stage as LearningJob["stage"],
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    payload: recordPayload(row.payload),
  };
}

export function createLearningJobDatabase(
  supabase: SupabaseConnection,
): LearningJobDatabase {
  return {
    async getItem(userId, itemId) {
      const { data, error } = await supabase
        .from("learning_items")
        .select("id, user_id, content_type, url, title, transcript, status")
        .eq("user_id", userId)
        .eq("id", itemId)
        .maybeSingle();
      if (error) throw new Error("Unable to load learning item");
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        contentType: data.content_type,
        url: data.url,
        title: data.title,
        transcript: data.transcript,
        status: data.status,
      };
    },

    async completeFetch(input) {
      const { error } = await supabase.rpc("complete_fetch_job", {
        p_job_id: input.jobId,
        p_worker_id: input.workerId,
        p_title: input.title,
        p_author: input.author,
        p_transcript: input.transcript,
        p_provider_metadata: input.providerMetadata,
      });
      if (error) throw new Error("Unable to complete fetch job");
    },

    async getTopics(userId) {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name, normalized_name")
        .eq("user_id", userId)
        .order("name");
      if (error) throw new Error("Unable to load topics");
      return (data ?? []).map((topic) => ({
        id: topic.id,
        name: topic.name,
        normalizedName: topic.normalized_name,
      }));
    },

    async completeClassify(input) {
      const { error } = await supabase.rpc("complete_classify_job", {
        p_job_id: input.jobId,
        p_worker_id: input.workerId,
        p_topic_name: input.topicName,
        p_normalized_name: input.normalizedName,
        p_existing_topic_id: input.existingTopicId,
      });
      if (error) throw new Error("Unable to complete classification job");
    },

    async getTopic(userId, topicId) {
      const { data, error } = await supabase
        .from("topics")
        .select("id, user_id, name")
        .eq("user_id", userId)
        .eq("id", topicId)
        .maybeSingle();
      if (error) throw new Error("Unable to load topic");
      return data
        ? { id: data.id, userId: data.user_id, name: data.name }
        : null;
    },

    async getTopicSources(userId, topicId) {
      const { data, error } = await supabase
        .from("learning_items")
        .select("id, title, transcript, created_at")
        .eq("user_id", userId)
        .eq("topic_id", topicId)
        .in("status", ["done", "sorted"])
        .not("transcript", "is", null);
      if (error) throw new Error("Unable to load topic sources");
      return (data ?? []).flatMap((source) =>
        source.transcript
          ? [{
              id: source.id,
              title: source.title,
              transcript: source.transcript,
              createdAt: source.created_at,
            }]
          : [],
      );
    },

    async completeTopicBuild(input) {
      const { error } = await supabase.rpc("complete_topic_build_job", {
        p_job_id: input.jobId,
        p_worker_id: input.workerId,
        p_study_guide: input.materials.studyGuide,
        p_briefing: input.materials.briefing,
        p_quiz: input.materials.quiz,
        p_source_item_ids: input.sourceItemIds,
        p_model: input.model,
      });
      if (error) throw new Error("Unable to complete topic build job");
    },

    async getPlaylistSettings(userId) {
      const { data, error } = await supabase
        .from("user_settings")
        .select("youtube_capture_enabled, youtube_playlist_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error("Unable to load playlist settings");
      return data
        ? { enabled: data.youtube_capture_enabled, playlistId: data.youtube_playlist_id }
        : null;
    },

    async createPlaylistItem(input) {
      const { data, error } = await supabase.rpc("create_learning_item_for_user", {
        p_user_id: input.userId,
        p_source: "youtube_playlist",
        p_content_type: "youtube",
        p_url: input.url,
        p_canonical_url: input.canonicalUrl,
        p_note: null,
        p_provider_metadata: {},
      });
      const result = data?.[0];
      if (error || !result) throw new Error("Unable to create playlist item");
      return { wasCreated: result.was_created };
    },

    async completeMaintenanceJob(input) {
      const { error } = await supabase.rpc("complete_maintenance_job", {
        p_job_id: input.jobId,
        p_worker_id: input.workerId,
        p_update_playlist_poll_time: input.updatePlaylistPollTime,
      });
      if (error) throw new Error("Unable to complete maintenance job");
    },

    async getDigestContext(jobId, workerId) {
      const { data, error } = await supabase.rpc("get_digest_context", {
        p_job_id: jobId,
        p_worker_id: workerId,
      });
      if (error) throw new Error("Unable to load digest context");
      return parseDigestContext(data);
    },

    async completeDigestJob(input) {
      const { error } = await supabase.rpc("complete_digest_job", {
        p_job_id: input.jobId,
        p_worker_id: input.workerId,
        p_digest_date: input.digestDate,
        p_status: input.status,
        p_telegram_message_id: input.telegramMessageId,
      });
      if (error) throw new Error("Unable to complete digest job");
    },
  };
}
