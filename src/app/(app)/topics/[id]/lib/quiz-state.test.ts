import { describe, expect, it } from "vitest";

import {
  checkCurrentAnswer,
  createQuizState,
  isQuizComplete,
  moveToNextQuestion,
  selectQuizOption,
} from "./quiz-state";

describe("quiz state", () => {
  it("does not reveal an answer when an option is merely selected", () => {
    const state = selectQuizOption(createQuizState(), 2);
    expect(state).toMatchObject({ selectedOption: 2, checked: false, score: 0, answers: [] });
  });

  it("scores a correct checked answer once", () => {
    const selected = selectQuizOption(createQuizState(), 1);
    const checked = checkCurrentAnswer(selected, 1);
    expect(checkCurrentAnswer(checked, 1)).toMatchObject({
      checked: true,
      score: 1,
      answers: [1],
    });
  });

  it("moves forward while preserving the score and the answers so far", () => {
    const checked = checkCurrentAnswer(selectQuizOption(createQuizState(), 0), 1);
    expect(moveToNextQuestion(checked)).toEqual({
      questionIndex: 1,
      selectedOption: null,
      checked: false,
      score: 0,
      answers: [0],
    });
  });

  it("records every chosen option in question order", () => {
    const answered = [2, 0, 3].reduce(
      (state, choice) => moveToNextQuestion(checkCurrentAnswer(selectQuizOption(state, choice), 0)),
      createQuizState(),
    );

    expect(answered.answers).toEqual([2, 0, 3]);
    expect(answered.score).toBe(1);
  });

  it("is complete only once the last question has been left behind", () => {
    const onLastQuestion = { ...createQuizState(), questionIndex: 2 };
    expect(isQuizComplete(onLastQuestion, 3)).toBe(false);
    expect(isQuizComplete({ ...onLastQuestion, questionIndex: 3 }, 3)).toBe(true);
  });
});
