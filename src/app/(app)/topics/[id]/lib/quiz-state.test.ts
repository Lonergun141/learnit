import { describe, expect, it } from "vitest";

import {
  checkCurrentAnswer,
  createQuizState,
  moveToNextQuestion,
  selectQuizOption,
} from "./quiz-state";

describe("quiz state", () => {
  it("does not reveal an answer when an option is merely selected", () => {
    const state = selectQuizOption(createQuizState(), 2);
    expect(state).toMatchObject({ selectedOption: 2, checked: false, score: 0 });
  });

  it("scores a correct checked answer once", () => {
    const selected = selectQuizOption(createQuizState(), 1);
    const checked = checkCurrentAnswer(selected, 1);
    expect(checkCurrentAnswer(checked, 1)).toMatchObject({ checked: true, score: 1 });
  });

  it("moves forward while preserving the score", () => {
    const checked = checkCurrentAnswer(selectQuizOption(createQuizState(), 0), 1);
    expect(moveToNextQuestion(checked)).toEqual({
      questionIndex: 1,
      selectedOption: null,
      checked: false,
      score: 0,
    });
  });
});
