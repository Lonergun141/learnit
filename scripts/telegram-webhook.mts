/**
 * Inspects or changes the Telegram webhook for this bot.
 *
 *   npm run telegram:status
 *   npm run telegram:set -- --yes
 *   npm run telegram:delete -- --yes
 *
 * `set` and `delete` change live Telegram routing, so they refuse to run
 * without an explicit `--yes`. The bot token is never printed, and any secret
 * that leaks into a Telegram error message is redacted before output.
 */
import {
  buildWebhookUrl,
  redactSecrets,
  summarizeWebhookInfo,
  unwrapTelegramResult,
} from "../src/lib/telegram/webhook-admin.ts";
import { loadLocalEnvFiles } from "./lib/load-env.mts";

type Command = "status" | "set" | "delete";

const MUTATING_COMMANDS: readonly Command[] = ["set", "delete"];

function readCommand(argv: readonly string[]): Command {
  const command = argv[0];

  if (command === "status" || command === "set" || command === "delete") return command;

  throw new Error("Usage: telegram-webhook.ts <status|set|delete> [--yes]");
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function callTelegram(
  botToken: string,
  method: string,
  secrets: readonly string[],
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Telegram returned a non-JSON ${response.status} response`);
  }

  return unwrapTelegramResult(payload, secrets);
}

async function main() {
  const argv = process.argv.slice(2);
  const command = readCommand(argv);
  const confirmed = argv.includes("--yes");

  if (MUTATING_COMMANDS.includes(command) && !confirmed) {
    throw new Error(
      `Refusing to run "${command}" without --yes: it changes the live Telegram webhook.`,
    );
  }

  loadLocalEnvFiles();

  const botToken = requireEnv("TELEGRAM_BOT_TOKEN");
  const webhookSecret = requireEnv("TELEGRAM_WEBHOOK_SECRET");
  const secrets = [botToken, webhookSecret];
  const webhookUrl = buildWebhookUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

  if (command === "set") {
    await callTelegram(botToken, "setWebhook", secrets, {
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message"],
      drop_pending_updates: false,
    });
    console.log(`Webhook set to ${webhookUrl}`);
  }

  if (command === "delete") {
    await callTelegram(botToken, "deleteWebhook", secrets, { drop_pending_updates: false });
    console.log("Webhook deleted. The bot will receive no updates until it is set again.");
  }

  const status = summarizeWebhookInfo(
    await callTelegram(botToken, "getWebhookInfo", secrets),
    secrets,
  );

  console.log(JSON.stringify(status, null, 2));

  if (command === "status" && status.configured && status.url !== webhookUrl) {
    console.warn(`\nWarning: the live webhook does not point at ${webhookUrl}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Telegram webhook command failed";
  console.error(redactSecrets(message, [process.env.TELEGRAM_BOT_TOKEN ?? ""]));
  process.exitCode = 1;
});
