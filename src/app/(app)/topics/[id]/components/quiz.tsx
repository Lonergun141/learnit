"use client";

import { Check, LoaderCircle, RefreshCcw, TriangleAlert, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { Quiz as QuizData } from "@/lib/learning/schemas";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

import { recordQuizAttemptAction } from "../actions";
import { padScore, summarizeAttempts, type QuizAttempt } from "../lib/quiz-score";
import {
  checkCurrentAnswer,
  createQuizState,
  isQuizComplete,
  moveToNextQuestion,
  selectQuizOption,
} from "../lib/quiz-state";

interface QuizProps {
  quiz: QuizData;
  topicId: string;
  artifactId: string;
  /** Completed runs against this quiz version, newest first. */
  attempts: QuizAttempt[];
}

const optionLetters = ["A", "B", "C", "D", "E", "F"];
const historyLimit = 5;

export function Quiz({ quiz, topicId, artifactId, attempts }: QuizProps) {
  const [state, setState] = useState(createQuizState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const history = summarizeAttempts(attempts);
  const complete = isQuizComplete(state, quiz.questions.length);

  function recordAttempt(answers: number[]) {
    setSaveError(null);
    startSaving(async () => {
      const result = await recordQuizAttemptAction({ topicId, artifactId, answers });
      if (result.status === "error") {
        setSaveError(result.message ?? "We could not save that score.");
      }
    });
  }

  /**
   * The last "Score" press is what ends the run, so recording hangs off that
   * same click rather than an effect: the attempt is written once, by the action
   * that finished it, and never again on a re-render.
   */
  function advance() {
    const next = moveToNextQuestion(state);
    setState(next);
    if (isQuizComplete(next, quiz.questions.length)) recordAttempt(next.answers);
  }

  function restart() {
    setSaveError(null);
    setState(createQuizState());
  }

  if (complete) {
    const previous = history.attempts.slice(0, historyLimit);

    return (
      <div className="mx-auto grid min-h-[26rem] max-w-xl place-items-center py-4 text-center">
        <div className="w-full">
          <p className="mono-label">Complete</p>
          <p className="display mt-8 text-[5rem] leading-none tabular-nums text-signal">
            {padScore(state.score)}
            <span className="text-ink-faint">/{padScore(quiz.questions.length)}</span>
          </p>

          <p className="mono-label mt-6 flex items-center justify-center gap-2.5" role="status">
            {saving ? (
              <>
                <LoaderCircle className="animate-spin" size={12} /> Saving
              </>
            ) : saveError ? (
              <span className="flex items-center gap-2.5 text-danger">
                <TriangleAlert size={12} /> Not saved
              </span>
            ) : history.best ? (
              <>
                Best {padScore(history.best.score)}/{padScore(history.best.total_questions)}
                <span className="text-line-strong">·</span>
                {padScore(history.count)} {history.count === 1 ? "attempt" : "attempts"}
              </>
            ) : (
              <>Saved</>
            )}
          </p>

          {saveError ? (
            <div className="mt-6 border-l-2 border-danger bg-danger-soft/50 py-3 pl-5 text-left">
              <p className="text-sm leading-6 text-danger">{saveError}</p>
              <button
                className="bracket-link mt-3 text-danger"
                onClick={() => recordAttempt(state.answers)}
                type="button"
              >
                Try saving again
              </button>
            </div>
          ) : null}

          {previous.length > 0 ? (
            <dl className="mt-10 border-t border-line text-left">
              {previous.map((attempt) => (
                <div
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3"
                  key={attempt.id}
                >
                  <dt className="mono-label">{formatDate(attempt.completed_at)}</dt>
                  <dd
                    className={cn(
                      "font-mono text-[0.8125rem] tabular-nums",
                      attempt.id === history.best?.id ? "text-signal" : "text-ink-soft",
                    )}
                  >
                    {padScore(attempt.score)}/{padScore(attempt.total_questions)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <Button className="mt-10" onClick={restart} variant="secondary">
            <RefreshCcw size={15} /> Again
          </Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[state.questionIndex];
  const correct = state.selectedOption === question.correctIndex;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <p className="mono-label">
          {padScore(state.questionIndex + 1)}
          <span className="mx-2 text-line-strong">/</span>
          {padScore(quiz.questions.length)}
        </p>
        <p className="mono-label tabular-nums">
          {history.best ? (
            <>
              Best {padScore(history.best.score)}
              <span className="mx-2 text-line-strong">·</span>
            </>
          ) : null}
          Score {padScore(state.score)}
        </p>
      </div>
      <div className="mt-4 h-px w-full bg-line" aria-hidden="true">
        <div
          className="h-px bg-signal transition-[width] duration-500 ease-out"
          style={{ width: `${((state.questionIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <fieldset className="mt-12">
        <legend className="display text-[1.5rem] leading-[1.15] sm:text-[1.75rem]">
          {question.question}
        </legend>
        <div className="mt-10 grid">
          {question.options.map((option, index) => {
            const selected = state.selectedOption === index;
            const isCorrectAnswer = state.checked && index === question.correctIndex;
            const isWrongSelection = state.checked && selected && !isCorrectAnswer;
            return (
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-5 border-b border-line py-5 pl-5 text-sm leading-7 transition-colors duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-signal",
                  "border-l-2 border-l-transparent",
                  selected && !state.checked && "border-l-signal bg-signal-soft/50 text-ink",
                  isCorrectAnswer && "border-l-success bg-success-soft/60 text-success",
                  isWrongSelection && "border-l-danger bg-danger-soft/60 text-danger",
                  !selected && !state.checked && "hover:border-l-line-strong hover:bg-surface-muted/40",
                )}
                key={option}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selected}
                  disabled={state.checked}
                  onChange={() => setState((current) => selectQuizOption(current, index))}
                />
                <span className="mono-label mt-1 shrink-0" aria-hidden="true">
                  {optionLetters[index] ?? index + 1}
                </span>
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.checked ? (
        <div
          className={cn(
            "mt-8 border-l-2 py-4 pl-5",
            correct ? "border-success bg-success-soft/50 text-success" : "border-danger bg-danger-soft/50 text-danger",
          )}
          role="status"
        >
          <p className="flex items-center gap-2.5 font-display text-[0.8rem] font-semibold uppercase tracking-[0.08em]">
            {correct ? <Check size={15} /> : <X size={15} />}
            {correct ? "Correct" : question.options[question.correctIndex]}
          </p>
          <p className="mt-3 text-sm leading-7">{question.explanation}</p>
        </div>
      ) : null}

      <div className="mt-10 flex justify-end">
        {state.checked ? (
          <Button onClick={advance}>
            {state.questionIndex === quiz.questions.length - 1 ? "Score" : "Next"}
          </Button>
        ) : (
          <Button
            disabled={state.selectedOption === null}
            onClick={() => setState((current) => checkCurrentAnswer(current, question.correctIndex))}
          >
            Check
          </Button>
        )}
      </div>
    </div>
  );
}
