import { createClient } from "@supabase/supabase-js";

import { requireRuntimeEnvironment } from "../_shared/env.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";
import { handleTelegramWebhook } from "./handler.ts";

const REQUIRED_ENVIRONMENT = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_WEBHOOK_SECRET",
] as const;

const telegramWebhook = {
  async fetch(request: Request): Promise<Response> {
    try {
      const environment = requireRuntimeEnvironment(REQUIRED_ENVIRONMENT);
      const supabase = createClient(
        environment.SUPABASE_URL,
        environment.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );

      return await handleTelegramWebhook(request, {
        webhookSecret: environment.TELEGRAM_WEBHOOK_SECRET,
        botUsername: environment.TELEGRAM_BOT_USERNAME,
        async findUserByChatId(chatId) {
          const { data, error } = await supabase
            .from("telegram_connections")
            .select("user_id")
            .eq("chat_id", chatId)
            .maybeSingle();
          if (error) throw new Error("Unable to resolve Telegram connection");
          return data?.user_id ?? null;
        },
        async connectWithToken(input) {
          const { data, error } = await supabase.rpc("connect_telegram_with_token", {
            p_token: input.token,
            p_chat_id: input.chatId,
            p_telegram_username: input.username,
            p_telegram_first_name: input.firstName,
            p_telegram_last_name: input.lastName,
          });
          if (error || !data) throw new Error("Unable to connect Telegram chat");
          return data;
        },
        async createLearningItem(input) {
          const { data, error } = await supabase.rpc("create_learning_item_for_user", {
            p_user_id: input.userId,
            p_source: input.source,
            p_content_type: input.contentType,
            p_url: input.url,
            p_canonical_url: input.canonicalUrl,
            p_note: input.note,
            p_provider_metadata:
              input.telegramMessageId === null
                ? {}
                : { telegram_message_id: input.telegramMessageId },
          });
          const result = data?.[0];
          if (error || !result) throw new Error("Unable to create learning item");
          return { wasCreated: result.was_created };
        },
        async sendMessage(chatId, text) {
          await sendTelegramMessage(environment.TELEGRAM_BOT_TOKEN, chatId, text);
        },
      });
    } catch {
      return Response.json({ error: "Webhook unavailable" }, { status: 500 });
    }
  },
};

export default telegramWebhook;
