const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[),.!?:;\]}]+$/;
export const MAX_TELEGRAM_URLS = 10;

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

export interface ParsedTelegramMessage {
  note: string | null;
  urls: string[];
  omittedUrlCount: number;
}

function extractVisibleUrls(text: string): string[] {
  return (text.match(URL_PATTERN) ?? []).map((url) =>
    url.replace(TRAILING_PUNCTUATION, ""),
  );
}

export function parseTelegramMessage(
  text: string,
  entities: TelegramMessageEntity[] = [],
  limit = MAX_TELEGRAM_URLS,
): ParsedTelegramMessage {
  const entityUrls = entities.flatMap((entity) => {
    if (entity.type === "text_link" && entity.url) return [entity.url];
    if (entity.type === "url") {
      return [text.slice(entity.offset, entity.offset + entity.length)];
    }
    return [];
  });
  const uniqueUrls = [
    ...new Set([...extractVisibleUrls(text), ...entityUrls].map((url) => url.trim())),
  ];
  const note = text
    .replace(URL_PATTERN, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    note: note || null,
    urls: uniqueUrls.slice(0, Math.max(0, limit)),
    omittedUrlCount: Math.max(0, uniqueUrls.length - limit),
  };
}

export async function secureCompare(expected: string, actual: string): Promise<boolean> {
  if (!expected || !actual) return false;

  const encoder = new TextEncoder();
  const [expectedHash, actualHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(actual)),
  ]);
  const expectedBytes = new Uint8Array(expectedHash);
  const actualBytes = new Uint8Array(actualHash);
  let difference = 0;

  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= expectedBytes[index] ^ actualBytes[index];
  }

  return difference === 0;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function summarizeCaptureResults(result: {
  added: number;
  duplicates: number;
  rejected: number;
  omitted: number;
}): string {
  const parts: string[] = [];
  if (result.added > 0) parts.push(`Added ${pluralize(result.added, "item")}.`);
  if (result.duplicates > 0) parts.push(`${pluralize(result.duplicates, "duplicate")}.`);
  if (result.rejected > 0) {
    parts.push(`${pluralize(result.rejected, "URL")} rejected.`);
  }
  if (result.omitted > 0) {
    parts.push(
      `${pluralize(result.omitted, "URL")} omitted (${MAX_TELEGRAM_URLS} per message maximum).`,
    );
  }
  return parts.join(" ");
}

function splitLongText(text: string, limit: number): string[] {
  if (text.length <= limit || /https?:\/\/\S+/.test(text)) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const candidate = remaining.slice(0, limit + 1);
    const breakAt = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(" "));
    const splitAt = breakAt > 0 ? breakAt : limit;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export function splitTelegramMessage(message: string, limit = 3500): string[] {
  if (!message.trim()) return [];

  const paragraphs = message.trim().split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs.flatMap((part) => splitLongText(part, limit))) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= limit || !current) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) chunks.push(current);
  return chunks;
}

export interface TelegramSendOptions {
  /**
   * Thread the message under one the person sent, so a reply reads as part of
   * their conversation rather than as a broadcast.
   */
  replyToMessageId?: number | null;
  /** Deliver without a push alert: it lands in the chat, the phone stays quiet. */
  silent?: boolean;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  message: string,
  fetcher: typeof fetch = fetch,
  options: TelegramSendOptions = {},
): Promise<number[]> {
  const messageIds: number[] = [];
  for (const [index, text] of splitTelegramMessage(message).entries()) {
    const response = await fetcher(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(options.silent ? { disable_notification: true } : {}),
        // Only the first chunk threads: Telegram shows the quoted parent on each
        // reply, which would repeat the whole quote down a split message.
        ...(index === 0 && typeof options.replyToMessageId === "number"
          ? {
              reply_to_message_id: options.replyToMessageId,
              allow_sending_without_reply: true,
            }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Telegram send failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      ok?: unknown;
      result?: { message_id?: unknown };
    };
    if (payload.ok !== true) {
      throw new Error("Telegram rejected the message");
    }
    if (typeof payload.result?.message_id === "number") {
      messageIds.push(payload.result.message_id);
    }
  }
  return messageIds;
}
