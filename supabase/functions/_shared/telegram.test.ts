import { describe, expect, it, vi } from "vitest";

import {
  parseTelegramMessage,
  secureCompare,
  sendTelegramMessage,
  summarizeCaptureResults,
} from "./telegram";

describe("secureCompare", () => {
  it("accepts identical secrets and rejects different values", async () => {
    await expect(secureCompare("correct-secret", "correct-secret")).resolves.toBe(true);
    await expect(secureCompare("correct-secret", "wrong-secret")).resolves.toBe(false);
    await expect(secureCompare("correct-secret", "")).resolves.toBe(false);
  });
});

describe("parseTelegramMessage", () => {
  it("extracts visible and text-link URLs while preserving the note", () => {
    const text = "Useful references:\nhttps://example.com/guide";

    expect(
      parseTelegramMessage(text, [
        { type: "url", offset: 19, length: 25 },
        { type: "text_link", offset: 0, length: 6, url: "https://example.com/hidden" },
      ]),
    ).toEqual({
      note: "Useful references:",
      urls: ["https://example.com/guide", "https://example.com/hidden"],
      omittedUrlCount: 0,
    });
  });

  it("de-duplicates URLs and caps one message at ten", () => {
    const urls = Array.from(
      { length: 12 },
      (_, index) => `https://example.com/${index}`,
    );
    const text = `${urls.join(" ")} ${urls[0]}`;

    expect(parseTelegramMessage(text)).toMatchObject({
      urls: urls.slice(0, 10),
      omittedUrlCount: 2,
    });
  });
});

describe("summarizeCaptureResults", () => {
  it("uses correct singular grammar and reports omitted URLs", () => {
    expect(
      summarizeCaptureResults({ added: 1, duplicates: 2, rejected: 1, omitted: 3 }),
    ).toBe("Added 1 item. 2 duplicates. 1 URL rejected. 3 URLs omitted (10 per message maximum).");
  });
});

describe("sendTelegramMessage", () => {
  it("returns Telegram message IDs for delivered chunks", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ ok: true, result: { message_id: 42 } }),
    );

    await expect(
      sendTelegramMessage("bot-token", 123, "Delivered message", fetcher),
    ).resolves.toEqual([42]);
  });
});
