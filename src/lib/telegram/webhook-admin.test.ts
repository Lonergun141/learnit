import { describe, expect, it } from "vitest";

import {
  buildWebhookUrl,
  redactSecrets,
  summarizeWebhookInfo,
  unwrapTelegramResult,
} from "./webhook-admin";

describe("telegram webhook administration", () => {
  it("targets the deployed telegram-webhook Edge Function", () => {
    expect(buildWebhookUrl("https://project.supabase.co")).toBe(
      "https://project.supabase.co/functions/v1/telegram-webhook",
    );
  });

  it("ignores a trailing slash on the Supabase URL", () => {
    expect(buildWebhookUrl(" https://project.supabase.co/ ")).toBe(
      "https://project.supabase.co/functions/v1/telegram-webhook",
    );
  });

  it("rejects a Supabase URL that is missing or unusable", () => {
    expect(() => buildWebhookUrl("")).toThrow("NEXT_PUBLIC_SUPABASE_URL");
    expect(() => buildWebhookUrl("project.supabase.co")).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("redacts every configured secret from reported text", () => {
    expect(
      redactSecrets("failed calling https://api.telegram.org/bot12345:SECRET/x", [
        "12345:SECRET",
      ]),
    ).toBe("failed calling https://api.telegram.org/bot***/x");
  });

  it("never treats blank or trivial secrets as redaction patterns", () => {
    expect(redactSecrets("unchanged text", ["", "  ", "ab"])).toBe("unchanged text");
  });

  it("summarizes only the non-credential fields of a webhook", () => {
    expect(
      summarizeWebhookInfo(
        {
          url: "https://project.supabase.co/functions/v1/telegram-webhook",
          has_custom_certificate: false,
          pending_update_count: 3,
          last_error_date: 1_756_000_000,
          last_error_message: "Wrong response from the webhook: 401 Unauthorized",
          max_connections: 40,
          allowed_updates: ["message"],
          ip_address: "203.0.113.10",
        },
        [],
      ),
    ).toEqual({
      url: "https://project.supabase.co/functions/v1/telegram-webhook",
      configured: true,
      hasCustomCertificate: false,
      pendingUpdateCount: 3,
      lastErrorAt: new Date(1_756_000_000 * 1000).toISOString(),
      lastErrorMessage: "Wrong response from the webhook: 401 Unauthorized",
      maxConnections: 40,
      allowedUpdates: ["message"],
    });
  });

  it("reports an unconfigured webhook without inventing fields", () => {
    expect(summarizeWebhookInfo({ url: "", pending_update_count: 0 }, [])).toEqual({
      url: null,
      configured: false,
      hasCustomCertificate: false,
      pendingUpdateCount: 0,
      lastErrorAt: null,
      lastErrorMessage: null,
      maxConnections: null,
      allowedUpdates: [],
    });
  });

  it("redacts secrets that leak into a reported webhook error", () => {
    expect(
      summarizeWebhookInfo(
        { url: "https://example.test/hook", last_error_message: "token 12345:SECRET rejected" },
        ["12345:SECRET"],
      ).lastErrorMessage,
    ).toBe("token *** rejected");
  });

  it("unwraps a successful Telegram response", () => {
    expect(unwrapTelegramResult({ ok: true, result: { url: "https://example.test" } }, [])).toEqual({
      url: "https://example.test",
    });
  });

  it("raises a redacted description when Telegram rejects the call", () => {
    expect(() =>
      unwrapTelegramResult(
        { ok: false, description: "Unauthorized for bot 12345:SECRET" },
        ["12345:SECRET"],
      ),
    ).toThrow("Unauthorized for bot ***");
  });
});
