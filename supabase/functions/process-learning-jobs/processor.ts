import type {
  ResolvedTopicClassification,
} from "../_shared/providers/gemini.ts";
import { ProviderError, type FetchedContent, type JsonValue } from "../_shared/providers/types.ts";
import type { TopicMaterials } from "../_shared/schemas.ts";
import { normalizeTopicName, type TopicCandidate } from "../_shared/topics.ts";
import { extractYouTubePlaylistId } from "../_shared/urls.ts";
import type { LearningJob } from "./handler.ts";
import { formatDigestMessage, type DigestItem } from "./digest.ts";
import { selectTopicSources } from "./sources.ts";

interface LearningItem {
  id: string;
  userId: string;
  contentType: "youtube" | "article";
  url: string;
  title: string | null;
  transcript: string | null;
  status: "new" | "fetched" | "sorted" | "done" | "failed";
}

interface TopicRow {
  id: string;
  userId: string;
  name: string;
}

interface TopicSourceRow {
  id: string;
  title: string | null;
  transcript: string;
  createdAt: string;
}

export interface LearningJobDatabase {
  getItem(userId: string, itemId: string): Promise<LearningItem | null>;
  completeFetch(input: {
    jobId: string;
    workerId: string;
    title: string | null;
    author: string | null;
    transcript: string;
    providerMetadata: Record<string, JsonValue>;
  }): Promise<void>;
  getTopics(userId: string): Promise<TopicCandidate[]>;
  completeClassify(input: {
    jobId: string;
    workerId: string;
    topicName: string;
    normalizedName: string;
    existingTopicId: string | null;
  }): Promise<void>;
  getTopic(userId: string, topicId: string): Promise<TopicRow | null>;
  getTopicSources(userId: string, topicId: string): Promise<TopicSourceRow[]>;
  completeTopicBuild(input: {
    jobId: string;
    workerId: string;
    sourceItemIds: string[];
    model: string;
    materials: TopicMaterials;
  }): Promise<void>;
  getPlaylistSettings(userId: string): Promise<{
    enabled: boolean;
    playlistId: string | null;
  } | null>;
  createPlaylistItem(input: {
    userId: string;
    url: string;
    canonicalUrl: string;
  }): Promise<{ wasCreated: boolean }>;
  completeMaintenanceJob(input: {
    jobId: string;
    workerId: string;
    updatePlaylistPollTime: boolean;
  }): Promise<void>;
  getDigestContext(jobId: string, workerId: string): Promise<{
    digestDate: string;
    chatId: number | null;
    items: DigestItem[];
    failedCount: number;
  }>;
  completeDigestJob(input: {
    jobId: string;
    workerId: string;
    digestDate: string;
    status: "sent" | "skipped";
    telegramMessageId: number | null;
  }): Promise<void>;
}

export interface LearningProviders {
  fetchArticle(url: string): Promise<FetchedContent>;
  fetchYouTube(url: string, pendingJobId?: string): Promise<FetchedContent>;
  classifyTopic(input: {
    title: string | null;
    transcript: string;
    existingTopics: readonly TopicCandidate[];
  }): Promise<ResolvedTopicClassification>;
  generateTopicMaterials(input: {
    topicName: string;
    sources: readonly { title: string | null; content: string }[];
  }): Promise<TopicMaterials>;
  fetchPlaylistVideoIds(playlistId: string): Promise<string[]>;
  sendTelegram(chatId: number, message: string): Promise<number[]>;
}

interface ProcessorDependencies {
  database: LearningJobDatabase;
  providers: LearningProviders;
  model: string;
  appBaseUrl: string;
}

export const MAX_STORED_CONTENT_CHARACTERS = 500_000;

function requiredTarget(value: string | null, label: string): string {
  if (!value) throw new ProviderError(`${label} job target is missing`, false);
  return value;
}

function stringPayload(job: LearningJob, key: string): string | undefined {
  const value = job.payload[key];
  return typeof value === "string" && value ? value : undefined;
}

