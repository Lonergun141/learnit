import { describe, expect, it, vi } from "vitest";

import {
  fetchPlaylistVideoIds,
  fetchYouTubeWithSupadata,
  type SupadataGateway,
} from "./supadata";

function gateway(overrides: Partial<SupadataGateway> = {}): SupadataGateway {
  return {
    transcript: vi.fn().mockResolvedValue({
      content: [{ text: "useful ".repeat(80), offset: 0, duration: 1, lang: "en" }],
      lang: "en",
      availableLangs: ["en", "es"],
    }),
    transcriptJob: vi.fn(),
    metadata: vi.fn().mockResolvedValue({
      title: "A useful video",
      author: { displayName: "Ada Channel", username: "@ada" },
    }),
    playlistVideos: vi.fn().mockResolvedValue({
      videoIds: ["aaaaaaaaaaa", "bbbbbbbbbbb"],
      shortIds: ["ccccccccccc"],
      liveIds: ["aaaaaaaaaaa"],
    }),
    ...overrides,
  };
}

describe("fetchYouTubeWithSupadata", () => {
  it("joins transcript chunks and uses returned video metadata", async () => {
    const client = gateway();

    await expect(
      fetchYouTubeWithSupadata({
        client,
        url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      }),
    ).resolves.toMatchObject({
      content: "useful ".repeat(80).trim(),
      title: "A useful video",
      author: "Ada Channel",
      providerMetadata: {
        provider: "supadata",
        language: "en",
        availableLanguages: ["en", "es"],
      },
    });
    expect(client.transcript).toHaveBeenCalledWith({
      url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      text: true,
      mode: "auto",
    });
  });

  it("returns a retryable pending-job error without polling in the request", async () => {
    const client = gateway({
      transcript: vi.fn().mockResolvedValue({ jobId: "transcript-job-1" }),
    });

    const operation = fetchYouTubeWithSupadata({
      client,
      url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
    });

    await expect(operation).rejects.toMatchObject({
      message: "YouTube transcript is still processing",
      providerJobId: "transcript-job-1",
      retryable: true,
    });
    expect(client.transcriptJob).not.toHaveBeenCalled();
    expect(client.metadata).not.toHaveBeenCalled();
  });

  it("resumes an existing transcript job instead of starting another", async () => {
    const client = gateway({
      transcriptJob: vi.fn().mockResolvedValue({
        status: "completed",
        result: {
          content: "lesson ".repeat(80),
          lang: "en",
          availableLangs: ["en"],
        },
      }),
    });

    await fetchYouTubeWithSupadata({
      client,
      url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      pendingJobId: "transcript-job-1",
    });

    expect(client.transcript).not.toHaveBeenCalled();
    expect(client.transcriptJob).toHaveBeenCalledWith("transcript-job-1");
  });
});

describe("fetchPlaylistVideoIds", () => {
  it("uses the current playlist videos API, caps the limit, and de-duplicates IDs", async () => {
    const client = gateway();

    await expect(fetchPlaylistVideoIds(client, "PL123", 200)).resolves.toEqual([
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
      "ccccccccccc",
    ]);
    expect(client.playlistVideos).toHaveBeenCalledWith({ id: "PL123", limit: 100 });
  });
});
