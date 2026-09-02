import { describe, expect, it } from "vitest";

import {
  canonicalizeUrl,
  detectContentType,
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
} from "./urls";

describe("extractYouTubeVideoId", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=tracking",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ])("extracts the video id from %s", (url) => {
    expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("does not classify unrelated hosts containing the word youtube", () => {
    expect(extractYouTubeVideoId("https://example.com/youtube/dQw4w9WgXcQ")).toBeNull();
  });
});

describe("canonicalizeUrl", () => {
  it("normalizes every supported YouTube format to one watch URL", () => {
    expect(canonicalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc#chapter")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("removes tracking, fragments, and a trailing slash while preserving useful params", () => {
    expect(
      canonicalizeUrl(
        "https://Example.com/articles/learn/?utm_source=mail&chapter=2&fbclid=nope#intro",
      ),
    ).toBe("https://example.com/articles/learn?chapter=2");
  });

  it("rejects non-http protocols", () => {
    expect(() => canonicalizeUrl("javascript:alert(1)")).toThrow(
      "Only http and https URLs are supported",
    );
  });
});

describe("detectContentType", () => {
  it("detects YouTube by parsed hostname and path", () => {
    expect(detectContentType("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
    expect(detectContentType("https://example.com/youtube.com/watch")).toBe("article");
  });
});

describe("extractYouTubePlaylistId", () => {
  it("accepts a raw ID or extracts the list parameter from YouTube URLs", () => {
    expect(extractYouTubePlaylistId("PL123456789")).toBe("PL123456789");
    expect(
      extractYouTubePlaylistId(
        "https://www.youtube.com/playlist?list=PL123456789&utm_source=test",
      ),
    ).toBe("PL123456789");
  });

  it("rejects non-YouTube URLs and malformed IDs", () => {
    expect(extractYouTubePlaylistId("https://example.com/?list=PL123456789")).toBeNull();
    expect(extractYouTubePlaylistId("not a playlist")).toBeNull();
  });
});
