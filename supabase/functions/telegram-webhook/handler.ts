import {
  parseTelegramMessage,
  secureCompare,
  summarizeCaptureResults,
  type TelegramMessageEntity,
} from "../_shared/telegram.ts";
import { canonicalizeUrl, detectContentType } from "../_shared/urls.ts";

interface TelegramUser {
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramUpdate {
  update_id?: number;
  message?: {
    chat?: { id?: number };
    from?: TelegramUser;
    text?: string;
    entities?: TelegramMessageEntity[];
  };
}

interface ConnectInput {
  token: string;
  chatId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface CreateItemInput {
  userId: string;
  source: "telegram";
  contentType: "youtube" | "article";
  url: string;
  canonicalUrl: string;
  note: string | null;
}

export interface TelegramWebhookDependencies {
  webhookSecret: string;
  botUsername: string;
  findUserByChatId(chatId: number): Promise<string | null>;
  connectWithToken(input: ConnectInput): Promise<string>;
  createLearningItem(input: CreateItemInput): Promise<{ wasCreated: boolean }>;
  sendMessage(chatId: number, text: string): Promise<void>;
}

function jsonResponse(body: object, status = 200): Response {
  return Response.json(body, { status });
}

function startToken(text: string): string | null | undefined {
  const match = text.trim().match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  if (!match) return undefined;
  return match[1]?.trim() || null;
}

function connectGuidance(botUsername: string) {
  return `Connect this chat from LearnIT Settings, then open the link for @${botUsername}.`;
}

export async function handleTelegramWebhook(
  request: Request,
  dependencies: TelegramWebhookDependencies,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!(await secureCompare(dependencies.webhookSecret, suppliedSecret))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text;
  if (typeof chatId !== "number" || !Number.isSafeInteger(chatId) || !text) {
    return jsonResponse({ ok: true });
  }

  const token = startToken(text);
  if (token !== undefined) {
    if (!token) {
      await dependencies.sendMessage(chatId, connectGuidance(dependencies.botUsername));
      return jsonResponse({ ok: true });
    }

    try {
      await dependencies.connectWithToken({
        token,
        chatId,
        username: message.from?.username ?? null,
        firstName: message.from?.first_name ?? null,
        lastName: message.from?.last_name ?? null,
      });
      await dependencies.sendMessage(
        chatId,
        "Your Telegram chat is connected to LearnIT. Send one or more links to save them.",
      );
    } catch {
      await dependencies.sendMessage(
        chatId,
        "That connection link is invalid, expired, or already used. Create a new link in LearnIT Settings.",
      );
    }
    return jsonResponse({ ok: true });
  }

  const userId = await dependencies.findUserByChatId(chatId);
  if (!userId) {
    await dependencies.sendMessage(chatId, connectGuidance(dependencies.botUsername));
    return jsonResponse({ ok: true });
  }

  const parsed = parseTelegramMessage(text, message.entities);
  if (parsed.urls.length === 0) {
    await dependencies.sendMessage(
      chatId,
      "Send one or more http or https links and LearnIT will add them to your library.",
    );
    return jsonResponse({ ok: true });
  }

  let added = 0;
  let duplicates = 0;
  let rejected = 0;
  const canonicalUrls = new Set<string>();

  for (const url of parsed.urls) {
    try {
      const canonicalUrl = canonicalizeUrl(url);
      if (canonicalUrls.has(canonicalUrl)) {
        duplicates += 1;
        continue;
      }
      canonicalUrls.add(canonicalUrl);

      const result = await dependencies.createLearningItem({
        userId,
        source: "telegram",
        contentType: detectContentType(url),
        url,
        canonicalUrl,
        note: parsed.note,
      });
      if (result.wasCreated) added += 1;
      else duplicates += 1;
    } catch {
      rejected += 1;
    }
  }

  await dependencies.sendMessage(
    chatId,
    summarizeCaptureResults({
      added,
      duplicates,
      rejected,
      omitted: parsed.omittedUrlCount,
    }),
  );

  return jsonResponse({ ok: true });
}
