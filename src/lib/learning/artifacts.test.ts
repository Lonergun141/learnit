import { describe, expect, it } from "vitest";

import {
  classifyTopicSchema,
  quizSchema,
  topicMaterialsSchema,
} from "./schemas";
import { determineRetryStage } from "./statuses";

const validQuestions = Array.from({ length: 5 }, (_, index) => ({
  id: `q${index + 1}`,
  question: `Question ${index + 1}?`,
  options: ["One", "Two", "Three", "Four"],
  correctIndex: index % 4,
  explanation: "The selected option is supported by the source material.",
  difficulty: "medium" as const,
}));

describe("Gemini schemas", () => {
  it("validates a concise topic classification", () => {
    expect(
      classifyTopicSchema.parse({
        topic: "React Native",
        reasoning: "Matches the existing mobile framework topic.",
        reuseExisting: true,
      }),
    ).toMatchObject({ topic: "React Native", reuseExisting: true });
  });

  it("rejects a quiz with an invalid answer index", () => {
    const questions = [...validQuestions];
    questions[0] = { ...questions[0], correctIndex: 9 };
    expect(() => quizSchema.parse({ title: "Quiz", questions })).toThrow();
  });

  it("rejects duplicate quiz questions", () => {
    const questions = [...validQuestions, { ...validQuestions[0], id: "q6" }];
    expect(() => quizSchema.parse({ title: "Quiz", questions })).toThrow();
  });

  it("validates all three topic artifacts as one operation", () => {
    const markdown = "# Material\n\nA complete source-grounded explanation.";
    expect(
      topicMaterialsSchema.parse({
        studyGuide: { title: "Guide", markdown },
        briefing: { title: "Briefing", markdown },
        quiz: { title: "Quiz", questions: validQuestions },
      }),
    ).toBeTruthy();
  });
});

describe("determineRetryStage", () => {
  it.each([
    [{ status: "failed", failureStage: "fetch" }, "fetch"],
    [{ status: "fetched", failureStage: "classify" }, "classify"],
    [{ status: "sorted", failureStage: "build_topic" }, "build_topic"],
  ] as const)("routes %o to %s", (state, expected) => {
    expect(determineRetryStage(state)).toBe(expected);
  });

  it("returns null for completed work", () => {
    expect(determineRetryStage({ status: "done", failureStage: null })).toBeNull();
  });
});
