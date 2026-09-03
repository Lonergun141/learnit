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

const optionLetters = ["A", "B", "C", "D", "E", "F"];

export function Quiz({ quiz }: QuizProps) {
  const [state, setState] = useState(createQuizState);
  const complete = state.questionIndex >= quiz.questions.length;

  if (complete) {
    return (
      <div className="mx-auto grid min-h-[26rem] max-w-xl place-items-center text-center">
        <div>
          <p className="mono-label">Complete</p>
          <p className="display mt-8 text-[5rem] leading-none tabular-nums text-signal">
            {String(state.score).padStart(2, "0")}
            <span className="text-ink-faint">/{String(quiz.questions.length).padStart(2, "0")}</span>
          </p>
          <Button className="mt-12" onClick={() => setState(createQuizState())} variant="secondary">
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
          {String(state.questionIndex + 1).padStart(2, "0")}
          <span className="mx-2 text-line-strong">/</span>
          {String(quiz.questions.length).padStart(2, "0")}
        </p>
        <p className="mono-label tabular-nums">Score {String(state.score).padStart(2, "0")}</p>
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
          <Button onClick={() => setState(moveToNextQuestion)}>
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
