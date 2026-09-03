import { describe, expect, it, vi } from "vitest";

import type { LearningJob } from "./handler";
import {
  processLearningJob,
  type LearningJobDatabase,
  type LearningProviders,
} from "./processor";

function job(stage: LearningJob["stage"]): LearningJob {
  return {
    id: `job-${stage}`,
    userId: "user-a",
    itemId: stage === "fetch" || stage === "classify" ? "item-1" : null,
    topicId: stage === "build_topic" ? "topic-1" : null,
    stage,
    attempts: 1,
    maxAttempts: 3,
    payload: {},
  };
}

function database(overrides: Partial<LearningJobDatabase> = {}): LearningJobDatabase {
  return {
    getItem: vi.fn().mockResolvedValue({
      id: "item-1",
      userId: "user-a",
      contentType: "article",
      url: "https://example.com/article",
      title: null,
      transcript: null,
      status: "new",
    }),
    completeFetch: vi.fn().mockResolvedValue(undefined),
    getTopics: vi.fn().mockResolvedValue([]),
    completeClassify: vi.fn().mockResolvedValue(undefined),
    getTopic: vi.fn().mockResolvedValue({ id: "topic-1", userId: "user-a", name: "Databases" }),
    getTopicSources: vi.fn().mockResolvedValue([]),
    completeTopicBuild: vi.fn().mockResolvedValue(undefined),
    getPlaylistSettings: vi.fn().mockResolvedValue({
      enabled: true,
      playlistId: "PL123456789",
    }),
    createPlaylistItem: vi.fn().mockResolvedValue({ wasCreated: true }),
    completeMaintenanceJob: vi.fn().mockResolvedValue(undefined),
    getDigestContext: vi.fn().mockResolvedValue({
      digestDate: "2026-09-03",
      chatId: 123,
      items: [],
      failedCount: 0,
    }),
    completeDigestJob: vi.fn().mockResolvedValue(undefined),
    getTelegramNoticeContext: vi.fn().mockResolvedValue({
      enabled: true,
      chatId: 123,
      items: [],
    }),
    ...overrides,
  };
}

function providers(overrides: Partial<LearningProviders> = {}): LearningProviders {
  return {
    fetchArticle: vi.fn().mockResolvedValue({
      content: "article ".repeat(80),
      title: "Article",
      author: "Author",
      providerMetadata: { provider: "firecrawl" },
    }),
    fetchYouTube: vi.fn().mockResolvedValue({
      content: "video ".repeat(100),
      title: "Video",
      author: "Channel",
      providerMetadata: { provider: "supadata" },
    }),
    classifyTopic: vi.fn().mockResolvedValue({
      topic: "Databases",
      reasoning: "Database concepts",
      reuseExisting: false,
      existingTopicId: null,
    }),
    generateTopicMaterials: vi.fn(),
    fetchPlaylistVideoIds: vi.fn().mockResolvedValue(["aaaaaaaaaaa", "bbbbbbbbbbb"]),
    sendTelegram: vi.fn().mockResolvedValue([42]),
    ...overrides,
  };
}

