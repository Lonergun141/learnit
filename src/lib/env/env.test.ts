import { describe, expect, it } from "vitest";

import {
  auditEnvironment,
  parsePublicEnv,
  parseTelegramBotUsername,
} from "./contracts";

describe("environment contracts", () => {
  it("accepts a valid Supabase public configuration", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
      }),
    ).toEqual({
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "public-key",
    });
  });

  it("rejects a non-http Supabase URL", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("reads the Telegram bot username from the environment", () => {
    expect(parseTelegramBotUsername({ TELEGRAM_BOT_USERNAME: " @example_bot " })).toBe(
      "example_bot",
    );
  });

  it("rejects a missing Telegram bot username instead of assuming one", () => {
    expect(() => parseTelegramBotUsername({})).toThrow("TELEGRAM_BOT_USERNAME");
  });

  it("reports each deployment surface as satisfied or incomplete by name", () => {
    const report = auditEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
      NEXT_PUBLIC_APP_URL: "https://learnit.example",
      TELEGRAM_BOT_USERNAME: "example_bot",
    });

    expect(report.map((surface) => surface.surface)).toEqual(["web", "edge-functions"]);
    expect(report[0]).toMatchObject({ missing: [], satisfied: true });
    expect(report[1].missing).toContain("INTERNAL_CRON_SECRET");
    expect(report[1].satisfied).toBe(false);
  });

  it("never carries an environment value into its own report", () => {
    const report = auditEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      TELEGRAM_BOT_TOKEN: "12345:SUPER-SECRET-TOKEN",
    });

    expect(JSON.stringify(report)).not.toContain("SUPER-SECRET-TOKEN");
    expect(report[1].present).toContain("TELEGRAM_BOT_TOKEN");
  });
});
