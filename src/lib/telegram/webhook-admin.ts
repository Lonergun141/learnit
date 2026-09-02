export interface WebhookStatusSummary {
  url: string | null;
  configured: boolean;
  hasCustomCertificate: boolean;
  pendingUpdateCount: number;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  maxConnections: number | null;
  allowedUpdates: string[];
}

/** Secrets shorter than this are too generic to redact without mangling output. */
const MINIMUM_REDACTABLE_LENGTH = 8;

export function redactSecrets(text: string, secrets: readonly string[]): string {
  return secrets.reduce((redacted, secret) => {
    const pattern = secret.trim();
    if (pattern.length < MINIMUM_REDACTABLE_LENGTH) return redacted;
    return redacted.split(pattern).join("***");
  }, text);
}

export function buildWebhookUrl(supabaseUrl: string): string {
  const base = supabaseUrl.trim();

  if (!base) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  try {
    return new URL("/functions/v1/telegram-webhook", new URL(base)).toString();
  } catch {
    throw new Error("Invalid environment variable: NEXT_PUBLIC_SUPABASE_URL must be an absolute URL");
  }
}

function readRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
}

export function unwrapTelegramResult(payload: unknown, secrets: readonly string[]): unknown {
  const envelope = readRecord(payload);

  if (envelope.ok === true) return envelope.result;

  const description =
    typeof envelope.description === "string" && envelope.description.trim()
      ? envelope.description.trim()
      : "Telegram rejected the request";

  throw new Error(redactSecrets(description, secrets));
}

export function summarizeWebhookInfo(
  payload: unknown,
  secrets: readonly string[],
): WebhookStatusSummary {
  const info = readRecord(payload);
  const url = typeof info.url === "string" && info.url.trim() ? info.url.trim() : null;
  const lastErrorDate = typeof info.last_error_date === "number" ? info.last_error_date : null;
  const lastErrorMessage =
    typeof info.last_error_message === "string" && info.last_error_message.trim()
      ? redactSecrets(info.last_error_message.trim(), secrets)
      : null;

  return {
    url: url === null ? null : redactSecrets(url, secrets),
    configured: url !== null,
    hasCustomCertificate: info.has_custom_certificate === true,
    pendingUpdateCount:
      typeof info.pending_update_count === "number" ? info.pending_update_count : 0,
    lastErrorAt: lastErrorDate === null ? null : new Date(lastErrorDate * 1000).toISOString(),
    lastErrorMessage,
    maxConnections: typeof info.max_connections === "number" ? info.max_connections : null,
    allowedUpdates: Array.isArray(info.allowed_updates)
      ? info.allowed_updates.filter((update): update is string => typeof update === "string")
      : [],
  };
}
