import { z } from "zod";

export const classifyTopicSchema = z.object({
  topic: z.string().trim().min(1).max(30),
  reasoning: z.string().trim().min(1).max(1000),
  reuseExisting: z.boolean(),
});

export const quizQuestionSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(4).max(6),
    correctIndex: z.number().int().nonnegative(),
    explanation: z.string().trim().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })
  .superRefine((question, context) => {
    if (question.correctIndex >= question.options.length) {
      context.addIssue({
        code: "custom",
        path: ["correctIndex"],
        message: "Correct answer index must reference an available option",
      });
    }
  });

export const quizSchema = z
  .object({
    title: z.string().trim().min(1),
    questions: z.array(quizQuestionSchema).min(5).max(10),
  })
  .superRefine((quiz, context) => {
    const seen = new Set<string>();
    quiz.questions.forEach((question, index) => {
      const key = question.question.toLowerCase().replace(/\W+/g, " ").trim();
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "question"],
          message: "Quiz questions must be unique",
        });
      }
      seen.add(key);
    });
  });

const markdownArtifactSchema = z.object({
  title: z.string().trim().min(1),
  markdown: z.string().trim().min(20),
});

export const topicMaterialsSchema = z.object({
  studyGuide: markdownArtifactSchema,
  briefing: markdownArtifactSchema,
  quiz: quizSchema,
});

export type TopicClassification = z.infer<typeof classifyTopicSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type TopicMaterials = z.infer<typeof topicMaterialsSchema>;
