import { describe, expect, it } from "vitest";

import type { Quiz } from "@/lib/learning/schemas";

import { gradeQuizAnswers, padScore, summarizeAttempts, type QuizAttempt } from "./quiz-score";

function quizWithAnswers(correctIndexes: number[]): Quiz {
  return {
    title: "Sample",
    questions: correctIndexes.map((correctIndex, index) => ({
      id: `q${index}`,
      question: `Question ${index}`,
      options: ["A", "B", "C", "D"],
      correctIndex,
      explanation: "Because.",
      difficulty: "easy" as const,
    })),
  };
}

function attempt(id: string, score: number, completedAt: string): QuizAttempt {
  return { id, score, total_questions: 8, completed_at: completedAt };
}

describe("grading a finished run", () => {
  it("counts only the answers matching the quiz it was taken from", () => {
    expect(gradeQuizAnswers(quizWithAnswers([2, 0, 3, 1]), [2, 1, 3, 1])).toBe(3);
  });

  it("scores a perfect run as every question", () => {
    expect(gradeQuizAnswers(quizWithAnswers([0, 1, 2]), [0, 1, 2])).toBe(3);
  });

  it("scores a run with nothing right as zero", () => {
    expect(gradeQuizAnswers(quizWithAnswers([0, 1, 2]), [1, 2, 0])).toBe(0);
  });

  it("refuses an answer list that does not cover the quiz", () => {
    expect(() => gradeQuizAnswers(quizWithAnswers([0, 1, 2]), [0, 1])).toThrow(
      /every question exactly once/,
    );
    expect(() => gradeQuizAnswers(quizWithAnswers([0, 1]), [0, 1, 2])).toThrow(
      /every question exactly once/,
    );
  });
});

describe("summarizing attempt history", () => {
  it("reports nothing for an account that has not finished a run", () => {
    expect(summarizeAttempts([])).toEqual({
      count: 0,
      best: null,
      latest: null,
      attempts: [],
    });
  });

  it("finds the best score and the most recent run", () => {
    const history = summarizeAttempts([
      attempt("a", 5, "2026-09-01T10:00:00Z"),
      attempt("c", 4, "2026-09-03T10:00:00Z"),
      attempt("b", 7, "2026-09-02T10:00:00Z"),
    ]);

    expect(history.count).toBe(3);
    expect(history.best?.id).toBe("b");
    expect(history.latest?.id).toBe("c");
  });

  it("orders attempts newest first regardless of how they arrived", () => {
    const history = summarizeAttempts([
      attempt("a", 5, "2026-09-01T10:00:00Z"),
      attempt("c", 4, "2026-09-03T10:00:00Z"),
      attempt("b", 7, "2026-09-02T10:00:00Z"),
    ]);

    expect(history.attempts.map((entry) => entry.id)).toEqual(["c", "b", "a"]);
  });

  it("breaks a tie on the best score toward the most recent run", () => {
    const history = summarizeAttempts([
      attempt("older", 6, "2026-09-01T10:00:00Z"),
      attempt("newer", 6, "2026-09-04T10:00:00Z"),
    ]);

    expect(history.best?.id).toBe("newer");
  });

  it("leaves the caller's array untouched", () => {
    const attempts = [
      attempt("a", 5, "2026-09-01T10:00:00Z"),
      attempt("b", 7, "2026-09-02T10:00:00Z"),
    ];
    summarizeAttempts(attempts);

    expect(attempts.map((entry) => entry.id)).toEqual(["a", "b"]);
  });
});

describe("score formatting", () => {
  it("pads a single digit and leaves a longer one alone", () => {
    expect(padScore(7)).toBe("07");
    expect(padScore(10)).toBe("10");
  });
});
