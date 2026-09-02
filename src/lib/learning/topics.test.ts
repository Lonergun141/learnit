import { describe, expect, it } from "vitest";

import { findDuplicateTopic, normalizeTopicName } from "./topics";

const topics = [
  { id: "1", name: "React Native", normalizedName: "react native" },
  { id: "2", name: "Artificial Intelligence", normalizedName: "artificial intelligence" },
];

describe("normalizeTopicName", () => {
  it("normalizes punctuation, whitespace, case, and simple plurals", () => {
    expect(normalizeTopicName("  React-Natives! ")).toBe("react native");
  });

  it("rejects empty and overly long topic names", () => {
    expect(() => normalizeTopicName(" -- ")).toThrow("Topic name is required");
    expect(() => normalizeTopicName("A topic name that is definitely much too long")).toThrow(
      "Topic names must be 30 characters or fewer",
    );
  });
});

describe("findDuplicateTopic", () => {
  it("matches normalized singular and plural variants", () => {
    expect(findDuplicateTopic("React Natives", topics)?.id).toBe("1");
  });

  it("matches an initialism to an existing topic", () => {
    expect(findDuplicateTopic("AI", topics)?.id).toBe("2");
  });
});
