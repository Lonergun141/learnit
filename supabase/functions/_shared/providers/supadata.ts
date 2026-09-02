import { Supadata } from "@supadata/js";

import { ProviderError, type FetchedContent } from "./types.ts";

const MINIMUM_TRANSCRIPT_LENGTH = 500;
export const DEFAULT_PLAYLIST_SYNC_LIMIT = 100;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface SupadataGateway {
  transcript(input: { url: string; text: true; mode: "auto" }): Promise<unknown>;
  transcriptJob(jobId: string): Promise<unknown>;
  metadata(input: { url: string }): Promise<unknown>;
  playlistVideos(input: { id: string; limit: number }): Promise<unknown>;
}

export class PendingProviderJobError extends ProviderError {
  readonly providerJobId: string;

  constructor(providerJobId: string) {
    super("YouTube transcript is still processing", true);
    this.name = "PendingProviderJobError";
    this.providerJobId = providerJobId;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && !!entry)
    : [];
}

function providerError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;
  const code = isRecord(error) ? optionalString(error.error) : null;
  const retryable =
    code === "internal-error" || code === "limit-exceeded" || code === null;
  return new ProviderError("Supadata request could not be completed", retryable, {
    cause: error,
  });
}

function transcriptText(transcript: Record<string, unknown>): string | null {
  if (typeof transcript.content === "string") return optionalString(transcript.content);
  if (!Array.isArray(transcript.content)) return null;

  const chunks = transcript.content
    .map((chunk) => (isRecord(chunk) ? optionalString(chunk.text) : null))
    .filter((chunk): chunk is string => chunk !== null);
  return chunks.length > 0 ? chunks.join("\n") : null;
}

function completedTranscript(payload: unknown, pendingJobId?: string): Record<string, unknown> {
  if (!isRecord(payload)) {
    throw new ProviderError("Supadata returned an invalid transcript", true);
  }

  if (pendingJobId) {
    const status = optionalString(payload.status);
    if (status === "queued" || status === "active") {
      throw new PendingProviderJobError(pendingJobId);
    }
    if (status === "failed") throw providerError(payload.error);
    if (status !== "completed" || !isRecord(payload.result)) {
      throw new ProviderError("Supadata returned an invalid transcript job", true);
    }
    return payload.result;
  }

  const jobId = optionalString(payload.jobId);
  if (jobId) throw new PendingProviderJobError(jobId);
  return payload;
}

export function createSupadataGateway(apiKey: string): SupadataGateway {
  const client = new Supadata({ apiKey });
  return {
    transcript: (input) => client.transcript(input),
    transcriptJob: (jobId) => client.transcript.getJobStatus(jobId),
    metadata: (input) => client.metadata(input),
    playlistVideos: (input) => client.youtube.playlist.videos(input),
  };
}

export async function fetchYouTubeWithSupadata(input: {
  client: SupadataGateway;
  url: string;
  pendingJobId?: string;
}): Promise<FetchedContent> {
  let rawTranscript: unknown;
  try {
    rawTranscript = input.pendingJobId
      ? await input.client.transcriptJob(input.pendingJobId)
      : await input.client.transcript({ url: input.url, text: true, mode: "auto" });
  } catch (error) {
    throw providerError(error);
  }

  const transcript = completedTranscript(rawTranscript, input.pendingJobId);
  const content = transcriptText(transcript);
  if (!content || content.length < MINIMUM_TRANSCRIPT_LENGTH) {
    throw new ProviderError("YouTube transcript is unavailable or too short", false);
  }

  let metadata: Record<string, unknown> | null = null;
  try {
    const rawMetadata = await input.client.metadata({ url: input.url });
    if (isRecord(rawMetadata)) metadata = rawMetadata;
  } catch {
    // Metadata enriches a usable transcript but is not required to process it.
  }

  const author = metadata && isRecord(metadata.author) ? metadata.author : null;
  const language = optionalString(transcript.lang);
  const availableLanguages = stringArray(transcript.availableLangs);

  return {
    content,
    title: metadata ? optionalString(metadata.title) : null,
    author: author
      ? optionalString(author.displayName) ?? optionalString(author.username)
      : null,
    providerMetadata: {
      provider: "supadata",
      language,
      availableLanguages,
    },
  };
}

export async function fetchPlaylistVideoIds(
  client: SupadataGateway,
  playlistId: string,
  requestedLimit = DEFAULT_PLAYLIST_SYNC_LIMIT,
): Promise<string[]> {
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), DEFAULT_PLAYLIST_SYNC_LIMIT);
  let payload: unknown;
  try {
    payload = await client.playlistVideos({ id: playlistId, limit });
  } catch (error) {
    throw providerError(error);
  }

  if (!isRecord(payload)) {
    throw new ProviderError("Supadata returned an invalid playlist response", true);
  }

  return [
    ...new Set([
      ...stringArray(payload.videoIds),
      ...stringArray(payload.shortIds),
      ...stringArray(payload.liveIds),
    ]),
  ]
    .filter((videoId) => VIDEO_ID_PATTERN.test(videoId))
    .slice(0, limit);
}
