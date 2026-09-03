import { describe, expect, it } from "vitest";

import { preferencesSchema } from "./settings-schema";

describe("integration preferences", () => {
  it("normalizes valid form values", () => {
    expect(
      preferencesSchema.parse({
        digestEnabled: "on",
        readyRepliesEnabled: "on",
        digestHour: "7",
        timezone: "Asia/Shanghai",
        youtubeCaptureEnabled: "on",
        youtubePlaylistId: "  PL123456789  ",
        dailyItemLimit: "25",
      }),
    ).toEqual({
      digestEnabled: true,
      readyRepliesEnabled: true,
      digestHour: 7,
      timezone: "Asia/Shanghai",
      youtubeCaptureEnabled: true,
      youtubePlaylistId: "PL123456789",
      dailyItemLimit: 25,
    });
  });

  /**
   * A browser omits an unchecked box entirely, so the two toggles have to read
   * as false when absent rather than carrying their previous value forward.
   */
  it("reads an omitted toggle as switched off", () => {
    expect(
      preferencesSchema.parse({
        digestHour: "6",
        timezone: "UTC",
        dailyItemLimit: "20",
      }),
    ).toMatchObject({ digestEnabled: false, readyRepliesEnabled: false });
  });

  it("keeps the two delivery toggles independent", () => {
    expect(
      preferencesSchema.parse({
        readyRepliesEnabled: "on",
        digestHour: "6",
        timezone: "UTC",
        dailyItemLimit: "20",
      }),
    ).toMatchObject({ digestEnabled: false, readyRepliesEnabled: true });
  });

  it("rejects invalid IANA timezones", () => {
    expect(
      preferencesSchema.safeParse({
        digestHour: "6",
        timezone: "Somewhere/Neverland",
        dailyItemLimit: "20",
      }).success,
    ).toBe(false);
  });

  it("requires a playlist when capture is enabled", () => {
    expect(
      preferencesSchema.safeParse({
        digestHour: "6",
        timezone: "UTC",
        youtubeCaptureEnabled: "on",
        youtubePlaylistId: "",
        dailyItemLimit: "20",
      }).success,
    ).toBe(false);
  });

  it("stores the canonical ID from a YouTube playlist URL", () => {
    const result = preferencesSchema.parse({
      digestHour: "6",
      timezone: "UTC",
      youtubeCaptureEnabled: "on",
      youtubePlaylistId: "https://youtube.com/playlist?list=PL123456789",
      dailyItemLimit: "20",
    });

    expect(result.youtubePlaylistId).toBe("PL123456789");
  });

  it("rejects malformed playlist values", () => {
    expect(
      preferencesSchema.safeParse({
        digestHour: "6",
        timezone: "UTC",
        youtubePlaylistId: "not-a-playlist",
        dailyItemLimit: "20",
      }).success,
    ).toBe(false);
  });
});
