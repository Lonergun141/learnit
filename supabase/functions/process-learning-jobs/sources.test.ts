import { describe, expect, it } from "vitest";

import { selectTopicSources } from "./sources";

describe("selectTopicSources", () => {
  it("prefers newest sources with deterministic ties", () => {
    const result = selectTopicSources(
      [
        { id: "b", title: "B", transcript: "B".repeat(600), createdAt: "2026-01-02" },
        { id: "c", title: "C", transcript: "C".repeat(600), createdAt: "2026-01-02" },
        { id: "a", title: "A", transcript: "A".repeat(600), createdAt: "2026-01-01" },
      ],
      { maxSources: 2, maxCharacters: 10_000 },
    );

    expect(result.map((source) => source.id)).toEqual(["b", "c"]);
  });

  it("truncates the final included source to the total character budget", () => {
    const result = selectTopicSources(
      [
        { id: "new", title: "New", transcript: "n".repeat(700), createdAt: "2026-01-02" },
        { id: "old", title: "Old", transcript: "o".repeat(700), createdAt: "2026-01-01" },
      ],
      { maxSources: 20, maxCharacters: 1_000 },
    );

    expect(result).toHaveLength(2);
    expect(result[0].content).toHaveLength(700);
    expect(result[1].content).toHaveLength(300);
    expect(result.reduce((sum, source) => sum + source.content.length, 0)).toBe(1_000);
  });
});
