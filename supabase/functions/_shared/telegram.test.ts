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
  // A fresh Response per call: a body can only be read once, so a shared
  // instance breaks the moment a message is split across two sends.
  function okFetcher() {
    return vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(Response.json({ ok: true, result: { message_id: 42 } })),
    );
  }

  function sentBody(fetcher: ReturnType<typeof okFetcher>, call = 0) {
    return JSON.parse(String(fetcher.mock.calls[call][1]?.body));
  }

  it("returns Telegram message IDs for delivered chunks", async () => {
    await expect(
      sendTelegramMessage("bot-token", 123, "Delivered message", okFetcher()),
    ).resolves.toEqual([42]);
  });

  it("announces nothing by default", async () => {
    const fetcher = okFetcher();
    await sendTelegramMessage("bot-token", 123, "Plain message", fetcher);

    expect(sentBody(fetcher)).toEqual({ chat_id: 123, text: "Plain message" });
  });

  it("delivers silently and threads under the requested message", async () => {
    const fetcher = okFetcher();
    await sendTelegramMessage("bot-token", 123, "Ready to study", fetcher, {
      replyToMessageId: 7,
      silent: true,
    });

    expect(sentBody(fetcher)).toEqual({
      chat_id: 123,
      text: "Ready to study",
      disable_notification: true,
      reply_to_message_id: 7,
      allow_sending_without_reply: true,
    });
  });

  /** Telegram quotes the parent on every reply, so repeating it per chunk would
   *  print the whole quoted message again for each part of a split send. */
  it("threads only the first chunk of a split message", async () => {
    const fetcher = okFetcher();
    const longMessage = ["a".repeat(3400), "b".repeat(3400)].join("\n\n");
    await sendTelegramMessage("bot-token", 123, longMessage, fetcher, {
      replyToMessageId: 7,
      silent: true,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sentBody(fetcher, 0).reply_to_message_id).toBe(7);
    expect(sentBody(fetcher, 1).reply_to_message_id).toBeUndefined();
    expect(sentBody(fetcher, 1).disable_notification).toBe(true);
  });

  it("ignores a missing reply target rather than dropping the message", async () => {
    const fetcher = okFetcher();
    await sendTelegramMessage("bot-token", 123, "Orphan", fetcher, {
      replyToMessageId: null,
      silent: true,
    });

    expect(sentBody(fetcher)).toEqual({
      chat_id: 123,
      text: "Orphan",
      disable_notification: true,
    });
  });
});
