import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  classifyTopicSchema,
  topicMaterialsSchema,
  type TopicMaterials,
} from "../schemas.ts";
import {
  findDuplicateTopic,
  type TopicCandidate,
} from "../topics.ts";
import { ProviderError } from "./types.ts";

export interface GeminiGateway {
  generateStructured(input: {
    model: string;
    prompt: string;
    jsonSchema: unknown;
  }): Promise<string>;
}

export interface ResolvedTopicClassification {
  topic: string;
  reasoning: string;
  reuseExisting: boolean;
  existingTopicId: string | null;
}

function parseStructured<T>(text: string, schema: z.ZodType<T>): T {
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    throw new ProviderError("Gemini returned invalid structured output", true, {
      cause: error,
    });
  }
}

export function createGeminiGateway(apiKey: string): GeminiGateway {
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 45_000 },
  });

  return {
    async generateStructured(input) {
      try {
        const response = await client.models.generateContent({
          model: input.model,
          contents: input.prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: input.jsonSchema,
            temperature: 0.2,
          },
        });
        if (!response.text) {
          throw new Error("Gemini response contained no text");
        }
        return response.text;
      } catch (error) {
        throw new ProviderError("Gemini request could not be completed", true, {
          cause: error,
        });
      }
    },
  };
}

export async function classifyTopic(input: {
  client: GeminiGateway;
  model: string;
  title: string | null;
  transcript: string;
  existingTopics: readonly TopicCandidate[];
}): Promise<ResolvedTopicClassification> {
  const excerpt = input.transcript.trim().split(/\s+/).slice(0, 2_000).join(" ");
  const topicList = input.existingTopics.length
    ? input.existingTopics.map((topic) => `- ${topic.name}`).join("\n")
    : "- No existing topics";
  const prompt = [
    "Classify this learning source into a reusable topic.",
    "Prefer an existing topic whenever reasonably appropriate.",
    "Avoid case, plural, abbreviation, and near-duplicate topics.",
    "Use one or two words where practical, at most 30 characters, and never copy the source title.",
    "Existing topics:",
    topicList,
    `Source title: ${input.title ?? "Untitled source"}`,
    "Source transcript excerpt:",
    excerpt,
  ].join("\n\n");
  const response = await input.client.generateStructured({
    model: input.model,
    prompt,
    jsonSchema: z.toJSONSchema(classifyTopicSchema),
  });
  const classification = parseStructured(response, classifyTopicSchema);
  const duplicate = findDuplicateTopic(classification.topic, input.existingTopics);

  return {
    ...classification,
    topic: duplicate?.name ?? classification.topic,
    reuseExisting: duplicate ? true : classification.reuseExisting,
    existingTopicId: duplicate?.id ?? null,
  };
}

export async function generateTopicMaterials(input: {
  client: GeminiGateway;
  model: string;
  topicName: string;
  sources: readonly { title: string | null; content: string }[];
}): Promise<TopicMaterials> {
  const sourceText = input.sources
    .map(
      (source, index) =>
        `SOURCE ${index + 1}: ${source.title ?? "Untitled source"}\n${source.content}`,
    )
    .join("\n\n---\n\n");
  const prompt = [
    `Create a complete learning package for the topic “${input.topicName}” using only the supplied sources.`,
    "Return one study guide, one briefing document, and one comprehension quiz in the required JSON structure.",
    "The study guide must include an overview, objectives, key concepts, detailed sections, terminology, supported examples, takeaways, and review questions.",
    "The briefing must include an executive summary, key points, details, implications or uses, actionable takeaways, and appropriate open questions.",
    "Create 5–10 unique quiz questions with 4–6 options, valid answer indexes, explanations, and difficulty labels.",
    "Do not invent facts unsupported by the sources.",
    sourceText,
  ].join("\n\n");
  const response = await input.client.generateStructured({
    model: input.model,
    prompt,
    jsonSchema: z.toJSONSchema(topicMaterialsSchema),
  });
  return parseStructured(response, topicMaterialsSchema);
}