describe("processLearningJob", () => {
  it("fetches an article and commits the owned fetch job", async () => {
    const db = database();
    const services = providers();

    await processLearningJob(job("fetch"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(services.fetchArticle).toHaveBeenCalledWith("https://example.com/article");
    expect(db.completeFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-fetch",
        workerId: "worker-1",
        transcript: "article ".repeat(80),
      }),
    );
  });

  it("caps stored provider content before completing fetch", async () => {
    const db = database();
    const services = providers({
      fetchArticle: vi.fn().mockResolvedValue({
        content: "x".repeat(600_000),
        title: "Large article",
        author: null,
        providerMetadata: { provider: "firecrawl" },
      }),
    });

    await processLearningJob(job("fetch"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(vi.mocked(db.completeFetch).mock.calls[0][0].transcript).toHaveLength(500_000);
  });

  it("classifies only a fetched item and commits normalized topic data", async () => {
    const db = database({
      getItem: vi.fn().mockResolvedValue({
        id: "item-1",
        userId: "user-a",
        contentType: "article",
        url: "https://example.com/article",
        title: "Article",
        transcript: "content",
        status: "fetched",
      }),
    });
    const services = providers();

    await processLearningJob(job("classify"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(db.completeClassify).toHaveBeenCalledWith({
      jobId: "job-classify",
      workerId: "worker-1",
      topicName: "Databases",
      normalizedName: "database",
      existingTopicId: null,
    });
  });

  it("builds all topic artifacts from the bounded source selection", async () => {
    const materials = {
      studyGuide: { title: "Guide", markdown: "# Guide\n\nComplete guide content." },
      briefing: { title: "Brief", markdown: "# Brief\n\nComplete brief content." },
      quiz: { title: "Quiz", questions: [] },
    };
    const db = database({
      getTopicSources: vi.fn().mockResolvedValue([
        {
          id: "item-1",
          title: "Source",
          transcript: "source content",
          createdAt: "2026-09-02T10:00:00Z",
        },
      ]),
    });
    const services = providers({ generateTopicMaterials: vi.fn().mockResolvedValue(materials) });

    await processLearningJob(job("build_topic"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(db.completeTopicBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-build_topic",
        workerId: "worker-1",
        sourceItemIds: ["item-1"],
        materials,
      }),
    );
  });

  it("replies silently under the message a built item arrived in", async () => {
    const db = database({
      getTopicSources: vi.fn().mockResolvedValue([
        {
          id: "item-1",
          title: "Source",
          transcript: "source content",
          createdAt: "2026-09-02T10:00:00Z",
        },
      ]),
      getTelegramNoticeContext: vi.fn().mockResolvedValue({
        enabled: true,
        chatId: 123,
        items: [
          {
            itemId: "item-1",
            title: "Source",
            topicId: "topic-1",
            topicName: "Databases",
            telegramMessageId: 77,
          },
        ],
      }),
    });
    const services = providers({
      generateTopicMaterials: vi.fn().mockResolvedValue({
        studyGuide: { title: "Guide", markdown: "Complete guide content for the test." },
        briefing: { title: "Brief", markdown: "Complete brief content for the test." },
        quiz: { title: "Quiz", questions: [] },
      }),
    });

    await processLearningJob(job("build_topic"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(db.getTelegramNoticeContext).toHaveBeenCalledWith("user-a", ["item-1"]);
    expect(services.sendTelegram).toHaveBeenCalledWith(
      123,
      expect.stringContaining("Ready to study: Source"),
      { replyToMessageId: 77, silent: true },
    );
  });

  /**
   * The build is already recorded by the time the reply is attempted, so a
   * Telegram outage must not turn a completed build into a retried one.
   */
  it("keeps a completed build when the reply cannot be delivered", async () => {
    const db = database({
      getTopicSources: vi.fn().mockResolvedValue([
        {
          id: "item-1",
          title: "Source",
          transcript: "source content",
          createdAt: "2026-09-02T10:00:00Z",
        },
      ]),
      getTelegramNoticeContext: vi.fn().mockRejectedValue(new Error("Telegram unreachable")),
    });
    const services = providers({
      generateTopicMaterials: vi.fn().mockResolvedValue({
        studyGuide: { title: "Guide", markdown: "Complete guide content for the test." },
        briefing: { title: "Brief", markdown: "Complete brief content for the test." },
        quiz: { title: "Quiz", questions: [] },
      }),
    });

    await expect(
      processLearningJob(job("build_topic"), "worker-1", {
        database: db,
        providers: services,
        model: "gemini-test",
        appBaseUrl: "https://learnit.example",
      }),
    ).resolves.toBeUndefined();

    expect(db.completeTopicBuild).toHaveBeenCalledTimes(1);
  });

  it("captures playlist videos independently and then completes maintenance", async () => {
    const db = database();
    const services = providers();

    await processLearningJob(job("capture_playlist"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(db.createPlaylistItem).toHaveBeenCalledTimes(2);
    expect(db.createPlaylistItem).toHaveBeenNthCalledWith(1, {
      userId: "user-a",
      url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      canonicalUrl: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
    });
    expect(db.completeMaintenanceJob).toHaveBeenCalledWith({
      jobId: "job-capture_playlist",
      workerId: "worker-1",
      updatePlaylistPollTime: true,
    });
  });

  it("sends a user-specific digest and records the Telegram message", async () => {
    const db = database({
      getDigestContext: vi.fn().mockResolvedValue({
        digestDate: "2026-09-03",
        chatId: 123,
        items: [
          { topicId: "topic-1", topicName: "Databases", title: "Indexes explained" },
        ],
        failedCount: 0,
      }),
    });
    const services = providers();

    await processLearningJob(job("digest"), "worker-1", {
      database: db,
      providers: services,
      model: "gemini-test",
      appBaseUrl: "https://learnit.example",
    });

    expect(services.sendTelegram).toHaveBeenCalledWith(
      123,
      expect.stringContaining("https://learnit.example/topics/topic-1"),
    );
    expect(db.completeDigestJob).toHaveBeenCalledWith({
      jobId: "job-digest",
      workerId: "worker-1",
      digestDate: "2026-09-03",
      status: "sent",
      telegramMessageId: 42,
    });
  });
});
