import { describe, expect, it } from "vitest";

import { planTelegramNotices, type NoticeItem, type TelegramNoticeContext } from "./notices";

const appBaseUrl = "https://learnit.example/";

function item(overrides: Partial<NoticeItem> = {}): NoticeItem {
  return {
    itemId: "item-1",
    title: "The House of Bread",
    topicId: "topic-1",
    topicName: "Spiritual Sustenance",
    telegramMessageId: 42,
    ...overrides,
  };
}

function context(overrides: Partial<TelegramNoticeContext> = {}): TelegramNoticeContext {
  return { enabled: true, chatId: 123, items: [item()], ...overrides };
}

describe("planning ready-to-study replies", () => {
  it("threads a reply under the message the link arrived in", () => {
    expect(planTelegramNotices(context(), appBaseUrl, "ready")).toEqual([
      {
        chatId: 123,
        replyToMessageId: 42,
        text: "Ready to study: The House of Bread\nSpiritual Sustenance\nhttps://learnit.example/topics/topic-1",
      },
    ]);
  });

  it("sends nothing when the person has turned replies off", () => {
    expect(planTelegramNotices(context({ enabled: false }), appBaseUrl, "ready")).toEqual([]);
  });

  it("sends nothing when no Telegram chat is connected", () => {
    expect(planTelegramNotices(context({ chatId: null }), appBaseUrl, "ready")).toEqual([]);
  });

  /**
   * Web captures and playlist pulls have no originating message, which is what
   * keeps a thirty-video playlist from producing thirty replies.
   */
  it("leaves out items that did not arrive from a Telegram message", () => {
    const notices = planTelegramNotices(
      context({
        items: [item({ telegramMessageId: null }), item({ itemId: "item-2", telegramMessageId: 7 })],
      }),
      appBaseUrl,
      "ready",
    );

    expect(notices.map((notice) => notice.replyToMessageId)).toEqual([7]);
  });

  it("leaves out an item with no topic, having nothing to link to", () => {
    expect(
      planTelegramNotices(
        context({ items: [item({ topicId: null, topicName: null })] }),
        appBaseUrl,
        "ready",
      ),
    ).toEqual([]);
  });

  it("names an untitled source rather than leaving the line bare", () => {
    const [notice] = planTelegramNotices(
      context({ items: [item({ title: "   " })] }),
      appBaseUrl,
      "ready",
    );

    expect(notice.text).toContain("Ready to study: Untitled source");
  });

  it("replies once per item when one build finishes several", () => {
    const notices = planTelegramNotices(
      context({
        items: [item(), item({ itemId: "item-2", telegramMessageId: 43 })],
      }),
      appBaseUrl,
      "ready",
    );

    expect(notices).toHaveLength(2);
    expect(notices.map((notice) => notice.replyToMessageId)).toEqual([42, 43]);
  });
});

describe("planning failure replies", () => {
  it("points at the library entry so the capture can be retried", () => {
    expect(planTelegramNotices(context(), appBaseUrl, "failed")).toEqual([
      {
        chatId: 123,
        replyToMessageId: 42,
        text: "Could not process: The House of Bread\nhttps://learnit.example/library/item-1",
      },
    ]);
  });

  /** A capture can fail before it is ever classified, so a topic is not required. */
  it("still reports an item that never reached a topic", () => {
    const notices = planTelegramNotices(
      context({ items: [item({ topicId: null, topicName: null })] }),
      appBaseUrl,
      "failed",
    );

    expect(notices).toHaveLength(1);
    expect(notices[0].text).toContain("Could not process");
  });

  it("stays silent when replies are turned off", () => {
    expect(planTelegramNotices(context({ enabled: false }), appBaseUrl, "failed")).toEqual([]);
  });
});
