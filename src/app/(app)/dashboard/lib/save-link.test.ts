import { describe, expect, it } from "vitest";

import { prepareLearningItem } from "./save-link";

describe("save link preparation", () => {
  it("canonicalizes a YouTube short link and trims its note", () => {
    expect(
      prepareLearningItem({
        url: "https://youtu.be/dQw4w9WgXcQ?si=tracking",
        note: "  useful explanation  ",
      }),
    ).toEqual({
      url: "https://youtu.be/dQw4w9WgXcQ?si=tracking",
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      contentType: "youtube",
      note: "useful explanation",
    });
  });

  it("rejects unsupported URL protocols", () => {
    expect(() => prepareLearningItem({ url: "file:///private/report.pdf" })).toThrow(
      "Only http and https URLs are supported",
    );
  });

  it("limits notes to a defensible capture size", () => {
    expect(() => prepareLearningItem({ url: "https://example.com", note: "x".repeat(2001) })).toThrow(
      "Note must be 2000 characters or fewer",
    );
  });
});
