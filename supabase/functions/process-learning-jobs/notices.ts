export interface NoticeItem {
  itemId: string;
  title: string | null;
  topicId: string | null;
  topicName: string | null;
  telegramMessageId: number | null;
}

export interface TelegramNoticeContext {
  enabled: boolean;
  chatId: number | null;
  items: NoticeItem[];
}

export interface PlannedNotice {
  chatId: number;
  text: string;
  replyToMessageId: number;
}

function itemLabel(item: NoticeItem): string {
  return item.title?.trim() || "Untitled source";
}

/**
 * Decides which replies to send under which messages.
 *
 * Everything that would make a reply meaningless removes it here rather than at
 * the call site: the toggle being off, no connected chat, an item that arrived
 * from the web form or a playlist and so has no message to thread under, and —
 * for a ready notice — a topic that was never assigned and so has nothing to
 * link to. A caller that gets an empty array simply sends nothing.
 */
export function planTelegramNotices(
  context: TelegramNoticeContext,
  appBaseUrl: string,
  kind: "ready" | "failed",
): PlannedNotice[] {
  if (!context.enabled || context.chatId === null) return [];

  const chatId = context.chatId;
  const baseUrl = appBaseUrl.replace(/\/+$/, "");

  return context.items.flatMap((item) => {
    if (item.telegramMessageId === null) return [];

    if (kind === "failed") {
      return [
        {
          chatId,
          replyToMessageId: item.telegramMessageId,
          text: [
            `Could not process: ${itemLabel(item)}`,
            `${baseUrl}/library/${encodeURIComponent(item.itemId)}`,
          ].join("\n"),
        },
      ];
    }

    if (!item.topicId) return [];

    return [
      {
        chatId,
        replyToMessageId: item.telegramMessageId,
        text: [
          `Ready to study: ${itemLabel(item)}`,
          item.topicName ?? "",
          `${baseUrl}/topics/${encodeURIComponent(item.topicId)}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
  });
}
