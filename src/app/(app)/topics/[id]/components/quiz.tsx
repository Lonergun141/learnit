"use client";

import { Check, RefreshCcw, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Quiz as QuizData } from "@/lib/learning/schemas";
import { cn } from "@/lib/utils/cn";

import {
  checkCurrentAnswer,
  createQuizState,
  moveToNextQuestion,
  selectQuizOption,
} from "../lib/quiz-state";

interface QuizProps {
  quiz: QuizData;
}

export function Quiz({ quiz }: QuizProps) {
  const [state, setState] = useState(createQuizState);
  const complete = state.questionIndex >= quiz.questions.length;

  if (complete) {
    return (
      <div className="mx-auto grid min-h-96 max-w-xl place-items-center text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <Check size={24} />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em] text-ink">Route complete</h2>
          <p className="mt-2 text-base text-ink-muted">
            You answered <strong className="font-semibold text-ink">{state.score}</strong> of{" "}
            <strong className="font-semibold text-ink">{quiz.questions.length}</strong> correctly.
          </p>
          <Button className="mt-6" onClick={() => setState(createQuizState())} variant="secondary">
            <RefreshCcw size={16} /> Try again
          </Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[state.questionIndex];
  const correct = state.selectedOption === question.correctIndex;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4 text-xs font-semibold text-ink-faint">
        <span>Question {state.questionIndex + 1} / {quiz.questions.length}</span>
        <span className="tabular-nums">Score {state.score}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-strong" aria-hidden="true">
        <div
          className="h-full rounded-full bg-signal transition-[width] duration-200"
          style={{ width: `${((state.questionIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>
      <fieldset className="mt-8">
        <legend className="text-xl font-semibold leading-7 tracking-[-0.02em] text-ink">{question.question}</legend>
        <div className="mt-6 grid gap-3">
          {question.options.map((option, index) => {
            const selected = state.selectedOption === index;
            const isCorrectAnswer = state.checked && index === question.correctIndex;
            const isWrongSelection = state.checked && selected && !isCorrectAnswer;
            return (
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border bg-surface px-4 py-3.5 text-sm leading-6 transition-colors",
                  selected && !state.checked && "border-signal bg-signal-soft",
                  isCorrectAnswer && "border-success bg-success-soft text-success",
                  isWrongSelection && "border-danger bg-danger-soft text-danger",
                  !selected && !state.checked && "hover:border-line-strong hover:bg-surface-muted",
                )}
                key={option}
              >
                <input
                  className="mt-1 size-4 accent-[#1f8f64]"
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selected}
                  disabled={state.checked}
                  onChange={() => setState((current) => selectQuizOption(current, index))}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.checked ? (
        <div className={cn("mt-5 rounded-xl px-4 py-4", correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger")} role="status">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {correct ? <Check size={17} /> : <X size={17} />}
            {correct ? "Correct" : `The correct answer is ${question.options[question.correctIndex]}.`}
          </p>
          <p className="mt-1.5 text-sm leading-6">{question.explanation}</p>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        {state.checked ? (
          <Button onClick={() => setState(moveToNextQuestion)}>
            {state.questionIndex === quiz.questions.length - 1 ? "See score" : "Next question"}
          </Button>
        ) : (
          <Button
            disabled={state.selectedOption === null}
            onClick={() => setState((current) => checkCurrentAnswer(current, question.correctIndex))}
          >
            Check answer
          </Button>
        )}
      </div>
    </div>
  );
}