async function processFetch(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
) {
  const itemId = requiredTarget(job.itemId, "Fetch");
  const item = await dependencies.database.getItem(job.userId, itemId);
  if (!item || item.userId !== job.userId) {
    throw new ProviderError("Fetch job item was not found", false);
  }

  const fetched =
    item.contentType === "youtube"
      ? await dependencies.providers.fetchYouTube(
          item.url,
          stringPayload(job, "supadataTranscriptJobId"),
        )
      : await dependencies.providers.fetchArticle(item.url);

  await dependencies.database.completeFetch({
    jobId: job.id,
    workerId,
    title: fetched.title,
    author: fetched.author,
    transcript: fetched.content.slice(0, MAX_STORED_CONTENT_CHARACTERS),
    providerMetadata: fetched.providerMetadata,
  });
}

async function processClassify(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
) {
  const itemId = requiredTarget(job.itemId, "Classification");
  const item = await dependencies.database.getItem(job.userId, itemId);
  if (!item || item.userId !== job.userId || item.status !== "fetched" || !item.transcript) {
    throw new ProviderError("Classification item is not ready", false);
  }

  const existingTopics = await dependencies.database.getTopics(job.userId);
  const classification = await dependencies.providers.classifyTopic({
    title: item.title,
    transcript: item.transcript,
    existingTopics,
  });

  await dependencies.database.completeClassify({
    jobId: job.id,
    workerId,
    topicName: classification.topic,
    normalizedName: normalizeTopicName(classification.topic),
    existingTopicId: classification.existingTopicId,
  });
}

async function processTopicBuild(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
) {
  const topicId = requiredTarget(job.topicId, "Topic build");
  const topic = await dependencies.database.getTopic(job.userId, topicId);
  if (!topic || topic.userId !== job.userId) {
    throw new ProviderError("Topic build target was not found", false);
  }

  const rows = await dependencies.database.getTopicSources(job.userId, topicId);
  const sources = selectTopicSources(rows);
  if (sources.length === 0) {
    throw new ProviderError("Topic has no usable source content", false);
  }

  const materials = await dependencies.providers.generateTopicMaterials({
    topicName: topic.name,
    sources,
  });
  await dependencies.database.completeTopicBuild({
    jobId: job.id,
    workerId,
    sourceItemIds: sources.map((source) => source.id),
    model: dependencies.model,
    materials,
  });
}

async function processPlaylistCapture(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
) {
  const settings = await dependencies.database.getPlaylistSettings(job.userId);
  if (!settings?.enabled || !settings.playlistId) {
    await dependencies.database.completeMaintenanceJob({
      jobId: job.id,
      workerId,
      updatePlaylistPollTime: false,
    });
    return;
  }

  const playlistId = extractYouTubePlaylistId(settings.playlistId);
  if (!playlistId) throw new ProviderError("YouTube playlist ID is invalid", false);

  const videoIds = await dependencies.providers.fetchPlaylistVideoIds(playlistId);
  for (const videoId of videoIds) {
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    await dependencies.database.createPlaylistItem({
      userId: job.userId,
      url: canonicalUrl,
      canonicalUrl,
    });
  }

  await dependencies.database.completeMaintenanceJob({
    jobId: job.id,
    workerId,
    updatePlaylistPollTime: true,
  });
}

async function processDigest(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
) {
  const context = await dependencies.database.getDigestContext(job.id, workerId);
  const message = formatDigestMessage(context, dependencies.appBaseUrl);
  if (!message || context.chatId === null) {
    await dependencies.database.completeDigestJob({
      jobId: job.id,
      workerId,
      digestDate: context.digestDate,
      status: "skipped",
      telegramMessageId: null,
    });
    return;
  }

  const messageIds = await dependencies.providers.sendTelegram(context.chatId, message);
  await dependencies.database.completeDigestJob({
    jobId: job.id,
    workerId,
    digestDate: context.digestDate,
    status: "sent",
    telegramMessageId: messageIds.at(-1) ?? null,
  });
}

export async function processLearningJob(
  job: LearningJob,
  workerId: string,
  dependencies: ProcessorDependencies,
): Promise<void> {
  switch (job.stage) {
    case "fetch":
      return processFetch(job, workerId, dependencies);
    case "classify":
      return processClassify(job, workerId, dependencies);
    case "build_topic":
      return processTopicBuild(job, workerId, dependencies);
    case "capture_playlist":
      return processPlaylistCapture(job, workerId, dependencies);
    case "digest":
      return processDigest(job, workerId, dependencies);
  }
}
