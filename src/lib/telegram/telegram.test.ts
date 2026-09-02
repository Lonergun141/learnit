import { describe, expect, it } from "vitest";

import { extractTelegramUrls, splitTelegramMessage } from "./messages";

describe("extractTelegramUrls", () => {
  it("extracts and de-duplicates http URLs without trailing punctuation", () => {
    expect(
      extractTelegramUrls(
        "Read https://example.com/a, then https://youtu.be/dQw4w9WgXcQ. Again: https://example.com/a",
      ),
    ).toEqual(["https://example.com/a", "https://youtu.be/dQw4w9WgXcQ"]);
  });

  it("ignores unsupported protocols", () => {
    expect(extractTelegramUrls("ftp://example.com file://local/path")).toEqual([]);
  });
});

describe("splitTelegramMessage", () => {
  it("keeps each title and URL paragraph together when splitting", () => {
    const first = `First item\nhttps://example.com/${"a".repeat(1500)}`;
    const second = `Second item\nhttps://example.com/${"b".repeat(1500)}`;
    const third = `Third item\nhttps://example.com/${"c".repeat(1500)}`;
    const chunks = splitTelegramMessage([first, second, third].join("\n\n"), 3500);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain("First item\nhttps://example.com/");
    expect(chunks[0]).toContain("Second item\nhttps://example.com/");
    expect(chunks[1]).toContain("Third item\nhttps://example.com/");
    expect(chunks.every((chunk) => chunk.length <= 3500)).toBe(true);
  });

  it("never breaks a URL even when it exceeds the nominal limit", () => {
    const message = `Source\nhttps://example.com/${"x".repeat(120)}`;
    expect(splitTelegramMessage(message, 80)).toEqual([message]);
  });
});
