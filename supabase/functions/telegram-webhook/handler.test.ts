import { describe, expect, it, vi } from "vitest";

import {
  handleTelegramWebhook,
  type TelegramWebhookDependencies,
} from "./handler";

function telegramRequest(body: unknown, secret = "webhook-secret") {
  return new Request("http://localhost/functions/v1/telegram-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": secret,
    },
    body: JSON.stringify(body),
  });
}

function dependencies(
  overrides: Partial<TelegramWebhookDependencies> = {},
): TelegramWebhookDependencies {
  return {
    webhookSecret: "webhook-secret",
    botUsername: "learnit_teampura_bot",
    findUserByChatId: vi.fn().mockResolvedValue("user-a"),
    connectWithToken: vi.fn().mockResolvedValue("user-a"),
    createLearningItem: vi.fn().mockResolvedValue({ wasCreated: true }),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("handleTelegramWebhook", () => {
  it("rejects an invalid Telegram secret before doing work", async () => {
    const deps = dependencies();
    const response = await handleTelegramWebhook(
      telegramRequest({ update_id: 1 }, "wrong-secret"),
      deps,
    );

    expect(response.status).toBe(401);
    expect(deps.findUserByChatId).not.toHaveBeenCalled();
    expect(deps.sendMessage).not.toHaveBeenCalled();
  });

  it("connects a chat from a one-time start token", async () => {
    const deps = dependencies();
    const response = await handleTelegramWebhook(
      telegramRequest({
        update_id: 2,
        message: {
          chat: { id: 123 },
          from: { username: "alice", first_name: "Alice" },
          text: "/start one-time-token",
        },
      }),
      deps,
    );

    expect(response.status).toBe(200);
    expect(deps.connectWithToken).toHaveBeenCalledWith({
      token: "one-time-token",
      chatId: 123,
      username: "alice",
      firstName: "Alice",
      lastName: null,
    });
    expect(deps.sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining("connected"),
    );
  });

  it("routes every valid URL to the connected user and continues after one failure", async () => {
    const createLearningItem = vi
      .fn<TelegramWebhookDependencies["createLearningItem"]>()
      .mockResolvedValueOnce({ wasCreated: true })
      .mockResolvedValueOnce({ wasCreated: false })
      .mockRejectedValueOnce(new Error("provider-safe database failure"));
    const deps = dependencies({ createLearningItem });

    const response = await handleTelegramWebhook(
      telegramRequest({
        update_id: 3,
        message: {
          message_id: 5150,
          chat: { id: 123 },
          text: [
            "Save these",
            "https://example.com/new?utm_source=telegram",
            "https://example.com/existing",
            "https://example.com/rejected",
          ].join("\n"),
        },
      }),
      deps,
    );

    expect(response.status).toBe(200);
    expect(createLearningItem).toHaveBeenCalledTimes(3);
    expect(createLearningItem).toHaveBeenNthCalledWith(1, {
      userId: "user-a",
      source: "telegram",
      contentType: "article",
      url: "https://example.com/new?utm_source=telegram",
      canonicalUrl: "https://example.com/new",
      note: "Save these",
      telegramMessageId: 5150,
    });
    expect(deps.sendMessage).toHaveBeenCalledWith(
      123,
      "Added 1 item. 1 duplicate. 1 URL rejected.",
    );
  });

  /**
   * The message id is what a later "ready to study" reply threads under. Telegram
   * always sends one in practice, but a capture must not be lost if it does not.
   */
  it("captures without a message id rather than dropping the link", async () => {
    const createLearningItem = vi
      .fn<TelegramWebhookDependencies["createLearningItem"]>()
      .mockResolvedValue({ wasCreated: true });

    await handleTelegramWebhook(
      telegramRequest({
        update_id: 9,
        message: { chat: { id: 123 }, text: "https://example.com/no-id" },
      }),
      dependencies({ createLearningItem }),
    );

    expect(createLearningItem).toHaveBeenCalledWith(
      expect.objectContaining({ telegramMessageId: null }),
    );
  });

  it("does not create items for an unconnected chat", async () => {
    const deps = dependencies({ findUserByChatId: vi.fn().mockResolvedValue(null) });
    const response = await handleTelegramWebhook(
      telegramRequest({
        update_id: 4,
        message: { chat: { id: 999 }, text: "https://example.com" },
      }),
      deps,
    );

    expect(response.status).toBe(200);
    expect(deps.createLearningItem).not.toHaveBeenCalled();
    expect(deps.sendMessage).toHaveBeenCalledWith(
      999,
      expect.stringMatching(/connect/i),
    );
  });
});
