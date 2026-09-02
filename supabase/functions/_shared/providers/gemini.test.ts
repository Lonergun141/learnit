import { describe, expect, it, vi } from "vitest";

import {
  classifyTopic,
  generateTopicMaterials,
  type GeminiGateway,
} from "./gemini";

const existingTopics = [
  { id: "topic-1", name: "React Native", normalizedName: "react native" },
  {
    id: "topic-2",
    name: "Artificial Intelligence",
    normalizedName: "artificial intelligence",
  },
];

function gateway(response: unknown): GeminiGateway {
  return {
    generateStructured: vi.fn().mockResolvedValue(JSON.stringify(response)),
  };
}

const questions = Array.from({ length: 5 }, (_, index) => ({
  id: `q${index + 1}`,
  question: `What does concept ${index + 1} mean?`,
  options: ["First", "Second", "Third", "Fourth"],
  correctIndex: index % 4,
  explanation: "The source material supports this answer.",
  difficulty: "medium",
}));

describe("classifyTopic", () => {
  it("reconciles model output to a deterministic existing-topic match", async () => {
    const client = gateway({
      topic: "React Natives",
      reasoning: "The source discusses React Native development.",
      reuseExisting: false,
    });

    await expect(
      classifyTopic({
        client,
        model: "gemini-test",
        title: "Navigation patterns",
        transcript: "lesson ".repeat(2_500),
        existingTopics,
      }),
    ).resolves.toMatchObject({
      topic: "React Native",
      reuseExisting: true,
      existingTopicId: "topic-1",
    });

    const call = vi.mocked(client.generateStructured).mock.calls[0][0];
    expect(call.prompt).toContain("React Native");
    expect(call.prompt.match(/lesson/g)?.length).toBe(2_000);
  });

  it("rejects malformed model output before database use", async () => {
    const client: GeminiGateway = {
      generateStructured: vi.fn().mockResolvedValue("not-json"),
    };

    await expect(
      classifyTopic({
        client,
        model: "gemini-test",
        title: null,
        transcript: "lesson text",
        existingTopics,
      }),
    ).rejects.toMatchObject({
      message: "Gemini returned invalid structured output",
      retryable: true,
    });
  });
});

describe("generateTopicMaterials", () => {
  it("validates all three artifacts from one model operation", async () => {
    const markdown = "# Material\n\nA complete source-grounded explanation.";
    const client = gateway({
      studyGuide: { title: "Guide", markdown },
      briefing: { title: "Briefing", markdown },
      quiz: { title: "Quiz", questions },
    });

    const result = await generateTopicMaterials({
      client,
      model: "gemini-test",
      topicName: "React Native",
      sources: [
        { title: "Navigation", content: "source one" },
        { title: "Performance", content: "source two" },
      ],
    });

    expect(result.quiz.questions).toHaveLength(5);
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });
});
