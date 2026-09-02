import { describe, expect, it } from "vitest";

import { formatDigestMessage } from "./digest";

describe("formatDigestMessage", () => {
  it("groups built items by topic and links to LearnIT", () => {
    expect(
      formatDigestMessage(
        {
          items: [
            { topicId: "topic-1", topicName: "Databases", title: "Indexes explained" },
            { topicId: "topic-1", topicName: "Databases", title: "Query planning" },
          ],
          failedCount: 1,
        },
        "https://learnit.example/",
      ),
    ).toBe(
      [
        "LearnIT Daily Digest",
        "",
        "Databases",
        "• Indexes explained",
        "• Query planning",
        "https://learnit.example/topics/topic-1",
        "",
        "1 item needs attention. Check LearnIT for details.",
      ].join("\n"),
    );
  });

  it("returns null when there is nothing to report", () => {
    expect(formatDigestMessage({ items: [], failedCount: 0 }, "https://learnit.example")).toBeNull();
  });

  it("uses plural grammar for multiple failures", () => {
    expect(
      formatDigestMessage({ items: [], failedCount: 2 }, "https://learnit.example"),
    ).toContain("2 items need attention");
  });
});
