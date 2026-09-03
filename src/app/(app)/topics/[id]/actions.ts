"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { describeDatabaseFailure } from "@/lib/learning/errors";
import { quizSchema } from "@/lib/learning/schemas";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { gradeQuizAnswers } from "./lib/quiz-score";

export interface RecordQuizAttemptState {
  status: "recorded" | "error";
  score?: number;
  message?: string;
}

const recordAttemptSchema = z.object({
  topicId: z.uuid(),
  artifactId: z.uuid(),
  answers: z.array(z.number().int().nonnegative()).min(1).max(10),
});

/**
 * Records one finished run against the exact quiz artifact that was answered.
 *
 * The artifact is loaded by the id the browser was working from rather than
 * whichever quiz is current: if the worker rebuilt this topic mid-run, the
 * answers still belong to the questions that were on screen, and grading them
 * against a newer set would invent a score nobody earned.
 */
export async function recordQuizAttemptAction(
  input: z.input<typeof recordAttemptSchema>,
): Promise<RecordQuizAttemptState> {
  await requireAuthenticatedUser();

  const parsed = recordAttemptSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "That attempt could not be read." };

  const supabase = await createClient();
  const { data: artifact, error: artifactError } = await supabase
    .from("topic_artifacts")
    .select("id, content_json")
    .eq("id", parsed.data.artifactId)
    .eq("kind", "quiz")
    .maybeSingle();

  if (artifactError || !artifact) {
    return { status: "error", message: "That quiz is no longer available." };
  }

  const quiz = quizSchema.safeParse(artifact.content_json);
  if (!quiz.success) return { status: "error", message: "That quiz could not be scored." };

  let score: number;
  try {
    score = gradeQuizAnswers(quiz.data, parsed.data.answers);
  } catch {
    return { status: "error", message: "That attempt did not cover every question." };
  }

  const { error } = await supabase.rpc("record_quiz_attempt", {
    p_artifact_id: artifact.id,
    p_score: score,
    p_total_questions: quiz.data.questions.length,
  });

  if (error) {
    return {
      status: "error",
      message: describeDatabaseFailure(error, "We could not save that score."),
    };
  }

  revalidatePath(`/topics/${parsed.data.topicId}`);
  return { status: "recorded", score };
}
