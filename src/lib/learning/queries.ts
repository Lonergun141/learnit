import "server-only";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type LearningStatus = Database["public"]["Enums"]["learning_status"];
type LearningSource = Database["public"]["Enums"]["learning_source"];

export interface LibraryFilters {
  search?: string;
  status?: LearningStatus;
  source?: LearningSource;
  topicId?: string;
}

function requireCount(count: number | null, error: { message: string } | null): number {
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getDashboardData() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  const [total, processing, completed, failed, topics, recentCompleted, recentAdded] =
    await Promise.all([
      supabase.from("learning_items").select("id", { count: "exact", head: true }),
      supabase
        .from("learning_items")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "fetched", "sorted"]),
      supabase
        .from("learning_items")
        .select("id", { count: "exact", head: true })
        .eq("status", "done"),
      supabase
        .from("learning_items")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase.from("topics").select("id", { count: "exact", head: true }),
      supabase
        .from("learning_items")
        .select("id, title, canonical_url, built_at, status, failure_stage, topics(name)")
        .eq("status", "done")
        .order("built_at", { ascending: false, nullsFirst: false })
        .limit(5),
      supabase
        .from("learning_items")
        .select("id, title, canonical_url, added_at, status, source, failure_stage, topics(name)")
        .order("added_at", { ascending: false })
        .limit(5),
    ]);

  if (recentCompleted.error) throw new Error(recentCompleted.error.message);
  if (recentAdded.error) throw new Error(recentAdded.error.message);

  return {
    user,
    counts: {
      total: requireCount(total.count, total.error),
      processing: requireCount(processing.count, processing.error),
      completed: requireCount(completed.count, completed.error),
      failed: requireCount(failed.count, failed.error),
      topics: requireCount(topics.count, topics.error),
    },
    recentCompleted: recentCompleted.data,
    recentAdded: recentAdded.data,
  };
}

export async function getLibraryData(filters: LibraryFilters) {
  await requireAuthenticatedUser();
  const supabase = await createClient();

  let query = supabase
    .from("learning_items")
    .select(
      "id, title, canonical_url, status, source, content_type, added_at, failure_stage, topics(id, name)",
    )
    .order("added_at", { ascending: false })
    .limit(100);

  if (filters.search) {
    const search = filters.search.trim().replace(/[%_,]/g, "").slice(0, 100);
    if (search) query = query.ilike("title", `%${search}%`);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.topicId) query = query.eq("topic_id", filters.topicId);

  const [items, topics] = await Promise.all([
    query,
    supabase.from("topics").select("id, name").order("name"),
  ]);

  if (items.error) throw new Error(items.error.message);
  if (topics.error) throw new Error(topics.error.message);

  return { items: items.data, topics: topics.data };
}

export async function getLearningItem(itemId: string) {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_items")
    .select(
      "id, url, canonical_url, title, author, status, source, content_type, note, error, failure_stage, added_at, fetched_at, sorted_at, built_at, created_at, topics(id, name)",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getTopicsData() {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const [topics, items, artifacts] = await Promise.all([
    supabase.from("topics").select("id, name, created_at, updated_at").order("name"),
    supabase.from("learning_items").select("topic_id").not("topic_id", "is", null),
    supabase
      .from("topic_artifacts")
      .select("topic_id, kind, created_at")
      .eq("is_current", true),
  ]);

  if (topics.error) throw new Error(topics.error.message);
  if (items.error) throw new Error(items.error.message);
  if (artifacts.error) throw new Error(artifacts.error.message);

  const itemCounts = new Map<string, number>();
  items.data.forEach(({ topic_id: topicId }) => {
    if (topicId) itemCounts.set(topicId, (itemCounts.get(topicId) ?? 0) + 1);
  });

  const artifactsByTopic = new Map<
    string,
    { kinds: Set<Database["public"]["Enums"]["artifact_kind"]>; latest: string | null }
  >();
  artifacts.data.forEach((artifact) => {
    const current = artifactsByTopic.get(artifact.topic_id) ?? {
      kinds: new Set<Database["public"]["Enums"]["artifact_kind"]>(),
      latest: null,
    };
    current.kinds.add(artifact.kind);
    if (!current.latest || artifact.created_at > current.latest) current.latest = artifact.created_at;
    artifactsByTopic.set(artifact.topic_id, current);
  });

  return topics.data.map((topic) => ({
    ...topic,
    itemCount: itemCounts.get(topic.id) ?? 0,
    artifactKinds: [...(artifactsByTopic.get(topic.id)?.kinds ?? [])],
    lastGeneratedAt: artifactsByTopic.get(topic.id)?.latest ?? null,
  }));
}

export async function getTopicData(topicId: string) {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const [topic, sources, artifacts, quizAttempts] = await Promise.all([
    supabase.from("topics").select("id, name, created_at, updated_at").eq("id", topicId).maybeSingle(),
    supabase
      .from("learning_items")
      .select("id, title, canonical_url, status, source, added_at")
      .eq("topic_id", topicId)
      .order("added_at", { ascending: false }),
    supabase
      .from("topic_artifacts")
      .select("id, kind, version, content_markdown, content_json, source_item_ids, model, created_at")
      .eq("topic_id", topicId)
      .eq("is_current", true),
    // Attempts against every quiz version this topic has had. The page keeps the
    // ones matching the quiz on screen, so a rebuild does not mix old scores
    // into a new question set.
    supabase
      .from("quiz_attempts")
      .select("id, artifact_id, score, total_questions, completed_at")
      .eq("topic_id", topicId)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  if (topic.error) throw new Error(topic.error.message);
  if (sources.error) throw new Error(sources.error.message);
  if (artifacts.error) throw new Error(artifacts.error.message);
  if (quizAttempts.error) throw new Error(quizAttempts.error.message);

  return {
    topic: topic.data,
    sources: sources.data,
    artifacts: artifacts.data,
    quizAttempts: quizAttempts.data,
  };
}

export async function getIntegrationSettings() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const [settings, telegramConnection] = await Promise.all([
    supabase
      .from("user_settings")
      .select(
        "digest_enabled, ready_replies_enabled, digest_hour, timezone, youtube_playlist_id, youtube_capture_enabled, youtube_last_polled_at, daily_item_limit",
      )
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("telegram_connections")
      .select(
        "id, telegram_username, telegram_first_name, telegram_last_name, connected_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (settings.error) throw new Error(settings.error.message);
  if (telegramConnection.error) throw new Error(telegramConnection.error.message);

  return { settings: settings.data, telegramConnection: telegramConnection.data };
}
