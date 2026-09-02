import { describe, expect, it, vi } from "vitest";

import { fetchArticleWithFirecrawl } from "./firecrawl";

describe("fetchArticleWithFirecrawl", () => {
  it("requests main-content markdown and returns supported metadata", async () => {
    const markdown = `# Useful article\n\n${"evidence ".repeat(70)}`;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        success: true,
        data: {
          markdown,
          metadata: {
            title: "Useful article",
            author: "Ada Author",
            sourceURL: "https://example.com/article",
            statusCode: 200,
            cacheState: "hit",
          },
        },
      }),
    );

    await expect(
      fetchArticleWithFirecrawl({
        apiKey: "fc-test",
        url: "https://example.com/article",
        fetcher,
      }),
    ).resolves.toEqual({
      content: markdown.trim(),
      title: "Useful article",
      author: "Ada Author",
      providerMetadata: {
        provider: "firecrawl",
        sourceUrl: "https://example.com/article",
        statusCode: 200,
        cacheState: "hit",
      },
    });

    const [endpoint, init] = fetcher.mock.calls[0];
    expect(endpoint).toBe("https://api.firecrawl.dev/v2/scrape");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        authorization: "Bearer fc-test",
        "content-type": "application/json",
      },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      url: "https://example.com/article",
      formats: ["markdown"],
      onlyMainContent: true,
    });
  });

  it("rejects short and obvious interstitial content as permanent", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        success: true,
        data: {
          markdown: "Subscribe to continue reading this article.",
          metadata: { title: "Subscribe" },
        },
      }),
    );

    const operation = fetchArticleWithFirecrawl({
      apiKey: "fc-test",
      url: "https://example.com/paywall",
      fetcher,
    });

    await expect(operation).rejects.toMatchObject({
      message: "Article content is unavailable or too short",
      retryable: false,
    });
  });

  it("marks rate limits and server failures as retryable", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("unavailable", { status: 503 }));

    await expect(
      fetchArticleWithFirecrawl({
        apiKey: "fc-test",
        url: "https://example.com/article",
        fetcher,
      }),
    ).rejects.toMatchObject({
      message: "Firecrawl request failed (503)",
      retryable: true,
    });
  });
});
