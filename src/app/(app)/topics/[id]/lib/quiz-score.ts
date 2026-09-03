import type { Quiz } from "@/lib/learning/schemas";

/** One completed run, as stored and as read back for the history strip. */
export interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface AttemptHistory {
  count: number;
  best: QuizAttempt | null;
  latest: QuizAttempt | null;
  attempts: QuizAttempt[];
}

/**
 * Grades a finished run from the options the person chose.
 *
 * The browser already knows every correct answer — it has to, to mark each
 * question as you go — so this is not a secrecy measure. It is about the stored
 * number meaning what it says: the score in the table is derived from the same
 * quiz the questions came from, not from a count the client passed along.
 *
 * An answer list shorter or longer than the quiz is a bug, not a user action,
 * so it is rejected rather than padded.
 */
export function gradeQuizAnswers(quiz: Quiz, answers: number[]): number {
  if (answers.length !== quiz.questions.length) {
    throw new Error("A quiz attempt must answer every question exactly once");
  }

  return quiz.questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
    0,
  );
}

/**
 * Reduces the stored attempts to what the page shows: how many runs, the best
 * one, and the most recent. Ties on score resolve to the most recent run, which
 * is the one the person just finished.
 */
export function summarizeAttempts(attempts: QuizAttempt[]): AttemptHistory {
  const ordered = [...attempts].sort((left, right) =>
    right.completed_at.localeCompare(left.completed_at),
  );

  const best = ordered.reduce<QuizAttempt | null>(
    (leader, attempt) => (leader === null || attempt.score > leader.score ? attempt : leader),
    null,
  );

  return { count: ordered.length, best, latest: ordered[0] ?? null, attempts: ordered };
}

/** Two-digit form used everywhere a score or count is printed. */
export function padScore(value: number): string {
  return String(value).padStart(2, "0");
}
